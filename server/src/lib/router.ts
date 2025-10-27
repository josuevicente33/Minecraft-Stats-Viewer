import type http from "node:http";

type Handler = (req: http.IncomingMessage, res: http.ServerResponse) => Promise<void> | void;

export class Router {
    private routes: Array<{ method: string; pattern: RegExp; handler: Handler }> = [];

    on(method: string, pathPattern: RegExp, handler: Handler) {
        this.routes.push({ method: method.toUpperCase(), pattern: pathPattern, handler });
        return this;
    }

    async handle(req: http.IncomingMessage, res: http.ServerResponse) {
        const method = (req.method || "GET").toUpperCase();
        const url = req.url || "/";
        for (const r of this.routes) {
        if (r.method === method && r.pattern.test(url)) {
            await r.handler(req, res);
            return;
        }
        }
        res.statusCode = 404;
        res.end(JSON.stringify({ error: "Not found" }));
    }
}
