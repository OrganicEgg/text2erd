import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDatabase,
  faArrowRight,
  faCheck,
  faCode,
  faHandPointer,
  faLayerGroup,
  faFileExport,
  faFileImport,
  faShieldHalved,
  faPlay,
  faKey,
  faLink,
} from '@fortawesome/free-solid-svg-icons';
import { TEMPLATES } from '../utils/templates';

interface LandingPageProps {
  onLaunchApp: (initialDraft?: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLaunchApp }) => {
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState(0);
  const currentTemplate = TEMPLATES[selectedTemplateIndex];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-green-100 selection:text-green-900">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-2xs">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-600 text-white shadow-xs">
              <FontAwesomeIcon icon={faDatabase} className="text-sm" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">
              Text2ERD
            </span>
            <span className="rounded-full bg-green-50 border border-green-200 px-2.5 py-0.5 text-[11px] font-semibold text-green-700">
              Free Web Tool
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-green-700 transition-colors">
              Features
            </a>
            <a href="#demo" className="hover:text-green-700 transition-colors">
              Interactive Preview
            </a>
            <a href="#comparison" className="hover:text-green-700 transition-colors">
              Overview
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onLaunchApp()}
              className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-green-700 transition-all cursor-pointer"
            >
              <span>Launch Studio</span>
              <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-14 pb-16 sm:pt-20 lg:pt-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          {/* Eyebrow Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3.5 py-1 text-xs font-semibold text-green-800 mb-6 shadow-2xs">
            <span className="h-2 w-2 rounded-full bg-green-600" />
            <span>Fast, Browser-Based Schema Drafting • No Registration Required</span>
          </div>

          {/* Headline */}
          <h1 className="mx-auto max-w-4xl text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl leading-tight">
            Draft database tables in{' '}
            <span className="text-green-600">
              plain text
            </span>
            . Visualize schemas instantly.
          </h1>

          {/* Subheading */}
          <p className="mx-auto mt-5 max-w-2xl text-base text-slate-600 sm:text-lg leading-relaxed">
            Write tables and columns in simple shorthand. Generate clean interactive diagrams,
            arrange nodes with automatic layout, connect foreign keys, and export SQL DDL.
          </p>

          {/* Hero CTAs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => onLaunchApp()}
              className="flex items-center gap-2.5 rounded-lg bg-green-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-green-700 transition-all cursor-pointer"
            >
              <FontAwesomeIcon icon={faPlay} className="text-xs" />
              <span>Open Studio (No Sign-Up)</span>
              <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
            </button>
          </div>

          {/* Trust Highlights */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 font-medium">
            <div className="flex items-center gap-1.5">
              <FontAwesomeIcon icon={faCheck} className="text-green-600" />
              <span>100% Free to Use</span>
            </div>
            <div className="flex items-center gap-1.5">
              <FontAwesomeIcon icon={faCheck} className="text-green-600" />
              <span>No Account or Login Required</span>
            </div>
            <div className="flex items-center gap-1.5">
              <FontAwesomeIcon icon={faCheck} className="text-green-600" />
              <span>Runs In Your Browser</span>
            </div>
          </div>
        </div>

        {/* Live Interactive Preview */}
        <div id="demo" className="mx-auto mt-12 max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-lg">
            {/* Window Topbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/80 px-4 py-3 rounded-t-xl">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-slate-300" />
                  <div className="h-3 w-3 rounded-full bg-slate-300" />
                  <div className="h-3 w-3 rounded-full bg-slate-300" />
                </div>
                <span className="ml-2 text-xs font-semibold text-slate-700">
                  Schema Examples
                </span>
              </div>

              {/* Template Selectors */}
              <div className="flex items-center gap-1.5">
                {TEMPLATES.map((tpl, i) => (
                  <button
                    key={tpl.name}
                    onClick={() => setSelectedTemplateIndex(i)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                      selectedTemplateIndex === i
                        ? 'bg-green-600 text-white shadow-2xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    {tpl.name}
                  </button>
                ))}
                <button
                  onClick={() => onLaunchApp(currentTemplate.draft)}
                  className="ml-2 flex items-center gap-1 rounded-lg bg-green-50 border border-green-200 px-3 py-1 text-xs font-semibold text-green-700 hover:bg-green-100 transition-colors cursor-pointer"
                >
                  <span>Edit in Studio</span>
                  <FontAwesomeIcon icon={faArrowRight} className="text-[10px]" />
                </button>
              </div>
            </div>

            {/* Split Preview Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden rounded-b-xl min-h-[420px]">
              {/* Left: Notepad Preview */}
              <div className="lg:col-span-5 border-b lg:border-b-0 lg:border-r border-slate-200 bg-slate-50/70 p-4 font-mono text-xs text-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500 pb-2 border-b border-slate-200 mb-3">
                    <span>Draft Shorthand Input</span>
                    <span className="text-green-700 font-semibold lowercase">text format</span>
                  </div>
                  <pre className="text-slate-800 leading-relaxed overflow-x-auto bg-white p-3 rounded-lg border border-slate-200">
                    <code>{currentTemplate.draft}</code>
                  </pre>
                </div>
                <div className="pt-3 border-t border-slate-200 mt-4 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Use <code className="text-green-700 font-mono font-medium">-&gt; table.col</code> for links</span>
                  <button
                    onClick={() => onLaunchApp(currentTemplate.draft)}
                    className="text-green-700 hover:text-green-800 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <span>Open in Studio</span>
                    <FontAwesomeIcon icon={faArrowRight} className="text-[10px]" />
                  </button>
                </div>
              </div>

              {/* Right: ERD Visual Cards Simulation */}
              <div className="lg:col-span-7 bg-white p-6 relative flex flex-col justify-center items-center overflow-hidden">
                <div className="relative z-10 w-full max-w-md space-y-4">
                  {/* Table Card 1 */}
                  <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-3.5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-600" />
                        <span className="text-xs font-bold text-slate-900">users</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">3 cols</span>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center justify-between py-0.5">
                        <span className="text-slate-800 flex items-center gap-1.5 font-mono text-[11px]">
                          <FontAwesomeIcon icon={faKey} className="text-amber-500 text-[10px]" />
                          <span>id</span>
                        </span>
                        <span className="rounded bg-slate-100 px-1.5 text-[10px] font-mono text-slate-600 font-medium">
                          INT
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-0.5">
                        <span className="text-slate-700 font-mono text-[11px]">email</span>
                        <span className="rounded bg-slate-100 px-1.5 text-[10px] font-mono text-slate-600 font-medium">
                          VARCHAR(255)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Relationship Connector Line */}
                  <div className="flex items-center justify-center gap-2 py-1">
                    <div className="h-[2px] flex-1 bg-green-500" />
                    <span className="rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5 text-[10px] font-mono font-medium text-green-800 shadow-2xs">
                      posts.user_id ➔ users.id
                    </span>
                    <div className="h-[2px] flex-1 bg-green-500" />
                  </div>

                  {/* Table Card 2 */}
                  <div className="rounded-xl border border-green-300 bg-white shadow-sm p-3.5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-600" />
                        <span className="text-xs font-bold text-slate-900">posts</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">4 cols</span>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center justify-between py-0.5">
                        <span className="text-slate-800 flex items-center gap-1.5 font-mono text-[11px]">
                          <FontAwesomeIcon icon={faKey} className="text-amber-500 text-[10px]" />
                          <span>id</span>
                        </span>
                        <span className="rounded bg-slate-100 px-1.5 text-[10px] font-mono text-slate-600 font-medium">
                          INT
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-0.5">
                        <span className="text-green-700 flex items-center gap-1.5 font-mono text-[11px] font-medium">
                          <FontAwesomeIcon icon={faLink} className="text-green-600 text-[10px]" />
                          <span>user_id</span>
                        </span>
                        <span className="rounded bg-slate-100 px-1.5 text-[10px] font-mono text-slate-600 font-medium">
                          INT
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-0.5">
                        <span className="text-slate-700 font-mono text-[11px]">title</span>
                        <span className="rounded bg-slate-100 px-1.5 text-[10px] font-mono text-slate-600 font-medium">
                          VARCHAR(200)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 text-center">
                  <button
                    onClick={() => onLaunchApp(currentTemplate.draft)}
                    className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-green-700 transition-all cursor-pointer"
                  >
                    <span>Launch & Drag Tables</span>
                    <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section id="features" className="relative z-10 py-16 border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-xs font-bold uppercase tracking-widest text-green-700 mb-2">
              Features
            </h2>
            <p className="text-2xl font-extrabold sm:text-3xl tracking-tight text-slate-900">
              Straightforward tools for modeling databases.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-6 hover:border-green-300 transition-colors">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-700 mb-4">
                <FontAwesomeIcon icon={faCode} className="text-base" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1.5">
                Plain Text Drafting
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Draft schemas by typing table and column names with simple data types,
                primary key flags, and unique constraints.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-6 hover:border-green-300 transition-colors">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-700 mb-4">
                <FontAwesomeIcon icon={faHandPointer} className="text-base" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1.5">
                Interactive Canvas
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Drag tables freely across the screen. Connect foreign key handles between columns,
                rename tables inline, or add columns directly on cards.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-6 hover:border-green-300 transition-colors">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-700 mb-4">
                <FontAwesomeIcon icon={faLayerGroup} className="text-base" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1.5">
                Dagre Auto-Layout
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                With one click, arrange all tables and relations in a clean hierarchical layout
                to untangle overlapping connections.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-6 hover:border-green-300 transition-colors">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-700 mb-4">
                <FontAwesomeIcon icon={faFileExport} className="text-base" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1.5">
                SQL DDL Export
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Export standard SQL for PostgreSQL, MySQL, and SQLite. Copy directly or
                download a ready-to-run `.sql` file.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-6 hover:border-green-300 transition-colors">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-700 mb-4">
                <FontAwesomeIcon icon={faFileImport} className="text-base" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1.5">
                SQL DDL Import
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Paste existing `CREATE TABLE` and `FOREIGN KEY` statements to immediately generate
                the visual diagram and editable text draft.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-6 hover:border-green-300 transition-colors">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-700 mb-4">
                <FontAwesomeIcon icon={faShieldHalved} className="text-base" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1.5">
                Private & Client-Side
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Drafts are processed right in your browser. No mandatory user accounts,
                no tracking database, and no session lock-in.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Matrix */}
      <section id="comparison" className="relative z-10 py-16 border-t border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-xs font-bold uppercase tracking-widest text-green-700 mb-2">
              Comparison
            </h2>
            <p className="text-2xl font-extrabold text-slate-900">
              How Text2ERD fits your workflow.
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-100/70 text-slate-700">
                <tr>
                  <th className="py-3 px-4 font-bold">Feature</th>
                  <th className="py-3 px-4 font-bold text-green-800 bg-green-50/70">
                    Text2ERD
                  </th>
                  <th className="py-3 px-4 font-medium text-slate-500">Traditional ERD Tools</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr>
                  <td className="py-3 px-4 font-medium">Account Requirement</td>
                  <td className="py-3 px-4 font-semibold text-green-700 bg-green-50/30">
                    None (Open directly in browser)
                  </td>
                  <td className="py-3 px-4 text-slate-500">Sign-up / login often required</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">Text & Visual Editing</td>
                  <td className="py-3 px-4 font-semibold text-green-700 bg-green-50/30">
                    Both shorthand text & canvas editing
                  </td>
                  <td className="py-3 px-4 text-slate-500">Often text-only or drag-and-drop only</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">SQL Export / Import</td>
                  <td className="py-3 px-4 font-semibold text-green-700 bg-green-50/30">
                    Included (Postgres, MySQL, SQLite)
                  </td>
                  <td className="py-3 px-4 text-slate-500">Frequently restricted or paid</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">Pricing</td>
                  <td className="py-3 px-4 font-semibold text-green-700 bg-green-50/30">
                    Free for everyone
                  </td>
                  <td className="py-3 px-4 text-slate-500">Subscription tiers</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Quick Launch CTA Banner */}
          <div className="mt-12 rounded-xl border border-green-200 bg-green-50/80 p-8 text-center shadow-xs">
            <h3 className="text-xl font-bold text-green-950 mb-2">
              Ready to draft your schema?
            </h3>
            <p className="text-xs text-green-800 max-w-md mx-auto mb-5 leading-relaxed">
              Launch the studio now to start drafting or explore the preset templates.
            </p>
            <button
              onClick={() => onLaunchApp()}
              className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-green-700 transition-colors cursor-pointer"
            >
              <span>Open Studio</span>
              <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faDatabase} className="text-green-600 text-xs" />
            <span className="font-semibold text-slate-800">Text2ERD</span>
            <span>— Free Online Database Schema Drafting</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => onLaunchApp()}
              className="font-medium text-green-700 hover:text-green-800 transition-colors cursor-pointer"
            >
              Launch Studio
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
