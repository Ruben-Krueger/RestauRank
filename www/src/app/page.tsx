import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-gray-800 dark:bg-gray-900 dark:text-white grid grid-rows-[20px_1fr_20px] items-center justify-items-center p-20 gap-16">
      <main className="flex flex-col gap-8 row-start-2">
        <h1 className="text-4xl font-bold text-foreground">Welcome</h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          RestauRank is the easiest way to agree on restaurants with friends.
        </p>
        <div className="flex gap-4">
          <Link
            href="/create"
            className="bg-foreground text-background px-5 py-3 rounded-full font-medium transition-colors hover:bg-red-600 border-2 border-red-500 hover:border-transparent"
          >
            Begin
          </Link>
        </div>
      </main>
    </div>
  );
}
