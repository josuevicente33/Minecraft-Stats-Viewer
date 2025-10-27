export type Player = {
    uuid: string;
    name: string;
}
export type Status = {
    online: number;
    max: number;
    names: string[];
}

export type TopRow = { id: string; value: number };
export type AdvItem = { id: string; when: string };

export type PlayerSummary = {
  name: string;
  uuid: string;
  lastSeen: string | null;
  stats: {
    playTime: number; deaths: number; mobKills: number; playerKills: number;
    jumps: number; walkCm: number; flyCm: number; boatCm: number; minecartCm: number;
    horseCm: number; swimCm: number; damageDealt: number; damageTaken: number;
    timeSinceDeath: number; timeSinceRest: number;
  };
  top: {
    mined: TopRow[]; used: TopRow[]; broken?: TopRow[];
    mobsKilled: TopRow[]; killedBy: TopRow[];
  };
  advancements: {
    total: number;
    recent: AdvItem[];
  };
};

export type PlayerWithAll = PlayerSummary & {
  advancements: PlayerSummary["advancements"] & { all: AdvItem[] };
};

export type AdvMerged = { id: string; title: string; parent: string | null; done: boolean; when: string | null };