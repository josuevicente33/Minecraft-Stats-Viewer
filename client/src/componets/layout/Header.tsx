export default function Header() {
    return (
        <header className="w-full bg-gray-800 text-white p-4 flex items-center justify-center shadow-md z-10">
            <h1 className="text-2xl font-bold">Minecraft Stats Viewer</h1>
            <nav className="ml-auto space-x-4">
                <a href="/" className="hover:underline">Home</a>
                <a href="/players" className="hover:underline">Players</a>
                <a href="/leaderboard" className="hover:underline">Leaderboard</a>
            </nav>
        </header>
    );
}