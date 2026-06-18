import fs from 'fs';

const replacements = [
  { search: /bg-\[\#111111\]/g, replace: 'bg-white dark:bg-[#111111]' },
  { search: /border-white\/10/g, replace: 'border-slate-200 dark:border-white/10' },
  { search: /border-white\/5/g, replace: 'border-slate-200 dark:border-white/5' },
  { search: /text-white\/80/g, replace: 'text-slate-700 dark:text-white/80' },
  { search: /text-white\/60/g, replace: 'text-slate-500 dark:text-white/60' },
  { search: /text-white\/50/g, replace: 'text-slate-500 dark:text-white/50' },
  { search: /text-white\/40/g, replace: 'text-slate-400 dark:text-white/40' },
  { search: /text-white\/90/g, replace: 'text-slate-800 dark:text-white/90' },
  { search: /(?<!dark:)text-white(?!\/)/g, replace: 'text-slate-900 dark:text-white' }, // ONLY replace text-white when it doesn't end with / and doesn't start with dark:
  { search: /bg-white\/5/g, replace: 'bg-slate-100 dark:bg-white/5' },
  { search: /bg-white\/10/g, replace: 'bg-slate-100 dark:bg-white/10' },
  { search: /hover:bg-white\/10/g, replace: 'hover:bg-slate-100 dark:hover:bg-white/10' },
  { search: /hover:bg-white\/5/g, replace: 'hover:bg-slate-50 dark:hover:bg-white/5' },
  { search: /active:bg-white\/20/g, replace: 'active:bg-slate-200 dark:active:bg-white/20' },
  { search: /hover:text-white\/80/g, replace: 'hover:text-slate-700 dark:hover:text-white/80' },
  { search: /hover:text-white(?![\/a-z])/g, replace: 'hover:text-slate-900 dark:hover:text-white' },
  { search: /placeholder:text-white\/20/g, replace: 'placeholder:text-slate-400 dark:placeholder:text-white/20' },
  { search: /placeholder-white\/40/g, replace: 'placeholder:text-slate-400 dark:placeholder-white/40' },
  { search: /\[&>option\]:bg-\[\#111\]/g, replace: 'dark:[&>option]:bg-[#111]' },
  { search: /bg-black\/70/g, replace: 'bg-slate-900/50 dark:bg-black/70' }
];

const files = [
  'src/components/RefundList.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  for (const r of replacements) {
     content = content.replace(r.search, r.replace);
  }
  fs.writeFileSync(file, content);
}
