import React, { useState } from 'react';
import { TEMPLATES } from '../utils/templates';
import type { PresetTemplate } from '../utils/templates';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlay,
  faRotateLeft,
  faCircleQuestion,
  faAngleDown,
  faWandMagicSparkles,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';

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
    <div className="flex h-full flex-col border-r border-slate-200 bg-slate-50 w-full">
      {/* Editor Top Bar */}
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 bg-white">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-800">
            Schema Draft
          </span>
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-green-700 transition-colors cursor-pointer"
            title="Syntax guide"
          >
            <FontAwesomeIcon icon={faCircleQuestion} className="text-xs" />
            <span>Guide</span>
          </button>
        </div>

        {/* Template Quick Select */}
        <div className="flex items-center gap-2">
          <div className="relative group">
            <button className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer shadow-xs">
              <FontAwesomeIcon icon={faWandMagicSparkles} className="text-green-600 text-[10px]" />
              <span>Templates</span>
              <FontAwesomeIcon icon={faAngleDown} className="text-[10px] text-slate-400" />
            </button>
            <div className="absolute right-0 top-full mt-1 hidden w-52 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg group-hover:block z-30">
              <div className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase tracking-wider">
                Load Template
              </div>
              {TEMPLATES.map((tpl) => (
                <button
                  key={tpl.name}
                  onClick={() => handleSelectTemplate(tpl)}
                  className="flex w-full flex-col items-start rounded-lg px-2 py-1.5 text-left text-xs hover:bg-green-50 hover:text-green-800 transition-colors cursor-pointer"
                >
                  <span className="font-semibold text-slate-800">{tpl.name}</span>
                  <span className="text-[10px] text-slate-500 truncate max-w-full">
                    {tpl.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={onReset}
            className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors cursor-pointer shadow-xs"
            title="Reset to blank canvas"
          >
            <FontAwesomeIcon icon={faRotateLeft} className="text-xs" />
          </button>
        </div>
      </div>

      {/* Syntax Guide Box (Collapsible) */}
      {showGuide && (
        <div className="border-b border-green-200 bg-green-50/70 p-3.5 text-xs text-green-950 space-y-2">
          <div className="font-semibold text-green-900 flex items-center justify-between">
            <span>Drafting Shorthand</span>
            <button
              onClick={() => setShowGuide(false)}
              className="text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <FontAwesomeIcon icon={faXmark} className="text-xs" />
            </button>
          </div>
          <p className="text-slate-600 text-[11px]">
            Write a table name, then indent column definitions:
          </p>
          <pre className="rounded-lg bg-white p-2.5 font-mono text-[11px] text-slate-800 leading-relaxed border border-green-200 shadow-2xs">
{`users
  id int pk
  email varchar(255) unique not null
  created_at timestamp

posts
  id int pk
  user_id int -> users.id
  title varchar(200)`}
          </pre>
          <p className="text-[11px] text-slate-600">
            Link foreign keys using <code className="font-mono text-green-800 bg-green-100 px-1 py-0.5 rounded">-&gt; table.col</code>. Press <kbd className="rounded bg-white border border-slate-300 px-1.5 py-0.5 text-[10px] font-sans font-medium text-slate-700 shadow-2xs">Ctrl+Enter</kbd> to render!
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
          className="h-full w-full resize-none rounded-xl border border-slate-200 bg-white p-3 font-mono text-xs text-slate-800 placeholder:text-slate-400 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600 leading-relaxed shadow-xs"
        />
      </div>

      {/* Bottom Action Footer */}
      <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-2.5">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
          <kbd className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono text-slate-600 border border-slate-200">
            Ctrl
          </kbd>
          <span>+</span>
          <kbd className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono text-slate-600 border border-slate-200">
            Enter
          </kbd>
          <span className="ml-1 text-slate-400">to render</span>
        </div>

        <button
          onClick={onRunDraft}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-green-700 disabled:opacity-50 transition-all cursor-pointer"
        >
          <FontAwesomeIcon icon={faPlay} className="text-xs" />
          <span>{loading ? 'Rendering...' : 'Visualize'}</span>
        </button>
      </div>
    </div>
  );
};
