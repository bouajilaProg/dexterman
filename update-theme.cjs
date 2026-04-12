const fs = require('fs');

function replaceColors(content) {
  return content
    .replace(/bg-\[\#1a1b26\]/g, 'bg-bg-base')
    .replace(/bg-\[\#16161e\]/g, 'bg-bg-panel')
    .replace(/bg-\[\#1f2335\]/g, 'bg-bg-elevated')
    .replace(/border-\[\#292e42\]/g, 'border-border-subtle')
    .replace(/border-\[\#3b4261\]/g, 'border-border-strong')
    .replace(/text-\[\#c0caf5\]/g, 'text-text-normal')
    .replace(/text-\[\#a9b1d6\]/g, 'text-text-dim')
    .replace(/text-\[\#565f89\]/g, 'text-text-dim')
    .replace(/text-\[\#7aa2f7\]/g, 'text-accent-primary')
    .replace(/hover:text-\[\#7aa2f7\]/g, 'hover:text-accent-primary')
    .replace(/bg-\[\#7aa2f7\]/g, 'bg-accent-primary')
    .replace(/bg-\[\#7aa2f7\]\/10/g, 'bg-accent-primary/10')
    .replace(/bg-\[\#7aa2f7\]\/20/g, 'bg-accent-primary/20')
    .replace(/text-\[\#9ece6a\]/g, 'text-accent-success')
    .replace(/hover:text-\[\#9ece6a\]/g, 'hover:text-accent-success')
    .replace(/border-\[\#9ece6a\]/g, 'border-accent-success')
    .replace(/text-\[\#e0af68\]/g, 'text-accent-warning')
    .replace(/text-\[\#f7768e\]/g, 'text-accent-danger')
    .replace(/hover:text-\[\#f7768e\]/g, 'hover:text-accent-danger')
    .replace(/hover:bg-\[\#1f2335\]/g, 'hover:bg-bg-elevated');
}

// 1. Update tailwind.css
const twPath = 'src/styles/tailwind.css';
const twContent = `@import "tailwindcss";

@theme {
  --color-bg-base: oklch(0.15 0.01 250);
  --color-bg-panel: oklch(0.18 0.01 250);
  --color-bg-elevated: oklch(0.22 0.01 250);
  
  --color-border-subtle: oklch(0.28 0.01 250);
  --color-border-strong: oklch(0.35 0.01 250);

  --color-text-dim: oklch(0.65 0.02 250);
  --color-text-normal: oklch(0.85 0.02 250);
  --color-text-bright: oklch(0.95 0.02 250);

  --color-accent-primary: oklch(0.7 0.1 250);
  --color-accent-success: oklch(0.7 0.1 150);
  --color-accent-warning: oklch(0.7 0.1 80);
  --color-accent-danger: oklch(0.6 0.15 20);

  --font-sans: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}
`;
fs.writeFileSync(twPath, twContent);

// 2. Update page.html
const htmlPath = 'src/pages/editor/page.html';
let html = fs.readFileSync(htmlPath, 'utf8');
html = html.replace(/<link href="https:\/\/fonts\.googleapis\.com.*?rel="stylesheet">/s, '');
html = html.replace(/body \{[^}]+\}/s, `body {\n      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;\n      background-color: var(--color-bg-base);\n      color: var(--color-text-normal);\n    }`);
html = html.replace(/\.mono \{[^}]+\}/s, '');
html = html.replace(/bg-\[\#1a1b26\] text-\[\#c0caf5\]/, 'bg-bg-base text-text-normal');
html = html.replace(/bg-\[\#16161e\] border-r border-\[\#292e42\]/, 'bg-bg-panel border-r border-border-subtle');
html = html.replace(/border-l-2 border-\[\#7aa2f7\] bg-\[\#1a1b26\]/, 'bg-bg-elevated');
html = html.replace(/text-\[\#7aa2f7\]/g, 'text-text-bright');
html = html.replace(/text-\[\#565f89\] hover:text-\[\#c0caf5\]/g, 'text-text-dim hover:text-text-bright');
fs.writeFileSync(htmlPath, html);

// 3. Update editor.xsl
const edPath = 'src/pages/editor/components/editor.xsl';
let ed = fs.readFileSync(edPath, 'utf8');
ed = replaceColors(ed);
// Remove padding and borders from inner tables to make them high density
ed = ed.replace(/p-6 space-y-8/g, 'p-4 space-y-6');
ed = ed.replace(/border border-\[\#292e42\] rounded-lg overflow-hidden bg-\[\#16161e\]/g, ''); // removed card wrap
ed = ed.replace(/border border-border-subtle rounded-lg overflow-hidden bg-bg-panel/g, 'border-y border-border-subtle'); // changed card wrap to just border-y
ed = ed.replace(/class="p-2/g, 'class="py-1 px-2');
ed = ed.replace(/class="w-1\/2 p-2/g, 'class="w-1/2 py-1 px-2');
ed = ed.replace(/class="w-1\/4 p-2/g, 'class="w-1/4 py-1 px-2');
ed = ed.replace(/class="w-20 p-2/g, 'class="w-20 py-1 px-2');
ed = ed.replace(/class="w-10 p-2/g, 'class="w-10 py-1 px-2');
ed = ed.replace(/<main class="flex-1 flex flex-col bg-bg-base">/, '<main class="flex-1 flex flex-col bg-bg-base text-xs">'); // Force dense text
fs.writeFileSync(edPath, ed);

// 4. Update sidebar.xsl
const sbPath = 'src/pages/editor/components/sidebar.xsl';
let sb = fs.readFileSync(sbPath, 'utf8');
sb = replaceColors(sb);
// Remove side borders
sb = sb.replace(/border-l-2 border-accent-primary/g, 'bg-bg-elevated');
sb = sb.replace(/border-l-2 border-accent-success/g, 'bg-transparent');
sb = sb.replace(/p-2 text-xs bg-bg-base/g, 'p-1 px-2 text-xs bg-transparent');
sb = sb.replace(/p-2 text-xs bg-accent-primary\/10/g, 'p-1 px-2 text-xs bg-bg-elevated');
sb = sb.replace(/class="h-12 flex items-center justify-between px-4/g, 'class="h-10 flex items-center justify-between px-3');
sb = sb.replace(/class="p-2 space-y-2/g, 'class="py-2 space-y-0.5'); // High density
sb = sb.replace(/<summary class="flex items-center p-2/g, '<summary class="flex items-center p-1 px-2');
fs.writeFileSync(sbPath, sb);

console.log("Updated files successfully.");
