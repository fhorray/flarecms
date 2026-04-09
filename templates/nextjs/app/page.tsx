import Image from "next/image";

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)] bg-black text-white selection:bg-yellow-400 selection:text-black">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start max-w-2xl text-center sm:text-left">
        <h1 className="text-5xl sm:text-7xl font-bold tracking-tight bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent animate-gradient">
          FlareCMS + Next.js
        </h1>
        <p className="text-xl text-gray-400 leading-relaxed">
          Welcome to your new ultra-fast blog powered by FlareCMS and Next.js 15. Your content is served from the edge, ensuring the lowest latency possible globally.
        </p>

        <div className="flex gap-4 items-center flex-col sm:flex-row mt-4 w-full justify-center sm:justify-start">
          <a
            className="rounded-full border border-solid border-transparent transition-all flex items-center justify-center bg-white text-black gap-2 hover:bg-[#ccc] text-sm sm:text-base h-12 px-8 font-bold shadow-xl shadow-orange-500/10"
            href="/admin"
          >
            Go to Admin Dashboard
          </a>
          <a
            className="rounded-full border border-solid border-white/[.145] transition-all flex items-center justify-center hover:bg-[#1a1a1a] hover:border-transparent text-sm sm:text-base h-12 px-8 font-medium"
            href="https://github.com/fhorray/flarecms"
            target="_blank"
            rel="noopener noreferrer"
          </a>
        </div>
      </main>
      
      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center text-gray-500 text-sm">
        <p>© 2026 FlareCMS. Built for the Edge.</p>
      </footer>
    </div>
  );
}
