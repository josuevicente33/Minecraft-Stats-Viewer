export default function NotFound() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
            <h1 className="mb-4 text-6xl font-bold text-gray-800 dark:text-gray-200">404</h1>
            <p className="mb-8 text-center text-lg text-gray-600 dark:text-gray-400">
                Oops! The page you are looking for does not exist.
            </p>
        </div>
    );
}