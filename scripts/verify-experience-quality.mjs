import { readFile, stat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { parse } from 'parse5';
const routes = JSON.parse(await readFile('data/markdown-companions.json')).routes;
const errors = [], pages = new Map();
const attributes = n => Object.fromEntries((n.attrs || []).map(a => [a.name, a.value]));
async function exists(path) { try { return (await stat(path)).isFile(); } catch { return false; } }
async function resolvePage(path) {
  const stem = path.replace(/^\//, '');
  for (const file of path === '/' ? ['index.html'] : [stem, stem + '.html', stem + '/index.html']) if (await exists(file)) return file;
  return null;
}
for (const route of routes) {
  const file = await resolvePage(route.route), html = await readFile(file, 'utf8');
  const nodes = [];
  function walk(n) { nodes.push(n); for (const c of n.childNodes || []) walk(c); }
  walk(parse(html));
  pages.set(route.route, { nodes, html, file, route, ids: new Set(nodes.map(n => attributes(n).id).filter(Boolean)) });
}
let links = 0, images = 0, controls = 0;
for (const [path, page] of pages) {
  const { nodes, html, ids, route } = page;
  const fail = message => errors.push(`${path}: ${message}`);
  if (nodes.filter(n => n.tagName === 'main').length !== 1 || !ids.has('main-content')) fail('one main landmark required');
  if (!html.includes('class="skip-link"')) fail('skip link missing');
  const document = nodes.find(n => n.tagName === 'html');
  if (route.language === 'ar-SA' && attributes(document).dir !== 'rtl') fail('Arabic must be RTL');
  for (const n of nodes) {
    const a = attributes(n);
    if (n.tagName === 'img') {
      images++;
      if (!('alt' in a) || !Number(a.width) || !Number(a.height)) fail(`image needs alt and dimensions: ${a.src}`);
    }
    if (n.tagName === 'button' && a.class === 'hamburger' && (a['aria-controls'] !== 'mobileMenu' || a['aria-expanded'] !== 'false')) fail('menu disclosure semantics missing');
    if (['input', 'select', 'textarea'].includes(n.tagName) && a.type !== 'hidden') {
      controls++;
      const named = a['aria-label'] || (a['aria-labelledby'] && ids.has(a['aria-labelledby'])) || nodes.some(label => label.tagName === 'label' && a.id && attributes(label).for === a.id) || n.parentNode?.tagName === 'label';
      if (!named) fail(`unlabelled ${n.tagName} ${a.name || a.id || ''}`);
    }
    for (const field of n.tagName === 'a' || n.tagName === 'link' ? ['href'] : ['img','script','source'].includes(n.tagName) ? ['src','srcset'] : []) {
      const raw = a[field]; if (!raw) continue;
      const value = raw.split(',')[0].trim().split(/\s/)[0];
      if (/^(mailto:|tel:|data:|https?:\/\/)/.test(value) && !value.startsWith('https://www.a2b.sa/')) continue;
      const url = new URL(value, 'https://www.a2b.sa' + path);
      if (url.origin !== 'https://www.a2b.sa') continue;
      links++;
      const targetPath = url.pathname.replace(/\/$/, '') || '/';
      const target = pages.get(targetPath);
      if (target && url.hash && !target.ids.has(decodeURIComponent(url.hash.slice(1)))) fail(`broken anchor ${value}`);
      if (!target && !(await resolvePage(url.pathname))) fail(`missing local target ${value}`);
    }
  }
  if (route.language !== 'en' && /Today, a2b stands|Fast, proven scalability|Real-time GPS tracking|Select primary category|We have received your application/.test(html)) fail('untranslated or misleading content regressed');
}
for (const name of ['home','fleet','careers','vendors','i18n','accessibility','analytics']) {
  const file = `assets/js/${name}.js`;
  if (spawnSync(process.execPath, ['--check', file]).status !== 0) errors.push(`${file}: invalid JavaScript`);
}
if (errors.length) { console.error([...new Set(errors)].join('\n')); process.exit(1); }
console.log(`Experience checks passed: ${pages.size} pages, ${links} local links/assets, ${images} images and ${controls} labelled controls.`);
