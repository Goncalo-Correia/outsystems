#!/usr/bin/env node
// Scaffolds an OutSystems 11 + Service Studio MCP working repository.
// Never overwrites existing files; merges config files by adding missing entries only.
// Usage: node scaffold.mjs --target <repo> --config <config.json> [--dry-run]

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const SKILL_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TEMPLATES = path.join(SKILL_DIR, 'templates');

const READ_TOOLS = [
  'createSessionToken', 'listApps', 'getValidationMessages', 'runQuery',
  'getDataModel', 'getStructures', 'getSettings', 'getLocales', 'getTimers', 'getIntegrations',
  'getEvents', 'getEventHandlers', 'getUserExceptions', 'getRoleExceptions', 'getException',
  'getClientVariables', 'getSessionVariables',
  'getActionNames', 'getServerAction', 'getClientAction', 'getServiceAction',
  'getRoleNames', 'getRole',
  'getScreenNames', 'getScreen', 'getScreenNamesTraditional', 'getScreenTraditional',
  'getWebBlockNames', 'getWebBlock', 'getWebBlockNamesTraditional', 'getWebBlockTraditional',
  'getThemeNames', 'getTheme', 'getThemeNamesTraditional', 'getThemeTraditional',
  'getEmailTemplateNames', 'getEmailTemplate', 'getEmailTemplateNamesTraditional', 'getEmailTemplateTraditional',
  'getExternalSiteNames', 'getExternalSite', 'getExternalSiteNamesTraditional', 'getExternalSiteTraditional',
  'getResourceNames', 'getResource', 'getImageNames', 'getImage', 'getScriptNames', 'getScript',
  'getSerializedObject', 'getSerializedObjectByKey', 'getSerializedObjectByNameAndType',
].map(t => `mcp__servicestudio__${t}`);

const ASK_TOOLS = ['omlPublish', 'omlReset'].map(t => `mcp__servicestudio__${t}`);

const GITIGNORE = [
  '# Claude Code local state',
  '.claude/state/',
  '.claude/settings.local.json',
  '# OutSystems binaries (the platform is the source of truth for these)',
  '*.oml',
  '*.oap',
  '*.osp',
  '# Secrets',
  '.env',
  '.env.*',
  '# OS / tooling',
  'node_modules/',
  'Thumbs.db',
  '.DS_Store',
];

const GITATTRIBUTES = [
  '* text=auto eol=lf',
  '*.cs text eol=lf',
  '*.md text eol=lf',
];

// ---------- args ----------
const args = process.argv.slice(2);
const flag = name => args.includes(name);
const opt = name => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };

const dryRun = flag('--dry-run');
const target = path.resolve(opt('--target') ?? process.cwd());
const configPath = opt('--config');
if (!configPath) fail('Missing --config <file>');
if (!fs.existsSync(target)) fail(`Target does not exist: ${target}`);

const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
if (!cfg.projectName) fail('config.projectName is required');
cfg.description ??= 'TODO: describe the project';
cfg.platform ??= 'OutSystems 11';
cfg.environments ??= [{ name: 'Development', url: 'TODO' }];
cfg.modules ??= [];
cfg.references ??= [];
cfg.mcpUrl ??= 'http://127.0.0.1:41820/mcp';
cfg.vendorSkills ??= [];
cfg.skillsSource ??= path.join(os.homedir(), '.claude', 'skills');

const results = [];
const report = (p, status, note) => results.push(note ? { path: p, status, note } : { path: p, status });

// ---------- template vars ----------
const today = new Date().toISOString().slice(0, 10);
const table = (head, rows) => rows.length
  ? [`| ${head.join(' | ')} |`, `|${head.map(() => '---').join('|')}|`, ...rows.map(r => `| ${r.join(' | ')} |`)].join('\n')
  : '_None yet._';

const vars = {
  PROJECT_NAME: cfg.projectName,
  DESCRIPTION: cfg.description,
  PLATFORM: cfg.platform,
  DATE: today,
  MCP_URL: cfg.mcpUrl,
  ENVIRONMENTS_TABLE: table(['Environment', 'URL'], cfg.environments.map(e => [e.name, e.url || 'TODO'])),
  MODULES_TABLE: table(['Module', 'App', 'Type', 'Layer', 'Version'],
    cfg.modules.map(m => [m.name, m.app || 'TODO', m.type || 'TODO', m.layer || 'TODO', m.version || ''])),
  REFERENCES_LIST: cfg.references.length ? cfg.references.map(r => `- ${r}`).join('\n') : '_None recorded yet._',
  MODULE_NAMES: cfg.modules.length ? cfg.modules.map(m => `\`${m.name}\``).join(', ') : '_TODO_',
};

