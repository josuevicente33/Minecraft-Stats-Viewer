import { useEffect } from "react";
import PlayerList from "../componets/ui/playerList";
import StatusBar from "../componets/ui/StatusBar";

export default function Home() {

    useEffect(() => {
        (async () => {
            const s = await fetch("/api/status").then(r => r.json());
            const players = await fetch("/api/players").then(r => r.json());
            const l = await fetch("/api/leaderboards").then(r => r.json());
            console.log({ s, players, l });
        })();
    }, []);

    return (
        <div className="p-4">
            <div className="mt-6">
                <StatusBar />
                <PlayerList />
            </div>
        </div>
    );
}