import type { TableColorKey } from '../types/erd';

export interface TableColorTheme {
  key: TableColorKey;
  label: string;
  hex: string;
  dotClass: string;
  swatchClass: string;
  headerClass: string;
  cardHoverClass: string;
  badgeClass: string;
}

export const TABLE_COLOR_PALETTE: TableColorTheme[] = [
  {
    key: 'emerald',
    label: 'Emerald',
    hex: '#16a34a',
    dotClass: 'bg-emerald-600 ring-emerald-500/20',
    swatchClass: 'bg-emerald-500',
    headerClass: 'from-emerald-50/70 via-slate-50 to-teal-50/50 border-slate-200',
    cardHoverClass: 'hover:border-emerald-500 hover:shadow-emerald-500/10',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  {
    key: 'blue',
    label: 'Blue',
    hex: '#0284c7',
    dotClass: 'bg-sky-600 ring-sky-500/20',
    swatchClass: 'bg-sky-500',
    headerClass: 'from-sky-50/90 via-slate-50 to-blue-50/50 border-sky-200/80',
    cardHoverClass: 'hover:border-sky-500 hover:shadow-sky-500/10',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
  },
  {
    key: 'indigo',
    label: 'Indigo',
    hex: '#4f46e5',
    dotClass: 'bg-indigo-600 ring-indigo-500/20',
    swatchClass: 'bg-indigo-500',
    headerClass: 'from-indigo-50/90 via-slate-50 to-indigo-50/40 border-indigo-200/80',
    cardHoverClass: 'hover:border-indigo-500 hover:shadow-indigo-500/10',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  {
    key: 'cyan',
    label: 'Cyan',
    hex: '#0891b2',
    dotClass: 'bg-cyan-600 ring-cyan-500/20',
    swatchClass: 'bg-cyan-500',
    headerClass: 'from-cyan-50/90 via-slate-50 to-teal-50/50 border-cyan-200/80',
    cardHoverClass: 'hover:border-cyan-500 hover:shadow-cyan-500/10',
    badgeClass: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  },
  {
    key: 'amber',
    label: 'Amber',
    hex: '#d97706',
    dotClass: 'bg-amber-500 ring-amber-500/20',
    swatchClass: 'bg-amber-500',
    headerClass: 'from-amber-50/90 via-slate-50 to-orange-50/40 border-amber-200/80',
    cardHoverClass: 'hover:border-amber-500 hover:shadow-amber-500/10',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  {
    key: 'orange',
    label: 'Orange',
    hex: '#ea580c',
    dotClass: 'bg-orange-600 ring-orange-500/20',
    swatchClass: 'bg-orange-500',
    headerClass: 'from-orange-50/90 via-slate-50 to-amber-50/40 border-orange-200/80',
    cardHoverClass: 'hover:border-orange-500 hover:shadow-orange-500/10',
    badgeClass: 'bg-orange-50 text-orange-700 border-orange-200',
  },
  {
    key: 'rose',
    label: 'Rose',
    hex: '#e11d48',
    dotClass: 'bg-rose-600 ring-rose-500/20',
    swatchClass: 'bg-rose-500',
    headerClass: 'from-rose-50/90 via-slate-50 to-pink-50/40 border-rose-200/80',
    cardHoverClass: 'hover:border-rose-500 hover:shadow-rose-500/10',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  {
    key: 'slate',
    label: 'Slate',
    hex: '#475569',
    dotClass: 'bg-slate-600 ring-slate-500/20',
    swatchClass: 'bg-slate-500',
    headerClass: 'from-slate-100 via-slate-50 to-slate-100/70 border-slate-300/80',
    cardHoverClass: 'hover:border-slate-500 hover:shadow-slate-500/10',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
  },
];

const COLOR_ALIASES: Record<string, TableColorKey> = {
  emerald: 'emerald',
  green: 'emerald',
  '#16a34a': 'emerald',
  '#10b981': 'emerald',
  blue: 'blue',
  sky: 'blue',
  '#0284c7': 'blue',
  '#2563eb': 'blue',
  '#3b82f6': 'blue',
  indigo: 'indigo',
  violet: 'indigo',
  purple: 'indigo',
  '#4f46e5': 'indigo',
  '#6366f1': 'indigo',
  cyan: 'cyan',
  teal: 'cyan',
  '#0891b2': 'cyan',
  '#0d9488': 'cyan',
  amber: 'amber',
  yellow: 'amber',
  gold: 'amber',
  '#d97706': 'amber',
  '#f59e0b': 'amber',
  orange: 'orange',
  '#ea580c': 'orange',
  '#f97316': 'orange',
  rose: 'rose',
  red: 'rose',
  pink: 'rose',
  '#e11d48': 'rose',
  '#ef4444': 'rose',
  slate: 'slate',
  gray: 'slate',
  grey: 'slate',
  '#475569': 'slate',
  '#64748b': 'slate',
};

export function normalizeTableColor(raw?: string | null): TableColorKey | undefined {
  if (!raw) return undefined;
  const cleaned = raw.trim().toLowerCase();
  return COLOR_ALIASES[cleaned];
}

export function getTableColorTheme(color?: string | null): TableColorTheme {
  const normalized = normalizeTableColor(color) || 'emerald';
  return TABLE_COLOR_PALETTE.find((c) => c.key === normalized) || TABLE_COLOR_PALETTE[0];
}

/**
 * Updates or removes `[color: <key>]` on a table's header line inside shorthand draft text.
 */
export function syncTableColorInDraft(
  draftText: string,
  tableName: string,
  color?: TableColorKey
): string {
  if (!draftText.trim() || !tableName) return draftText;
  const escaped = tableName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const headerRegex = new RegExp(
    `^((?:table\\s+)?${escaped})(?:\\s*\\[[^\\]]*\\])?(\\s*[:{]?)$`,
    'i'
  );

  const lines = draftText.split('\n');
  let changed = false;

  const updatedLines = lines.map((rawLine) => {
    const trimmed = rawLine.trim();
    const isIndented = rawLine.length - rawLine.trimStart().length > 0;
    if (isIndented && !trimmed.toLowerCase().startsWith('table ')) {
      return rawLine;
    }
    const match = trimmed.match(headerRegex);
    if (!match) return rawLine;

    // Ensure exact table name match (case-sensitive check on identifier)
    const prefix = match[1];
    const identTokens = prefix.trim().split(/\s+/);
    const ident = identTokens[identTokens.length - 1];
    if (ident !== tableName) return rawLine;

    changed = true;
    const suffix = match[2] || '';
    const leadingWhitespace = rawLine.slice(0, rawLine.length - rawLine.trimStart().length);
    if (color && color !== 'emerald') {
      return `${leadingWhitespace}${prefix} [color: ${color}]${suffix}`;
    }
    return `${leadingWhitespace}${prefix}${suffix}`;
  });

  return changed ? updatedLines.join('\n') : draftText;
}