const render = text => text.replace(/\{\{([A-Z_]+)\}\}/g, (m, k) => (k in vars ? vars[k] : m));

// ---------- copy templates ----------
function walk(dir, rel = '') {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const srcRel = path.join(rel, entry.name);
    const src = path.join(dir, entry.name);
    if (entry.isDirectory()) { walk(src, srcRel); continue; }
    const outRel = srcRel.replace(/\.tpl$/, '');
    const posixRel = outRel.split(path.sep).join('/');
    let content = fs.readFileSync(src, 'utf8');
    if (/\.md$/.test(outRel)) content = render(content);
    writeIfMissing(posixRel, content);
  }
}

function writeIfMissing(rel, content) {
  const dest = path.join(target, rel);
  if (fs.existsSync(dest)) {
    const existing = fs.readFileSync(dest, 'utf8').replace(/\r\n/g, '\n');
    report(rel, existing === content.replace(/\r\n/g, '\n') ? 'kept' : 'kept-differs');
    return;
  }
  if (!dryRun) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, content);
  }
  report(rel, 'created');
}

// ---------- merges ----------
function mergeLines(rel, lines) {
  const dest = path.join(target, rel);
  const exists = fs.existsSync(dest);
  const current = exists ? fs.readFileSync(dest, 'utf8') : '';
  const have = new Set(current.split(/\r?\n/).map(l => l.trim()));
  // A comment line heads the entries below it; emit it only if one of those entries is missing.
  const toAdd = [];
  let pendingComment = null;
  for (const l of lines) {
    if (l.startsWith('#')) { pendingComment = l; continue; }
    if (have.has(l.trim())) continue;
    if (pendingComment && !have.has(pendingComment)) toAdd.push(pendingComment);
    pendingComment = null;
    toAdd.push(l);
  }
  if (!toAdd.some(l => !l.startsWith('#'))) { report(rel, exists ? 'unchanged' : 'skipped'); return; }
  const prefix = current && !current.endsWith('\n') ? '\n' : '';
  if (!dryRun) fs.writeFileSync(dest, current + prefix + toAdd.join('\n') + '\n');
  report(rel, exists ? 'merged' : 'created', `${toAdd.filter(l => !l.startsWith('#')).length} entries`);
}

function mergeJson(rel, mutate) {
  const dest = path.join(target, rel);
  const exists = fs.existsSync(dest);
  let obj = {};
  if (exists) {
    try { obj = JSON.parse(fs.readFileSync(dest, 'utf8')); }
    catch { report(rel, 'kept-differs', 'existing file is not valid JSON; not touched'); return; }
  }
  const before = JSON.stringify(obj);
  mutate(obj);
  if (JSON.stringify(obj) === before) { report(rel, 'unchanged'); return; }
  if (!dryRun) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, JSON.stringify(obj, null, 2) + '\n');
  }
  report(rel, exists ? 'merged' : 'created');
}

const addUnique = (arr, items) => { for (const i of items) if (!arr.includes(i)) arr.push(i); };

// ---------- vendored skills ----------
function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name), d = path.join(dest, e.name);
    if (e.isDirectory()) copyDir(s, d); else fs.copyFileSync(s, d);
  }
}

function vendorSkills() {
  for (const name of cfg.vendorSkills) {
    const rel = `.claude/skills/${name}`;
    const src = path.join(cfg.skillsSource, name);
    const dest = path.join(target, rel);
    if (!fs.existsSync(path.join(src, 'SKILL.md'))) { report(rel, 'skipped', `not found in ${cfg.skillsSource}`); continue; }
    if (fs.existsSync(dest)) { report(rel, 'kept'); continue; }
    if (!dryRun) copyDir(src, dest);
    report(rel, 'created', 'vendored copy');
  }
}

// ---------- run ----------
walk(TEMPLATES);

mergeLines('.gitignore', GITIGNORE);
mergeLines('.gitattributes', GITATTRIBUTES);

mergeJson('.mcp.json', o => {
  o.mcpServers ??= {};
  o.mcpServers.servicestudio ??= { type: 'http', url: cfg.mcpUrl };
});

mergeJson('.claude/settings.json', s => {
  s.permissions ??= {};
  s.permissions.allow ??= [];
  s.permissions.ask ??= [];
  addUnique(s.permissions.allow, READ_TOOLS);
  addUnique(s.permissions.ask, ASK_TOOLS);
});

vendorSkills();

console.log(JSON.stringify({ dryRun, target, results }, null, 2));

function fail(msg) { console.error(msg); process.exit(1); }
