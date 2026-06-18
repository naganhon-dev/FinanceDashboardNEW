const fs = require('fs');
let content = fs.readFileSync('src/components/RefundList.tsx', 'utf8');

const replacements = [
  { search: /bg-white/g, replace: 'bg-[#111111]' },
  { search: /border-slate-200/g, replace: 'border-white/10' },
  { search: /border-slate-300/g, replace: 'border-white/20' },
  { search: /border-slate-100/g, replace: 'border-white/5' },
  { search: /text-slate-900/g, replace: 'text-white' },
  { search: /text-slate-700/g, replace: 'text-white/80' },
  { search: /text-slate-600/g, replace: 'text-white/60' },
  { search: /text-slate-500/g, replace: 'text-white/50' },
  { search: /text-slate-400/g, replace: 'text-white/40' },
  { search: /bg-slate-50\/50/g, replace: 'bg-white/5' },
  { search: /bg-slate-50/g, replace: 'bg-[#1a1a1a]' },
  { search: /bg-slate-100/g, replace: 'bg-[#222]' },
  { search: /bg-slate-900\/50/g, replace: 'bg-black/70' },
  { search: /focus:ring-indigo-500/g, replace: 'focus:ring-blue-500' },
  { search: /text-indigo-600/g, replace: 'text-blue-500' },
  { search: /text-indigo-400/g, replace: 'text-blue-400' },
  { search: /bg-indigo-50/g, replace: 'bg-blue-900/40' },
  { search: /bg-indigo-600/g, replace: 'bg-blue-600' },
  { search: /hover:bg-indigo-700/g, replace: 'hover:bg-blue-500' },
  { search: /hover:text-indigo-800/g, replace: 'hover:text-blue-400' },
  { search: /border-indigo-100/g, replace: 'border-blue-500/20' },
  { search: /hover:bg-slate-100/g, replace: 'hover:bg-white/10' },
];

for (const r of replacements) {
  content = content.replace(r.search, r.replace);
}

fs.writeFileSync('src/components/RefundList.tsx', content);
