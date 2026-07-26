import { access, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const sourceFile = 'docs/architecture/a2b-architecture.json';
const outputFile = 'docs/architecture/a2b-architecture-map.html';
const checkOnly = process.argv.includes('--check');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function fileExists(file) {
  return access(join(root, file)).then(() => true).catch(() => false);
}

async function validate(model) {
  assert(model?.document?.id === 'a2b-logistics-architecture', 'Unexpected architecture document id.');
  assert(model?.identityLock?.company?.shortName === 'a2b', 'Identity lock must be for a2b.');
  assert(model?.identityLock?.company?.paperclipPrefix === 'AB', 'Paperclip prefix must be AB.');
  assert(model?.identityLock?.company?.primaryDomain === 'www.a2b.sa', 'Primary domain must be www.a2b.sa.');
  assert(model?.identityLock?.resources?.githubRepository === 'abdulazizalrayes/a2b-logistics', 'GitHub repository identity mismatch.');
  assert(model?.identityLock?.resources?.vercelProject === 'a2b-logistics', 'Vercel project identity mismatch.');
  assert(model?.operations?.deployment?.architectureArtifactsDeployed === false, 'Architecture artifacts must remain internal.');

  const layerIds = new Set();
  for (const layer of model.layers || []) {
    assert(layer.id && !layerIds.has(layer.id), `Duplicate or missing layer id: ${layer.id || '(empty)'}`);
    layerIds.add(layer.id);
  }

  const nodeIds = new Set();
  for (const node of model.nodes || []) {
    assert(node.id && !nodeIds.has(node.id), `Duplicate or missing node id: ${node.id || '(empty)'}`);
    assert(layerIds.has(node.layer), `${node.id}: unknown layer ${node.layer}`);
    nodeIds.add(node.id);
  }

  for (const node of model.nodes || []) {
    for (const dependency of node.dependencies || []) {
      assert(nodeIds.has(dependency), `${node.id}: unknown dependency ${dependency}`);
    }
  }

  const flowIds = new Set();
  for (const flow of model.flows || []) {
    assert(flow.id && !flowIds.has(flow.id), `Duplicate or missing flow id: ${flow.id || '(empty)'}`);
    assert((flow.steps || []).length >= 2, `${flow.id}: flow must have at least two steps`);
    for (const step of flow.steps) assert(nodeIds.has(step), `${flow.id}: unknown step ${step}`);
    flowIds.add(flow.id);
  }

  assert(model.publicTools.serverMcp.length === model.inventory.serverMcpTools, 'Server MCP tool count mismatch.');
  assert(model.publicTools.browserWebMcp.length === model.inventory.browserWebMcpTools, 'Browser WebMCP tool count mismatch.');

  const sitemap = await readFile(join(root, 'sitemap.xml'), 'utf8');
  const sitemapCount = (sitemap.match(/<loc>/g) || []).length;
  assert(sitemapCount === model.inventory.canonicalSitemapRoutes, `Sitemap count is ${sitemapCount}, map says ${model.inventory.canonicalSitemapRoutes}.`);

  const markdownManifest = JSON.parse(await readFile(join(root, 'data/markdown-companions.json'), 'utf8'));
  assert(markdownManifest.routes?.length === model.inventory.markdownCompanions, 'Markdown companion count mismatch.');

  const requiredEvidence = [
    'CLAUDE.md',
    'package.json',
    'vercel.json',
    'middleware.js',
    'markdown-routes.mjs',
    'api/mcp.js',
    'webmcp.js',
    'data/company.json',
    'openapi.json',
    'llms.txt',
    'sitemap.xml'
  ];
  for (const file of requiredEvidence) assert(await fileExists(file), `Required architecture evidence is missing: ${file}`);

  const vercelIgnore = await readFile(join(root, '.vercelignore'), 'utf8');
  assert(vercelIgnore.split(/\r?\n/).includes('docs/architecture/'), 'docs/architecture/ must be excluded in .vercelignore.');
}

function render(model) {
  const serialized = JSON.stringify(model).replaceAll('<', '\\u003c');
  const generated = model.document.generatedAt;
  const commit = model.document.sourceCommitAudited.slice(0, 7);

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${model.document.title}</title>
<style>
:root {
  color-scheme: dark;
  --bg: #080a0f;
  --surface: #0e121a;
  --surface-2: #141925;
  --surface-3: #1a202d;
  --line: #2a3242;
  --text: #f3f6fb;
  --muted: #96a1b2;
  --dim: #5f6b7c;
  --focus: #ffffff;
  --danger: #ff6b7d;
}
* { box-sizing: border-box; }
html, body { min-height: 100%; }
body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-size: 14px;
  letter-spacing: 0;
}
button, input { font: inherit; letter-spacing: 0; }
button { color: inherit; }
.shell {
  min-height: 100vh;
  display: grid;
  grid-template-rows: auto 1fr;
}
.topbar {
  border-bottom: 1px solid var(--line);
  background: #0b0e15;
  padding: 20px 24px 18px;
}
.topline {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
}
.eyebrow {
  color: #53dc91;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  margin-bottom: 7px;
}
h1 {
  font-size: clamp(22px, 3vw, 34px);
  line-height: 1.15;
  margin: 0;
  font-weight: 720;
}
.dek {
  color: var(--muted);
  max-width: 840px;
  margin: 8px 0 0;
  line-height: 1.5;
}
.meta {
  text-align: right;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.6;
  white-space: nowrap;
}
.meta strong { color: var(--text); font-weight: 650; }
.summary {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}
.stat {
  min-width: 116px;
  border: 1px solid var(--line);
  background: var(--surface);
  border-radius: 6px;
  padding: 9px 11px;
}
.stat b { display: block; font-size: 17px; line-height: 1.1; }
.stat span { color: var(--muted); font-size: 11px; }
.app {
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
}
.main {
  min-width: 0;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
}
.toolbar {
  min-height: 54px;
  border-bottom: 1px solid var(--line);
  background: #0b0e15;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 16px;
  overflow-x: auto;
}
.search-wrap { position: relative; flex: 0 1 300px; min-width: 210px; }
.search {
  width: 100%;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: var(--surface);
  color: var(--text);
  padding: 8px 10px;
  outline: none;
}
.search:focus { border-color: #49d6ff; box-shadow: 0 0 0 2px #49d6ff22; }
.legend {
  display: flex;
  align-items: center;
  gap: 10px;
  white-space: nowrap;
}
.legend-item { display: inline-flex; align-items: center; gap: 5px; color: var(--muted); font-size: 11px; }
.swatch { width: 8px; height: 8px; border-radius: 2px; }
.reset {
  margin-left: auto;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: var(--surface);
  padding: 8px 10px;
  cursor: pointer;
  white-space: nowrap;
}
.reset:hover, .reset:focus-visible { border-color: var(--focus); outline: none; }
.viewport {
  min-width: 0;
  min-height: 0;
  overflow: auto;
  position: relative;
  background-color: #0a0d13;
  background-image:
    linear-gradient(#242b370d 1px, transparent 1px),
    linear-gradient(90deg, #242b370d 1px, transparent 1px);
  background-size: 24px 24px;
}
.map {
  position: relative;
  min-width: 1460px;
  min-height: 790px;
  padding: 18px;
}
.edges {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
  overflow: visible;
}
.edge {
  fill: none;
  stroke: #657286;
  stroke-width: 1.2;
  opacity: .2;
  transition: opacity .16s ease, stroke-width .16s ease, stroke .16s ease;
}
.edge.active { opacity: .94; stroke-width: 2.2; }
.edge.dim { opacity: .045; }
.lanes {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: repeat(6, minmax(220px, 1fr));
  gap: 10px;
  min-height: 750px;
}
.lane {
  border-left: 1px solid #252c39;
  padding: 0 9px;
  min-width: 0;
}
.lane:first-child { border-left: 0; }
.lane-head {
  min-height: 52px;
  border-bottom: 2px solid var(--lane-color);
  margin-bottom: 12px;
  padding: 4px 2px 9px;
}
.lane-title { font-size: 11px; font-weight: 750; text-transform: uppercase; }
.lane-description { color: var(--muted); font-size: 10px; line-height: 1.35; margin-top: 4px; }
.node-list { display: grid; gap: 9px; }
.node {
  width: 100%;
  min-height: 70px;
  text-align: left;
  border: 1px solid var(--line);
  border-left: 3px solid var(--node-color);
  border-radius: 6px;
  background: #111620;
  padding: 10px 10px 9px;
  cursor: pointer;
  transition: border-color .14s ease, background .14s ease, opacity .14s ease, transform .14s ease;
}
.node:hover { border-color: var(--node-color); background: #171d28; transform: translateY(-1px); }
.node:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; }
.node.selected, .node.in-flow {
  border-color: var(--node-color);
  box-shadow: inset 0 0 0 1px var(--node-color);
  background: #1a202c;
}
.node.dim { opacity: .22; }
.node-title { font-size: 12px; font-weight: 700; line-height: 1.3; }
.node-subtitle { color: var(--muted); font-size: 10px; line-height: 1.35; margin-top: 3px; }
.node-footer { display: flex; justify-content: space-between; gap: 8px; margin-top: 9px; }
.node-type, .node-status {
  color: var(--dim);
  font-size: 9px;
  text-transform: uppercase;
}
.node-status { color: var(--node-color); text-align: right; }
.side {
  min-height: 0;
  overflow-y: auto;
  border-left: 1px solid var(--line);
  background: #0d1118;
  padding: 14px;
}
.panel {
  border: 1px solid var(--line);
  border-radius: 7px;
  background: var(--surface);
  margin-bottom: 12px;
}
.panel-head {
  padding: 11px 12px 9px;
  border-bottom: 1px solid var(--line);
  color: var(--muted);
  font-size: 10px;
  font-weight: 750;
  text-transform: uppercase;
}
.flow-list { padding: 6px; display: grid; gap: 4px; }
.flow {
  border: 1px solid transparent;
  border-radius: 5px;
  background: transparent;
  text-align: left;
  padding: 8px;
  cursor: pointer;
}
.flow:hover, .flow:focus-visible { background: var(--surface-2); border-color: var(--line); outline: none; }
.flow.active { background: #241f0d; border-color: #ffc928; }
.flow-title { display: block; font-size: 11px; font-weight: 700; }
.flow-desc { display: block; color: var(--muted); font-size: 9px; line-height: 1.35; margin-top: 2px; }
.detail { padding: 13px; }
.detail h2 { font-size: 17px; line-height: 1.25; margin: 0; }
.detail .sub { color: var(--muted); margin: 4px 0 0; font-size: 11px; }
.detail .responsibility { line-height: 1.55; color: #c7cfdb; margin: 13px 0; }
.section-title { color: var(--muted); font-size: 9px; font-weight: 750; text-transform: uppercase; margin: 13px 0 6px; }
.pill-list { display: flex; flex-wrap: wrap; gap: 5px; }
.pill {
  border: 1px solid var(--line);
  border-radius: 4px;
  background: var(--surface-2);
  color: #c8d0dd;
  font-size: 9px;
  line-height: 1.3;
  padding: 4px 6px;
  overflow-wrap: anywhere;
}
.file-list, .step-list, .note-list { list-style: none; padding: 0; margin: 0; display: grid; gap: 5px; }
.file-list li, .note-list li {
  color: #c6cfdb;
  font-size: 10px;
  line-height: 1.4;
  padding-left: 11px;
  position: relative;
  overflow-wrap: anywhere;
}
.file-list li::before, .note-list li::before {
  content: "";
  position: absolute;
  left: 0;
  top: .52em;
  width: 4px;
  height: 4px;
  border-radius: 1px;
  background: #53dc91;
}
.step-list { counter-reset: flow-step; }
.step-list li {
  counter-increment: flow-step;
  display: grid;
  grid-template-columns: 22px 1fr;
  gap: 7px;
  align-items: start;
  color: #c6cfdb;
  font-size: 10px;
  line-height: 1.4;
}
.step-list li::before {
  content: counter(flow-step);
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #ffc928;
  color: #121212;
  font-weight: 800;
  font-size: 9px;
}
.boundary {
  border-left: 3px solid #ff6b7d;
  background: #24141a;
  color: #ffd9de;
  padding: 8px 9px;
  font-size: 10px;
  line-height: 1.45;
  margin-top: 12px;
}
.empty { color: var(--muted); line-height: 1.55; }
.internal {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
}
.internal a { color: #49d6ff; text-decoration: none; font-size: 11px; }
.internal a:hover { text-decoration: underline; }
.internal small { color: var(--muted); }
@media (max-width: 1050px) {
  .app { grid-template-columns: 1fr; }
  .side { border-left: 0; border-top: 1px solid var(--line); max-height: none; }
}
@media (max-width: 720px) {
  .topbar { padding: 16px; }
  .topline { display: block; }
  .meta { text-align: left; margin-top: 12px; white-space: normal; }
  .toolbar { align-items: stretch; flex-wrap: wrap; }
  .search-wrap { flex-basis: 100%; }
  .reset { margin-left: 0; }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { transition: none !important; scroll-behavior: auto !important; }
}
</style>
</head>
<body>
<div class="shell">
  <header class="topbar">
    <div class="topline">
      <div>
        <div class="eyebrow">Repository-internal · a2b only</div>
        <h1>${model.document.title}</h1>
        <p class="dek">Every production path, public agent interface, source boundary, external dependency, and release control mapped from the repository. Select a node or flow to inspect its evidence and change contract.</p>
      </div>
      <div class="meta">
        <div>Audited commit <strong>${commit}</strong></div>
        <div>Generated <strong>${generated.slice(0, 10)}</strong></div>
        <div>Production <strong>www.a2b.sa</strong></div>
      </div>
    </div>
    <div class="summary" id="summary"></div>
  </header>
  <div class="app">
    <main class="main">
      <div class="toolbar">
        <div class="search-wrap"><input class="search" id="search" type="search" placeholder="Filter nodes, files, interfaces…" aria-label="Filter architecture nodes"></div>
        <div class="legend" id="legend" aria-label="Architecture legend"></div>
        <button class="reset" id="reset" type="button">Clear selection</button>
      </div>
      <div class="viewport" id="viewport">
        <div class="map" id="map">
          <svg class="edges" id="edges" aria-hidden="true"></svg>
          <div class="lanes" id="lanes"></div>
        </div>
      </div>
    </main>
    <aside class="side">
      <section class="panel">
        <div class="panel-head">System flows</div>
        <div class="flow-list" id="flows"></div>
      </section>
      <section class="panel">
        <div class="panel-head">Inspector</div>
        <div class="detail" id="detail"></div>
      </section>
      <section class="panel internal">
        <small>Machine-readable source</small>
        <a href="./a2b-architecture.json">Open JSON</a>
      </section>
    </aside>
  </div>
</div>
<script type="application/json" id="architecture-data">${serialized}</script>
<script>
(function () {
  'use strict';

  var model = JSON.parse(document.getElementById('architecture-data').textContent);
  window.__A2B_ARCHITECTURE__ = model;

  var state = { selectedNode: null, selectedFlow: null, query: '' };
  var layerById = Object.fromEntries(model.layers.map(function (layer) { return [layer.id, layer]; }));
  var nodeById = Object.fromEntries(model.nodes.map(function (node) { return [node.id, node]; }));
  var nodeElements = new Map();
  var edges = [];

  var summary = [
    [model.inventory.canonicalSitemapRoutes, 'canonical routes'],
    [model.system.contentPolicy.languages.length, 'languages'],
    [model.inventory.markdownCompanions, 'Markdown companions'],
    [model.inventory.serverMcpTools, 'server MCP tools'],
    [model.inventory.structuredDataFiles, 'structured JSON files'],
    [model.inventory.wellKnownDiscoveryFiles, 'well-known files']
  ];

  function element(tag, className, text) {
    var item = document.createElement(tag);
    if (className) item.className = className;
    if (text !== undefined) item.textContent = text;
    return item;
  }

  function appendList(parent, title, values, className) {
    if (!values || !values.length) return;
    parent.appendChild(element('div', 'section-title', title));
    var list = element('ul', className || 'file-list');
    values.forEach(function (value) { list.appendChild(element('li', '', value)); });
    parent.appendChild(list);
  }

  function appendPills(parent, title, values) {
    if (!values || !values.length) return;
    parent.appendChild(element('div', 'section-title', title));
    var list = element('div', 'pill-list');
    values.forEach(function (value) { list.appendChild(element('span', 'pill', value)); });
    parent.appendChild(list);
  }

  function renderSummary() {
    var holder = document.getElementById('summary');
    summary.forEach(function (item) {
      var stat = element('div', 'stat');
      stat.appendChild(element('b', '', String(item[0])));
      stat.appendChild(element('span', '', item[1]));
      holder.appendChild(stat);
    });
  }

  function renderLegend() {
    var holder = document.getElementById('legend');
    model.layers.forEach(function (layer) {
      var item = element('span', 'legend-item');
      var swatch = element('span', 'swatch');
      swatch.style.background = layer.color;
      item.appendChild(swatch);
      item.appendChild(document.createTextNode(layer.title.replace(/ & .*/, '')));
      holder.appendChild(item);
    });
  }

  function renderNodes() {
    var lanes = document.getElementById('lanes');
    model.layers.forEach(function (layer) {
      var lane = element('section', 'lane');
      lane.style.setProperty('--lane-color', layer.color);
      var head = element('div', 'lane-head');
      head.appendChild(element('div', 'lane-title', layer.title));
      head.appendChild(element('div', 'lane-description', layer.description));
      lane.appendChild(head);

      var list = element('div', 'node-list');
      model.nodes.filter(function (node) { return node.layer === layer.id; }).forEach(function (node) {
        var card = element('button', 'node');
        card.type = 'button';
        card.dataset.nodeId = node.id;
        card.style.setProperty('--node-color', layer.color);
        card.setAttribute('aria-label', 'Inspect ' + node.title);
        card.appendChild(element('div', 'node-title', node.title));
        card.appendChild(element('div', 'node-subtitle', node.subtitle || node.responsibility));
        var footer = element('div', 'node-footer');
        footer.appendChild(element('span', 'node-type', node.type));
        footer.appendChild(element('span', 'node-status', node.status));
        card.appendChild(footer);
        card.addEventListener('click', function () {
          state.selectedFlow = null;
          state.selectedNode = node.id;
          renderState();
        });
        list.appendChild(card);
        nodeElements.set(node.id, card);
      });
      lane.appendChild(list);
      lanes.appendChild(lane);
    });
  }

  function renderFlows() {
    var holder = document.getElementById('flows');
    model.flows.forEach(function (flow) {
      var button = element('button', 'flow');
      button.type = 'button';
      button.dataset.flowId = flow.id;
      button.appendChild(element('span', 'flow-title', flow.title));
      button.appendChild(element('span', 'flow-desc', flow.description));
      button.addEventListener('click', function () {
        state.selectedNode = null;
        state.selectedFlow = flow.id;
        renderState();
      });
      holder.appendChild(button);
    });
  }

  function pathBetween(from, to) {
    var map = document.getElementById('map').getBoundingClientRect();
    var a = from.getBoundingClientRect();
    var b = to.getBoundingClientRect();
    var ax = a.left - map.left + a.width / 2;
    var ay = a.top - map.top + a.height / 2;
    var bx = b.left - map.left + b.width / 2;
    var by = b.top - map.top + b.height / 2;
    var offset = Math.max(46, Math.abs(bx - ax) * .42);
    var direction = bx >= ax ? 1 : -1;
    return 'M ' + ax + ' ' + ay + ' C ' + (ax + offset * direction) + ' ' + ay + ', ' + (bx - offset * direction) + ' ' + by + ', ' + bx + ' ' + by;
  }

  function drawEdges() {
    var svg = document.getElementById('edges');
    svg.replaceChildren();
    edges = [];

    var activePairs = new Set();
    var activeNodes = new Set();
    if (state.selectedFlow) {
      var flow = model.flows.find(function (item) { return item.id === state.selectedFlow; });
      flow.steps.forEach(function (id) { activeNodes.add(id); });
      for (var index = 0; index < flow.steps.length - 1; index += 1) {
        activePairs.add(flow.steps[index] + '>' + flow.steps[index + 1]);
      }
    } else if (state.selectedNode) {
      activeNodes.add(state.selectedNode);
      var selected = nodeById[state.selectedNode];
      (selected.dependencies || []).forEach(function (id) { activeNodes.add(id); });
      model.nodes.forEach(function (node) {
        if ((node.dependencies || []).includes(state.selectedNode)) activeNodes.add(node.id);
      });
    }

    var pairs = [];
    model.nodes.forEach(function (node) {
      (node.dependencies || []).forEach(function (dependency) {
        pairs.push([node.id, dependency]);
      });
    });
    if (state.selectedFlow) {
      activePairs.forEach(function (pair) {
        var parts = pair.split('>');
        if (!pairs.some(function (item) { return item[0] === parts[0] && item[1] === parts[1]; })) pairs.push(parts);
      });
    }

    pairs.forEach(function (pair) {
      var from = nodeElements.get(pair[0]);
      var to = nodeElements.get(pair[1]);
      if (!from || !to) return;
      var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', pathBetween(from, to));
      path.setAttribute('class', 'edge');
      path.style.stroke = layerById[nodeById[pair[0]].layer].color;
      var pairKey = pair[0] + '>' + pair[1];
      if (state.selectedFlow) {
        path.classList.toggle('active', activePairs.has(pairKey));
        path.classList.toggle('dim', !activePairs.has(pairKey));
      } else if (state.selectedNode) {
        var connected = pair[0] === state.selectedNode || pair[1] === state.selectedNode;
        path.classList.toggle('active', connected);
        path.classList.toggle('dim', !connected);
      }
      svg.appendChild(path);
      edges.push(path);
    });
  }

  function renderNodeDetail(node) {
    var detail = document.getElementById('detail');
    detail.replaceChildren();
    detail.appendChild(element('h2', '', node.title));
    detail.appendChild(element('p', 'sub', layerById[node.layer].title + ' · ' + node.type + ' · ' + node.status));
    detail.appendChild(element('p', 'responsibility', node.responsibility));
    appendPills(detail, 'Interfaces', node.interfaces);
    appendList(detail, 'Files and routes', (node.files || []).concat(node.routes || []));
    appendPills(detail, 'Dependencies', node.dependencies);
    appendList(detail, 'Evidence', node.evidence);
    appendList(detail, 'Notes', node.notes, 'note-list');
  }

  function renderFlowDetail(flow) {
    var detail = document.getElementById('detail');
    detail.replaceChildren();
    detail.appendChild(element('h2', '', flow.title));
    detail.appendChild(element('p', 'sub', flow.trigger));
    detail.appendChild(element('p', 'responsibility', flow.description));
    detail.appendChild(element('div', 'section-title', 'Execution path'));
    var steps = element('ol', 'step-list');
    flow.steps.forEach(function (id) {
      var node = nodeById[id];
      steps.appendChild(element('li', '', node.title + ' — ' + (node.subtitle || node.responsibility)));
    });
    detail.appendChild(steps);
    appendList(detail, 'Verification', flow.verification);
    var boundary = element('div', 'boundary', flow.approvalBoundary);
    detail.appendChild(boundary);
  }

  function renderDefaultDetail() {
    var detail = document.getElementById('detail');
    detail.replaceChildren();
    detail.appendChild(element('h2', '', 'How to read this map'));
    detail.appendChild(element('p', 'empty', 'Select a system node to inspect its responsibilities, files, interfaces, dependencies, and evidence. Select a flow to trace an end-to-end production path and its approval boundary.'));
    appendPills(detail, 'Permanent rules', [
      'a2b only',
      'visual freeze',
      'public agent tools are read-only',
      'Paperclip workspace AB',
      'no plaintext secrets'
    ]);
  }

  function renderState() {
    var flow = state.selectedFlow ? model.flows.find(function (item) { return item.id === state.selectedFlow; }) : null;
    var flowNodes = new Set(flow ? flow.steps : []);
    var query = state.query.toLowerCase();

    model.nodes.forEach(function (node) {
      var card = nodeElements.get(node.id);
      var searchable = [
        node.id,
        node.title,
        node.subtitle,
        node.responsibility,
        (node.files || []).join(' '),
        (node.interfaces || []).join(' ')
      ].join(' ').toLowerCase();
      var queryMatch = !query || searchable.includes(query);
      var inFlow = flowNodes.has(node.id);
      var related = !state.selectedNode || node.id === state.selectedNode ||
        (node.dependencies || []).includes(state.selectedNode) ||
        ((nodeById[state.selectedNode]?.dependencies || []).includes(node.id));
      card.classList.toggle('selected', state.selectedNode === node.id);
      card.classList.toggle('in-flow', inFlow);
      card.classList.toggle('dim', !queryMatch || (flow && !inFlow) || (state.selectedNode && !related));
    });

    document.querySelectorAll('.flow').forEach(function (button) {
      button.classList.toggle('active', button.dataset.flowId === state.selectedFlow);
    });

    if (flow) renderFlowDetail(flow);
    else if (state.selectedNode) renderNodeDetail(nodeById[state.selectedNode]);
    else renderDefaultDetail();
    requestAnimationFrame(drawEdges);
  }

  document.getElementById('search').addEventListener('input', function (event) {
    state.query = event.target.value.trim();
    if (state.query) {
      state.selectedNode = null;
      state.selectedFlow = null;
    }
    renderState();
  });

  document.getElementById('reset').addEventListener('click', function () {
    state.selectedNode = null;
    state.selectedFlow = null;
    state.query = '';
    document.getElementById('search').value = '';
    renderState();
  });

  window.addEventListener('resize', function () { requestAnimationFrame(drawEdges); }, { passive: true });
  document.getElementById('viewport').addEventListener('scroll', function () { requestAnimationFrame(drawEdges); }, { passive: true });

  renderSummary();
  renderLegend();
  renderNodes();
  renderFlows();
  renderState();
})();
</script>
</body>
</html>
`;
}

const model = JSON.parse(await readFile(join(root, sourceFile), 'utf8'));
await validate(model);
const html = render(model);

if (checkOnly) {
  const current = await readFile(join(root, outputFile), 'utf8').catch(() => '');
  assert(current === html, `${outputFile} is stale. Run npm run architecture:generate.`);
  console.log(`Architecture map check passed: ${model.nodes.length} nodes, ${model.flows.length} flows.`);
} else {
  await writeFile(join(root, outputFile), html);
  console.log(`Generated ${outputFile}: ${model.nodes.length} nodes, ${model.flows.length} flows.`);
}
