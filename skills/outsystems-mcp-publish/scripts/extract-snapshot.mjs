#!/usr/bin/env node
// Writes snapshots/<Module>/ from the Service Studio read results in a Claude Code session transcript,
// so large read outputs never have to be retyped. Procedure: references/snapshot.md.
//
// Usage: node extract-snapshot.mjs --module <Module> --since <ISO time> [--repo <dir>] [--transcript <file.jsonl>]
//
// The transcript format is internal to Claude Code; parsing is defensive and reports what it found.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const SS = 'mcp__servicestudio__';
const SKIP = new Set(['getValidationMessages', 'getSerializedObject', 'getSerializedObjectByKey', 'getSerializedObjectByNameAndType', 'getImage']);
const LIGHT = [
  'data-model.cs', 'structures.cs', 'settings.cs', 'timers.cs', 'integrations.cs', 'user-exceptions.cs',
  'client-variables.cs', 'session-variables.cs',
  'names/server-actions.json', 'names/client-actions.json', 'names/service-actions.json',
  'names/roles.json', 'names/screens.json', 'names/web-blocks.json', 'names/themes.json', 'names/resources.json', 'names/scripts.json',
];

const args = process.argv.slice(2);
const opt = name => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const module = opt('--module');
const since = opt('--since') || '';
const repo = path.resolve(opt('--repo') || process.cwd());
if (!module) fail('Missing --module <Module>');
if (!since) fail('Missing --since <ISO time>: the UTC time just before the first read call');
const transcript = opt('--transcript') || newestTranscript(repo);

const kebab = s => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
const safeName = s => String(s).replace(/[^\w.-]+/g, '_');

// ---------- collect: the last result per file wins ----------
const uses = new Map();
const files = new Map();
for (const line of fs.readFileSync(transcript, 'utf8').split('\n')) {
  if (!line.trim()) continue;
  let entry;
  try { entry = JSON.parse(line); } catch { continue; }
  if (entry.isSidechain) continue;
  for (const b of Array.isArray(entry.message?.content) ? entry.message.content : []) {
    if (b?.type === 'tool_use' && String(b.name).startsWith(SS) && String(entry.timestamp || '') >= since) {
      uses.set(b.id, { tool: b.name.slice(SS.length), input: b.input?.input ?? b.input ?? {} });
      continue;
    }
    if (b?.type !== 'tool_result' || b.is_error || !uses.has(b.tool_use_id)) continue;
    const { tool, input } = uses.get(b.tool_use_id);
    if (!tool.startsWith('get') || SKIP.has(tool) || input.eSpaceName !== module) continue;
    const rel = fileFor(tool, input);
    const text = clean(resultText(entry.toolUseResult ?? b.content), rel);
    if (text != null) files.set(rel, text);
  }
}

function fileFor(tool, input) {
  const base = tool.slice(3).replace(/Traditional$/, '');
  if (tool === 'getActionNames') return `names/${kebab(input.objectType || 'all')}-actions.json`;
  if (base.endsWith('Names')) return `names/${kebab(base.slice(0, -5))}s.json`;
  if (input.objectName) return `${kebab(base)}s/${safeName(input.objectName)}.cs`;
  return `${kebab(base)}.cs`;
}

function resultText(content) {
  if (content == null) return '';
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) return content.map(c => (typeof c === 'string' ? c : c?.text ?? '')).join('');
  if (Array.isArray(content.content)) return resultText(content.content);
  return JSON.stringify(content);
}

// Results arrive either as plain text or wrapped as {"result": "..."}; code comes inside ```csharp fences.
function clean(text, rel) {
  try { const p = JSON.parse(text); if (p && typeof p.result === 'string') text = p.result; } catch { /* plain text */ }
  text = text.replace(/\r\n/g, '\n');
  if (rel.endsWith('.json')) {
    try {
      const list = JSON.parse(text);
      if (Array.isArray(list)) text = JSON.stringify([...list].sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))), null, 2);
    } catch { /* e.g. "No items found." */ }
  } else {
    text = text.replace(/^\s*```[a-z]*\n/, '').replace(/\n*```\s*$/, '');
  }
  return text.trimEnd() + '\n';
}

// ---------- write ----------
const out = path.join(repo, 'snapshots', safeName(module));
for (const [rel, text] of files) {
  const dest = path.join(out, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, text);
}

// ---------- report ----------
const readList = rel => { try { const l = JSON.parse(fs.readFileSync(path.join(out, rel), 'utf8')); return Array.isArray(l) ? l : []; } catch { return null; } };
const own = rel => (readList(rel) ?? []).filter(x => !x.IsReferenced).length;

// A per-object folder <kind>s/ is checked against names/<kind>s.json when that list exists.
const stale = [];
for (const dir of fs.existsSync(out) ? fs.readdirSync(out, { withFileTypes: true }) : []) {
  if (!dir.isDirectory() || dir.name === 'names') continue;
  const list = readList(`names/${dir.name}.json`);
  if (!list) continue;
  const names = new Set(list.map(x => safeName(x.Name)));
  for (const f of fs.readdirSync(path.join(out, dir.name))) {
    if (f.endsWith('.cs') && !names.has(f.slice(0, -3))) stale.push(`${dir.name}/${f}`);
  }
}

console.log(JSON.stringify({
  transcript,
  module,
  written: [...files.keys()].sort(),
  missing: LIGHT.filter(f => !files.has(f) && !(f.startsWith('names/') && files.has(f.replace(/\.json$/, '-traditional.json')))),
  stale,
  counts: {
    serverActions: own('names/server-actions.json'), clientActions: own('names/client-actions.json'), serviceActions: own('names/service-actions.json'),
    screens: own('names/screens.json'), webBlocks: own('names/web-blocks.json'), roles: own('names/roles.json'),
    themes: own('names/themes.json'), resources: own('names/resources.json'), scripts: own('names/scripts.json'),
  },
}, null, 2));

function newestTranscript(repoDir) {
  const dir = path.join(os.homedir(), '.claude', 'projects', repoDir.replace(/[^a-zA-Z0-9]/g, '-'));
  if (!fs.existsSync(dir)) fail(`No transcript folder at ${dir}; pass --transcript <file.jsonl>`);
  const newest = fs.readdirSync(dir).filter(f => f.endsWith('.jsonl'))
    .map(f => ({ f, t: fs.statSync(path.join(dir, f)).mtimeMs })).sort((a, b) => b.t - a.t)[0];
  if (!newest) fail(`No .jsonl transcript in ${dir}; pass --transcript <file.jsonl>`);
  return path.join(dir, newest.f);
}

function fail(msg) { console.error(msg); process.exit(1); }
