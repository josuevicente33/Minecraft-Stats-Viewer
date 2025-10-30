import StatusBar from "../components/ui/StatusBar";

export default function Home() {
    return (
        <div className="p-4">
            <StatusBar />

            <p className="text-gray-600 dark:text-gray-400 text-center">
                Welcome to the Minecraft Stats Viewer! This is dedicated to provide the users of The World a simple way to view server statistics without needing to log in-game.
                <br />
                Features: Server status, online players, and leaderboards are updated in real-time.
                <br />
                Basic information on the tech stack: React, TypeScript, Tailwind CSS, and Vite on the frontend; Node.js. The website is being hosted on a personal docker server along with the Minecraft server.
            </p>

        </div>
    );
}