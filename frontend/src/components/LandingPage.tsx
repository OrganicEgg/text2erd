import React, { useState } from 'react';
import {
  Database,
  ArrowRight,
  Heart,
  Check,
  Sparkles,
  MousePointer,
  Download,
  Upload,
  Lock,
  Layers,
  Code2,
  Play,
} from 'lucide-react';
import { TEMPLATES } from '../utils/templates';

const GithubIcon: React.FC<{ className?: string }> = ({ className = 'h-4 w-4' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fillRule="evenodd"
      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      clipRule="evenodd"
    />
  </svg>
);

interface LandingPageProps {
  onLaunchApp: (initialDraft?: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLaunchApp }) => {
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState(0);
  const currentTemplate = TEMPLATES[selectedTemplateIndex];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500/30 font-sans overflow-x-hidden">
      {/* Background Glow Accents */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-indigo-600/15 blur-[120px]" />
        <div className="absolute top-1/3 -right-40 h-[600px] w-[600px] rounded-full bg-cyan-600/10 blur-[140px]" />
        <div className="absolute -bottom-40 left-1/3 h-[500px] w-[500px] rounded-full bg-purple-600/15 blur-[130px]" />
      </div>

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 shadow-lg shadow-indigo-600/30">
              <Database className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              Text2ERD
            </span>
            <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
              100% Free & Open
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">
              Features
            </a>
            <a href="#demo" className="hover:text-white transition-colors">
              Interactive Demo
            </a>
            <a href="#comparison" className="hover:text-white transition-colors">
              Why Text2ERD
            </a>
            <a
              href="https://github.com/OrganicEgg/text2erd"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 hover:text-white transition-colors"
            >
              <GithubIcon className="h-4 w-4" />
              <span>GitHub</span>
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <a
              href="https://github.com/OrganicEgg/text2erd"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <GithubIcon className="h-3.5 w-3.5" />
              <span>Star on GitHub</span>
            </a>
            <button
              onClick={() => onLaunchApp()}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all cursor-pointer"
            >
              <span>Launch Studio</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-16 pb-20 sm:pt-24 lg:pt-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          {/* Eyebrow Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-1 text-xs font-medium text-indigo-300 mb-8 shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            <span>Zero Sign-Up • No Paywalls • No 10-Table Limits</span>
          </div>

          {/* Headline */}
          <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
            Draft database tables in{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-sky-300 to-emerald-400 bg-clip-text text-transparent">
              plain text
            </span>
            . Turn them into diagrams instantly.
          </h1>

          {/* Subheading */}
          <p className="mx-auto mt-6 max-w-2xl text-base text-slate-400 sm:text-lg lg:text-xl leading-relaxed">
            Draft database schemas like you’re taking notes in a text file. Hit run,
            drag tables across an infinite canvas, link foreign keys visually, and export
            production-ready SQL.
          </p>

          {/* Hero CTAs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => onLaunchApp()}
              className="flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-6 py-3.5 text-sm font-semibold text-white shadow-xl shadow-indigo-600/30 hover:from-indigo-500 hover:to-indigo-400 transition-all cursor-pointer"
            >
              <Play className="h-4 w-4 fill-current" />
              <span>Open Free Studio (No Login)</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <a
              href="https://github.com/OrganicEgg/text2erd"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/90 px-5 py-3.5 text-sm font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition-all shadow-md"
            >
              <GithubIcon className="h-4 w-4" />
              <span>Explore GitHub Repo</span>
            </a>
          </div>

          {/* Trust Highlights */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-emerald-400" />
              <span>100% Free & Open Source (MIT)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-emerald-400" />
              <span>Zero Account Required</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-emerald-400" />
              <span>Completely Stateless & Private</span>
            </div>
          </div>
        </div>

        {/* Live Interactive Playground Hero Banner */}
        <div id="demo" className="mx-auto mt-16 max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-2 shadow-2xl shadow-indigo-950/40 backdrop-blur-xl">
            {/* Window Topbar */}
            <div className="flex items-center justify-between border-b border-slate-800/80 bg-slate-950/60 px-4 py-3 rounded-t-xl">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-rose-500/80" />
                  <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                  <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                </div>
                <span className="ml-2 text-xs font-medium text-slate-400 hidden sm:inline">
                  Interactive Preview Simulator
                </span>
              </div>

              {/* Template Selectors */}
              <div className="flex items-center gap-1.5">
                {TEMPLATES.map((tpl, i) => (
                  <button
                    key={tpl.name}
                    onClick={() => setSelectedTemplateIndex(i)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                      selectedTemplateIndex === i
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {tpl.name}
                  </button>
                ))}
                <button
                  onClick={() => onLaunchApp(currentTemplate.draft)}
                  className="ml-2 flex items-center gap-1 rounded-lg bg-emerald-600/20 border border-emerald-500/30 px-3 py-1 text-xs font-semibold text-emerald-300 hover:bg-emerald-600/30 transition-colors cursor-pointer"
                >
                  <span>Edit in Studio</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* Split Preview Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden rounded-b-xl min-h-[460px]">
              {/* Left: Notepad Preview */}
              <div className="lg:col-span-5 border-b lg:border-b-0 lg:border-r border-slate-800 bg-slate-950/90 p-4 font-mono text-xs text-slate-300 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-500 pb-2 border-b border-slate-800 mb-3">
                    <span>Draft Notepad Input</span>
                    <span className="text-emerald-400 font-normal">Shorthand Syntax</span>
                  </div>
                  <pre className="text-slate-200 leading-relaxed overflow-x-auto selection:bg-indigo-500/30">
                    <code>{currentTemplate.draft}</code>
                  </pre>
                </div>
                <div className="pt-4 border-t border-slate-800/80 mt-4 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Type <code className="text-cyan-400">-&gt; table.col</code> for relationships</span>
                  <button
                    onClick={() => onLaunchApp(currentTemplate.draft)}
                    className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <span>Open in visual canvas</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {/* Right: ERD Visual Cards Simulation */}
              <div className="lg:col-span-7 bg-slate-950/40 p-6 relative flex flex-col justify-center items-center overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

                <div className="relative z-10 w-full max-w-lg space-y-4">
                  {/* Table Card 1 */}
                  <div className="rounded-xl border border-slate-700 bg-slate-900/95 shadow-xl p-3.5 backdrop-blur-md">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-indigo-500" />
                        <span className="text-xs font-bold text-slate-100">users</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">3 cols</span>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center justify-between py-0.5">
                        <span className="text-amber-300 flex items-center gap-1 font-mono">
                          🔑 id
                        </span>
                        <span className="rounded bg-sky-950/60 border border-sky-800/50 px-1 text-[10px] font-mono text-sky-400">
                          INT
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-0.5">
                        <span className="text-slate-300 font-mono">email</span>
                        <span className="rounded bg-emerald-950/60 border border-emerald-800/50 px-1 text-[10px] font-mono text-emerald-400">
                          VARCHAR(255)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Relationship Connector Line */}
                  <div className="flex items-center justify-center gap-2 py-1">
                    <div className="h-[2px] flex-1 bg-gradient-to-r from-indigo-500 to-cyan-400" />
                    <span className="rounded-full border border-cyan-500/30 bg-slate-900 px-2.5 py-0.5 text-[10px] font-mono text-cyan-300 shadow-sm">
                      posts.user_id ➔ users.id
                    </span>
                    <div className="h-[2px] flex-1 bg-gradient-to-r from-cyan-400 to-indigo-500" />
                  </div>

                  {/* Table Card 2 */}
                  <div className="rounded-xl border border-indigo-500/60 bg-slate-900/95 shadow-xl shadow-indigo-500/5 p-3.5 backdrop-blur-md">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-cyan-400" />
                        <span className="text-xs font-bold text-slate-100">posts</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">4 cols</span>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center justify-between py-0.5">
                        <span className="text-amber-300 flex items-center gap-1 font-mono">
                          🔑 id
                        </span>
                        <span className="rounded bg-sky-950/60 border border-sky-800/50 px-1 text-[10px] font-mono text-sky-400">
                          INT
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-0.5">
                        <span className="text-cyan-300 flex items-center gap-1 font-mono">
                          🔗 user_id
                        </span>
                        <span className="rounded bg-sky-950/60 border border-sky-800/50 px-1 text-[10px] font-mono text-sky-400">
                          INT
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-0.5">
                        <span className="text-slate-300 font-mono">title</span>
                        <span className="rounded bg-emerald-950/60 border border-emerald-800/50 px-1 text-[10px] font-mono text-emerald-400">
                          VARCHAR(200)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 text-center">
                  <button
                    onClick={() => onLaunchApp(currentTemplate.draft)}
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-lg hover:bg-indigo-500 transition-all cursor-pointer"
                  >
                    <span>Launch & Move Tables Around</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section id="features" className="relative z-10 py-20 border-t border-slate-900 bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-3">
              Core Capabilities
            </h2>
            <p className="text-3xl font-extrabold sm:text-4xl tracking-tight text-white">
              Built for developers who value speed over bloated menus.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 hover:border-indigo-500/50 transition-all duration-300 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 mb-4 group-hover:scale-110 transition-transform">
                <Code2 className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-100 mb-2">
                Plain Text Shorthand
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Draft schemas like writing in Notepad. Define column names, data types,
                primary keys, and unique constraints without SQL syntax boilerplate.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 hover:border-cyan-500/50 transition-all duration-300 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 mb-4 group-hover:scale-110 transition-transform">
                <MousePointer className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-100 mb-2">
                True Two-Way Editing
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Don’t just view diagrams—interact with them. Drag handles to connect foreign keys,
                rename tables inline, and click "+ Add Column" directly on the canvas cards.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 hover:border-emerald-500/50 transition-all duration-300 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
                <Layers className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-100 mb-2">
                1-Click Dagre Auto-Layout
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Complex database with dozens of tables? Hit "Auto Layout" and our hierarchical
                graph algorithm instantly organizes and untangles your entire schema.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 hover:border-amber-500/50 transition-all duration-300 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 mb-4 group-hover:scale-110 transition-transform">
                <Download className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-100 mb-2">
                Multi-Dialect SQL Export
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Export clean, formatted DDL for PostgreSQL, MySQL, and SQLite. Copy to clipboard
                with one click or download the ready-to-run `.sql` schema file.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 hover:border-purple-500/50 transition-all duration-300 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 mb-4 group-hover:scale-110 transition-transform">
                <Upload className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-100 mb-2">
                SQL DDL Import Engine
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Already have an existing database dump? Paste raw `CREATE TABLE` and `ALTER TABLE`
                statements to instantly populate both the diagram and text editor.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 hover:border-rose-500/50 transition-all duration-300 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 mb-4 group-hover:scale-110 transition-transform">
                <Lock className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-100 mb-2">
                Stateless & 100% Private
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                No database models, no tracking cookies, and no cloud leaks. Close your browser tab
                and your session resets. Your proprietary architecture stays yours.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Head-to-Head Comparison Matrix */}
      <section id="comparison" className="relative z-10 py-20 border-t border-slate-900 bg-slate-950/80">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-2">
              Honest Comparison
            </h2>
            <p className="text-3xl font-extrabold text-white">
              Why developers switch to Text2ERD.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950/80 text-slate-300">
                <tr>
                  <th className="py-4 px-5 font-semibold">Feature / Metric</th>
                  <th className="py-4 px-5 font-bold text-indigo-400 bg-indigo-950/20">
                    Text2ERD (Us)
                  </th>
                  <th className="py-4 px-5 font-medium text-slate-400">dbdiagram.io</th>
                  <th className="py-4 px-5 font-medium text-slate-400">QuickDBD</th>
                  <th className="py-4 px-5 font-medium text-slate-400">Mermaid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                <tr>
                  <td className="py-3.5 px-5 font-medium">Account / Login Required</td>
                  <td className="py-3.5 px-5 font-bold text-emerald-400 bg-indigo-950/10">
                    ❌ None (Zero friction)
                  </td>
                  <td className="py-3.5 px-5 text-slate-400">Required</td>
                  <td className="py-3.5 px-5 text-slate-400">Required</td>
                  <td className="py-3.5 px-5 text-emerald-400">None</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-5 font-medium">Free Tier Table Limit</td>
                  <td className="py-3.5 px-5 font-bold text-emerald-400 bg-indigo-950/10">
                    ✨ Unlimited
                  </td>
                  <td className="py-3.5 px-5 text-slate-400">Limited</td>
                  <td className="py-3.5 px-5 text-rose-400">Max 10 tables</td>
                  <td className="py-3.5 px-5 text-emerald-400">Unlimited</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-5 font-medium">Two-Way Interactive Canvas</td>
                  <td className="py-3.5 px-5 font-bold text-emerald-400 bg-indigo-950/10">
                    ✅ Drag, add, delete on canvas
                  </td>
                  <td className="py-3.5 px-5 text-slate-400">Code-only editing</td>
                  <td className="py-3.5 px-5 text-slate-400">Code-only editing</td>
                  <td className="py-3.5 px-5 text-rose-400">Static image only</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-5 font-medium">Multi-Dialect SQL Export</td>
                  <td className="py-3.5 px-5 font-bold text-emerald-400 bg-indigo-950/10">
                    ✅ 1-Click Free
                  </td>
                  <td className="py-3.5 px-5 text-slate-400">Yes</td>
                  <td className="py-3.5 px-5 text-rose-400">Paywalled</td>
                  <td className="py-3.5 px-5 text-rose-400">No export</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-5 font-medium">Price</td>
                  <td className="py-3.5 px-5 font-bold text-emerald-400 bg-indigo-950/10">
                    $0 (100% Free Forever)
                  </td>
                  <td className="py-3.5 px-5 text-slate-400">$9 – $25 / month</td>
                  <td className="py-3.5 px-5 text-slate-400">$14 / month</td>
                  <td className="py-3.5 px-5 text-emerald-400">$0</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Community & Donation CTA */}
      <section className="relative z-10 py-16 border-t border-slate-900 bg-gradient-to-b from-slate-950 to-indigo-950/30">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600/20 text-indigo-400 mb-4 ring-1 ring-indigo-500/30">
            <Heart className="h-6 w-6 text-rose-400 fill-rose-400/20" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            100% Free & Open Source. No Strings Attached.
          </h2>
          <p className="mt-3 text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
            Text2ERD was built out of frustration with paywalled diagramming tools.
            Use it, export your schemas, and build great software. If it saves you time,
            consider starring the repo or buying a coffee—always 100% optional!
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => onLaunchApp()}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all cursor-pointer"
            >
              <span>Start Designing Now</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>

            <a
              href="https://github.com/OrganicEgg/text2erd"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition-all"
            >
              <GithubIcon className="h-4 w-4" />
              <span>Star on GitHub</span>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-indigo-400" />
            <span className="font-semibold text-slate-300">Text2ERD</span>
            <span>— Licensed under MIT</span>
          </div>

          <div className="flex items-center gap-6">
            <a
              href="https://github.com/OrganicEgg/text2erd"
              target="_blank"
              rel="noreferrer"
              className="hover:text-slate-300 transition-colors"
            >
              GitHub Repository
            </a>
            <button
              onClick={() => onLaunchApp()}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              Open Studio
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
