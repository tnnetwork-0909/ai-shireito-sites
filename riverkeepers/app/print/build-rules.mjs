// Builds print/rules.html and print/play-example.html from game/*.md so they read
// well in a browser. Run: node print/build-rules.mjs   (handles only the Markdown those files use)
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));

const links = {
  'past-sheet.md': 'sheets.html#past-sheet',
  'future-sheet.md': 'sheets.html#future-sheet',
  'play-example.md': 'play-example.html',
  'rules.md': 'rules.html',
};

export const PAGES = [
  { source: 'rules.md', output: 'rules.html', suffix: ' — rules', back: '<a href="../index.html">← Riverkeepers home</a> · <a href="sheets.html">Printable play sheets</a>' },
  {
    source: 'play-example.md', output: 'play-example.html', suffix: '',
    back: '<a href="../index.html">← Riverkeepers home</a> · <a href="rules.html">Rules</a> · <a href="sheets.html">Printable play sheets</a>',
  },
];

const escape = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function inline(text) {
  return escape(text)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => `<a href="${links[href] ?? href}">${label}</a>`);
}

const cells = (line) => line.trim().replace(/^\||\|$/g, '').split('|').map((cell) => cell.trim());

export function renderRules(markdown) {
  return renderPage(markdown, PAGES[0]);
}

export function renderPage(markdown, page) {
  const lines = markdown.split('\n');
  const out = [];
  let title = 'Riverkeepers';
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    if (line.startsWith('```')) {
      const block = [];
      while (lines[i + 1] !== undefined && !lines[i + 1].startsWith('```')) block.push(lines[++i]);
      i++;
      out.push(`<pre>${escape(block.join('\n'))}</pre>`);
      continue;
    }
    const heading = line.match(/^(#{1,3}) (.*)$/);
    if (heading) {
      const level = heading[1].length;
      if (level === 1) title = heading[2];
      out.push(`<h${level}>${inline(heading[2])}</h${level}>`);
    } else if (line.startsWith('|')) {
      const head = cells(line);
      const align = cells(lines[++i]).map((spec) => (spec.endsWith(':') ? ' class="num"' : ''));
      const rows = [];
      while (lines[i + 1]?.startsWith('|')) rows.push(cells(lines[++i]));
      out.push('<div class="table-scroll" role="region" aria-label="Scrollable game table" tabindex="0">');
      out.push('<table>');
      out.push(`  <thead><tr>${head.map((c, n) => `<th scope="col"${align[n]}>${inline(c)}</th>`).join('')}</tr></thead>`);
      out.push('  <tbody>');
      for (const row of rows) out.push(`    <tr>${row.map((c, n) => `<td${align[n]}>${inline(c)}</td>`).join('')}</tr>`);
      out.push('  </tbody>');
      out.push('</table>');
      out.push('</div>');
    } else if (/^\d+\. /.test(line)) {
      out.push('<ol>');
      while (lines[i] !== undefined && /^\d+\. /.test(lines[i])) {
        out.push(`  <li>${inline(lines[i].replace(/^\d+\. /, ''))}</li>`);
        i++;
      }
      i--;
      out.push('</ol>');
    } else {
      out.push(`<p>${inline(line)}</p>`);
    }
  }
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'self'; base-uri 'none'; form-action 'none'">
  <title>${escape(title)}${page.suffix}</title>
  <link rel="stylesheet" href="rules.css">
</head>
<body>
<!-- Generated from game/${page.source} by print/build-rules.mjs. Edit the Markdown, then rebuild. -->
<p class="back">${page.back}</p>
<main>
${out.join('\n')}
</main>
</body>
</html>
`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  for (const page of PAGES) {
    const markdown = readFileSync(path.join(here, '../game', page.source), 'utf8');
    writeFileSync(path.join(here, page.output), renderPage(markdown, page));
    console.log(`Wrote print/${page.output}`);
  }
}
