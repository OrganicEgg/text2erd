import React, { useState } from 'react';
import { TEMPLATES } from '../utils/templates';
import type { PresetTemplate } from '../utils/templates';
import { Play, RotateCcw, HelpCircle, ChevronDown, Sparkles } from 'lucide-react';

interface NotepadEditorProps {
  draftText: string;
  onChangeDraft: (val: string) => void;
  onRunDraft: () => void;
  onReset: () => void;
  loading: boolean;
}

export const NotepadEditor: React.FC<NotepadEditorProps> = ({
  draftText,
  onChangeDraft,
  onRunDraft,
  onReset,
  loading,
}) => {
  const [showGuide, setShowGuide] = useState(false);

  const handleSelectTemplate = (tpl: PresetTemplate) => {
    onChangeDraft(tpl.draft);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl+Enter or Cmd+Enter to Run
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      onRunDraft();
    }
    // Tab key indent support
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const val = target.value;
      const newVal = val.substring(0, start) + '  ' + val.substring(end);
      onChangeDraft(newVal);
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      }, 0);
    }
  };

  return (
    <div className="flex h-full flex-col border-r border-slate-800 bg-slate-900/90 w-full">
      {/* Editor Top Bar */}
      <div className="flex items-center justify-between border-b border-slate-800/80 px-4 py-3 bg-slate-950/40">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
            <span>Schema Draft</span>
          </div>
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-indigo-400 transition-colors"
            title="Syntax guide"
          >
            <HelpCircle className="h-3 w-3" />
            <span>Guide</span>
          </button>
        </div>

        {/* Template Quick Select */}
        <div className="flex items-center gap-2">
          <div className="relative group">
            <button className="flex items-center gap-1 rounded-lg border border-slate-700/80 bg-slate-800/60 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:bg-slate-800 hover:text-slate-100 transition-colors">
              <Sparkles className="h-3 w-3 text-amber-400" />
              <span>Templates</span>
              <ChevronDown className="h-2.5 w-2.5 text-slate-400" />
            </button>
            <div className="absolute right-0 top-full mt-1 hidden w-48 rounded-xl border border-slate-700 bg-slate-900 p-1.5 shadow-xl shadow-black/60 group-hover:block z-30">
              <div className="text-[10px] font-semibold text-slate-400 px-2 py-1 uppercase tracking-wider">
                Load Template
              </div>
              {TEMPLATES.map((tpl) => (
                <button
                  key={tpl.name}
                  onClick={() => handleSelectTemplate(tpl)}
                  className="flex w-full flex-col items-start rounded-lg px-2 py-1.5 text-left text-xs hover:bg-indigo-600/20 hover:text-indigo-300 transition-colors"
                >
                  <span className="font-medium text-slate-200">{tpl.name}</span>
                  <span className="text-[10px] text-slate-400 truncate max-w-full">
                    {tpl.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={onReset}
            className="rounded-lg border border-slate-800 p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
            title="Reset to blank canvas"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Syntax Guide Box (Collapsible) */}
      {showGuide && (
        <div className="border-b border-indigo-900/40 bg-indigo-950/20 p-3 text-[11px] text-indigo-200/90 space-y-1.5">
          <div className="font-semibold text-indigo-300 flex items-center justify-between">
            <span>Quick Drafting Cheat Sheet</span>
            <button
              onClick={() => setShowGuide(false)}
              className="text-slate-400 hover:text-slate-200 text-xs"
            >
              ✕
            </button>
          </div>
          <p className="text-slate-300">
            Write table name, then indent column definitions:
          </p>
          <pre className="rounded bg-slate-950/70 p-2 font-mono text-[10px] text-emerald-400 leading-relaxed border border-indigo-900/40">
{`users
  id int pk
  email varchar(255) unique not null
  created_at timestamp

posts
  id int pk
  user_id int -> users.id
  title varchar(200)`}
          </pre>
          <p className="text-[10px] text-slate-400">
            Use <code className="text-cyan-300">-&gt; table.col</code> to connect foreign keys. Press <kbd className="rounded bg-slate-800 px-1 py-0.5 text-white">Ctrl+Enter</kbd> to visualize!
          </p>
        </div>
      )}

      {/* Main Text Area */}
      <div className="relative flex-1 p-3">
        <textarea
          value={draftText}
          onChange={(e) => onChangeDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`# Type your tables here...\n\nusers\n  id int pk\n  name varchar(100)\n\nposts\n  id int pk\n  user_id int -> users.id\n  title varchar(200)`}
          spellCheck={false}
          className="h-full w-full resize-none rounded-xl border border-slate-800/90 bg-slate-950/80 p-3 font-mono text-xs text-slate-200 placeholder:text-slate-600 focus:border-indigo-500/80 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 leading-relaxed"
        />
      </div>

      {/* Bottom Action Footer */}
      <div className="flex items-center justify-between border-t border-slate-800/80 bg-slate-950/60 px-4 py-2.5">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <kbd className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-300 border border-slate-700">
            Ctrl
          </kbd>
          <span>+</span>
          <kbd className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-300 border border-slate-700">
            Enter
          </kbd>
          <span className="ml-1 text-slate-500">to render</span>
        </div>

        <button
          onClick={onRunDraft}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-50 transition-all cursor-pointer"
        >
          <Play className="h-3.5 w-3.5 fill-current" />
          <span>{loading ? 'Rendering...' : 'Run / Visualize'}</span>
        </button>
      </div>
    </div>
  );
};
