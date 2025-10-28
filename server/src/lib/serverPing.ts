import net from "node:net";
import { Buffer } from "node:buffer";

// helpers for VarInt
function writeVarInt(n: number) {
  const out: number[] = []; let v = n >>> 0;
  do { let b = v & 0x7f; v >>>= 7; if (v) b |= 0x80; out.push(b); } while (v);
  return Buffer.from(out);
}
function readVarInt(buf: Buffer, o = 0) {
  let num = 0, r = 0, b = 0;
  do { b = buf[o + r]; num |= (b & 0x7f) << (7 * r); r++; if (r > 5) throw new Error("varint too big"); }
  while (b & 0x80); return { value: num, size: r };
}

export async function serverListPing(host: string, port = 25565, timeoutMs = 3000) {
  const start = Date.now();
  return new Promise<{
    online: boolean;
    latency_ms: number;
    version?: string;
    players?: { online: number; max: number; sample?: { name: string; id: string }[] };
    motd?: string;
    raw?: any;
  }>((resolve) => {
    let done = false;
    const finish = (v: any) => { if (!done) { done = true; try { sock.destroy(); } catch {} resolve(v); } };
    const sock = new net.Socket();
    const timer = setTimeout(() => finish({ online: false, latency_ms: timeoutMs }), timeoutMs);

    sock.once("error", () => finish({ online: false, latency_ms: Date.now() - start }));
    sock.once("close", () => finish({ online: false, latency_ms: Date.now() - start }));

    sock.connect(port, host, () => {
      // handshake
      const pv = 767; // protocol version (approx for 1.21.x; value isn’t strict for status)
      const hostBuf = Buffer.from(host, "utf8");
      const portBuf = Buffer.alloc(2); portBuf.writeUInt16BE(port, 0);
      const handshake = Buffer.concat([
        writeVarInt(pv),
        writeVarInt(hostBuf.length),
        hostBuf,
        portBuf,
        writeVarInt(1) // next state = status
      ]);
      const packetId = writeVarInt(0x00);
      const packetLen = writeVarInt(packetId.length + handshake.length);
      sock.write(Buffer.concat([packetLen, packetId, handshake]));

      // status request (id 0x00, empty)
      const reqId = writeVarInt(0x00);
      const reqLen = writeVarInt(reqId.length);
      sock.write(Buffer.concat([reqLen, reqId]));
    });

    let buf = Buffer.alloc(0);
    sock.on("data", (d) => {
      buf = Buffer.concat([buf, d]);
      try {
        const { value: pktLen, size: s1 } = readVarInt(buf, 0);
        if (buf.length < s1 + pktLen) return; // wait more
        const { value: pid, size: s2 } = readVarInt(buf, s1);
        if (pid !== 0x00) return; // ignore pings
        const { value: strLen, size: s3 } = readVarInt(buf, s1 + s2);
        const startIdx = s1 + s2 + s3;
        const json = buf.slice(startIdx, startIdx + strLen).toString("utf8");
        const parsed = JSON.parse(json);

        const latency_ms = Date.now() - start;
        const players = parsed?.players;
        const version = parsed?.version?.name;
        const motd = typeof parsed?.description === "string"
          ? parsed.description
          : parsed?.description?.text ?? undefined;

        clearTimeout(timer);
        finish({ online: true, latency_ms, version, players, motd, raw: parsed });
      } catch {
        // keep buffering
      }
    });
  });
}
