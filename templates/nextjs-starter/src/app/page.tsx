import Link from "next/link";
import { 
  Flame, 
  Zap, 
  Layers, 
  ShieldCheck, 
  ArrowRight, 
  Code, 
  LayoutDashboard,
  Cpu,
  Globe
} from "lucide-react";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden selection:bg-flare-orange/30">
      {/* Background Orbs */}
      <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-flare-orange/10 blur-[120px] rounded-full animate-float" />
      <div className="absolute top-[40%] -right-[10%] w-[30%] h-[30%] bg-flare-red/10 blur-[100px] rounded-full animate-float" style={{ animationDelay: '-2s' }} />

      <main className="relative z-10 max-w-6xl mx-auto px-6 pt-24 pb-32">
        {/* Navigation / Header */}
        <nav className="flex items-center justify-between mb-24 animate-slow-fade">
          <div className="flex items-center gap-2 group cursor-pointer">
            <div className="p-2 bg-flare-gradient rounded-xl shadow-lg group-hover:scale-110 transition-transform">
              <Flame className="size-6 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight uppercase">Flare<span className="text-flare-orange">CMS</span></span>
          </div>
          <div className="flex items-center gap-6 text-sm font-medium opacity-70 hover:opacity-100 transition-opacity">
            <Link href="https://flarecms.francy.dev" target="_blank">Documentation</Link>
            <Link href="https://github.com/fhorray/flarecms" target="_blank" className="flex items-center gap-1">
              <Code className="size-4" /> GitHub
            </Link>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="text-center mb-32 animate-slow-fade" style={{ animationDelay: '0.2s' }}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-flare-orange/10 border border-flare-orange/20 text-flare-orange text-xs font-bold uppercase tracking-widest mb-6">
            <Zap className="size-3" /> Now with Next.js 16 Support
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1]">
            Build Faster. Scale Further. <br />
            <span className="text-gradient">The AI-Era CMS.</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-foreground/60 mb-12 leading-relaxed">
            A lightweight, edge-ready CMS template powered by <strong>Bun</strong>, <strong>Hono</strong>, and <strong>Next.js</strong>. 
            Designed for high-performance applications on Cloudflare.
          </p>
          
          <div className="flex items-center justify-center gap-4 flex-col sm:flex-row">
            <Link href="/admin" className="h-14 px-8 bg-flare-gradient text-white rounded-2xl font-bold flex items-center gap-2 shadow-xl shadow-flare-orange/20 hover:scale-105 active:scale-95 transition-all">
              <LayoutDashboard className="size-5" /> Open Dashboard <ArrowRight className="size-4" />
            </Link>
            <Link href="https://nextjs.org/docs" target="_blank" className="h-14 px-8 glass-card rounded-2xl font-bold flex items-center gap-2 hover:bg-foreground/5 active:scale-95 transition-all">
              Read Next.js Docs
            </Link>
          </div>
        </section>

        {/* Bento Grid Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slow-fade" style={{ animationDelay: '0.4s' }}>
          {/* Main Feature */}
          <div className="md:col-span-2 glass-card p-10 rounded-[32px] overflow-hidden group cursor-default">
            <div className="flex flex-col h-full justify-between">
              <div>
                <div className="p-3 bg-blue-500/10 text-blue-500 rounded-2xl w-fit mb-6">
                  <Globe className="size-6" />
                </div>
                <h3 className="text-3xl font-bold mb-4">Edge Native Performance</h3>
                <p className="text-foreground/60 leading-relaxed max-w-md">
                  Optimized for Cloudflare Workers and Pages. Serve your content from the nearest location with zero cold starts using OpenNext.
                </p>
              </div>
              <div className="mt-12 opacity-50 group-hover:opacity-100 transition-opacity">
                <div className="flex gap-2">
                  <div className="px-3 py-1 rounded-full bg-foreground/5 text-[10px] font-bold uppercase">Cloudflare</div>
                  <div className="px-3 py-1 rounded-full bg-foreground/5 text-[10px] font-bold uppercase">D1 SQLite</div>
                  <div className="px-3 py-1 rounded-full bg-foreground/5 text-[10px] font-bold uppercase">KV Storage</div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="glass-card p-10 rounded-[32px] group">
            <div className="p-3 bg-purple-500/10 text-purple-500 rounded-2xl w-fit mb-6">
              <Layers className="size-6" />
            </div>
            <h3 className="text-2xl font-bold mb-4">Modular Plugins</h3>
            <p className="text-foreground/60 text-sm leading-relaxed">
              Extend functionality easily with a plug-and-play architecture. Admin dashboard and API are ready to scale.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="glass-card p-10 rounded-[32px] group">
            <div className="p-3 bg-orange-500/10 text-orange-500 rounded-2xl w-fit mb-6">
              <Cpu className="size-6" />
            </div>
            <h3 className="text-2xl font-bold mb-4">Unified Stack</h3>
            <p className="text-foreground/60 text-sm leading-relaxed">
              One monorepo, total control. Shared types between your CMS backend and Next.js frontend.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="md:col-span-2 glass-card p-10 rounded-[32px] group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform">
              <ShieldCheck className="size-32 text-flare-orange" />
            </div>
            <div className="relative z-10 max-w-lg">
              <h3 className="text-3xl font-bold mb-4">Production Ready</h3>
              <p className="text-foreground/60 leading-relaxed">
                Security-first approach with built-in Auth, CORS management, and strict schema validation with Zod. 
                Deploy to Cloudflare with one command.
              </p>
              <div className="mt-8">
                <code className="text-xs bg-black/5 dark:bg-white/5 p-3 rounded-xl block font-mono">
                  $ npx opennextjs-cloudflare deploy
                </code>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-6 py-12 border-t border-foreground/5 flex flex-col md:flex-row items-center justify-between gap-8 opacity-50 text-sm">
        <p>© {new Date().getFullYear()} FlareCMS. MIT Licensed.</p>
        <div className="flex items-center gap-8">
          <Link href="https://nextjs.org">Next.js</Link>
          <Link href="https://hono.dev">Hono</Link>
          <Link href="https://bun.sh">Bun</Link>
        </div>
      </footer>
    </div>
  );
}
