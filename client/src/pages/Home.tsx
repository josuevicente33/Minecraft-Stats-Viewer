import { useEffect } from "react";
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
            <p className="text-gray-600 dark:text-gray-400 text-center">
                Welcome to the Minecraft Stats Viewer! This is dedicated to provide the users of The World a simple way to view server statistics without needing to log in-game.
                <br />
                Features: Server status, online players, and leaderboards are updated in real-time.
                <br />
                Basic information on the tech stack: React, TypeScript, Tailwind CSS, and Vite on the frontend; Node.js, Express with no database. The website is being hosted on a personal docker server where the Minecraft server is also hosted.
            </p>
            <div className="mt-6">
                <StatusBar />
            </div>
        </div>
    );
}