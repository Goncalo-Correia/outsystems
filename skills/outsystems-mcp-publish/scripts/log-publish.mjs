#!/usr/bin/env node
// PostToolUse hook for mcp__servicestudio__omlPublish, registered by the outsystems-mcp-publish skill.
//
// Every publish:          appends a row to PUBLISHES.md.
// A successful publish:   writes the module's applyModelApiCode lambdas to changes/<date>/<HHmmss>-<Module>[-<story>].cs.
//
// The lambdas come from this session's transcript: every successful applyModelApiCode call for the
// module after the previous successful publish or omlReset of that module. The transcript format is
// internal to Claude Code, so parsing is defensive. If it finds nothing it says so; it never fails the tool.
// Session tokens are never written.

import fs from 'node:fs';
import path from 'node:path';

const SS = 'mcp__servicestudio__';
const HEADER = '# Publish history\n\n| When | Module | Status | Story | Notes |\n|---|---|---|---|---|\n';

let REPO = '';
let STATE = '';

try {
  const event = JSON.parse(await readStdin() || '{}');
  REPO = process.env.CLAUDE_PROJECT_DIR || event.cwd || process.cwd();
  STATE = path.join(REPO, '.claude', 'state');
  if (event.tool_input) delete event.tool_input.sessionToken;
  if (process.env.OS_REPO_HOOK_DEBUG) write(path.join(STATE, 'last-log-publish.json'), JSON.stringify({ ...event, tool_input: event.tool_input }, null, 2));
  const out = handle(event);
  if (out) process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: out } }));
} catch (err) {
  try { if (STATE) write(path.join(STATE, 'error-log-publish.log'), `${new Date().toISOString()} ${err?.stack || err}\n`, true); } catch {}
}
process.exit(0);

function handle(event) {
  if (!fs.existsSync(path.join(REPO, 'changes')) && !fs.existsSync(path.join(REPO, 'PUBLISHES.md'))) {
    return `outsystems-mcp-publish: ${REPO} is not set up with outsystems-mcp-repo-setup (no changes/ or PUBLISHES.md), so this publish was not logged.`;
  }

  // The skill can be invoked more than once per session; log each publish call only once.
  const seenFile = path.join(STATE, 'logged-publishes');
  const seen = read(seenFile).split('\n');
  if (event.tool_use_id && seen.includes(event.tool_use_id)) return '';
  if (event.tool_use_id) write(seenFile, event.tool_use_id + '\n', true);

  const module = input(event.tool_input).eSpaceName || 'UnknownModule';
  const result = parseResult(event.tool_response) ?? {};
  const published = result.published === true;
  const status = published ? 'published' : (result.status || 'unknown');
  const story = read(path.join(STATE, 'current-story')).trim();
  const now = new Date();

  let changes = [];
  let note = '';
  if (published) {
    try {
      changes = collectChanges(event.transcript_path, module, event.tool_use_id);
      changes.forEach(c => writeChange(c, module, story, now));
    } catch (err) {
      note = `transcript not readable (${err.message})`;
    }
  }

  const notes = [String(result.reason || ''), published ? `${changes.length} change(s) logged` : '', note]
    .filter(Boolean).join('; ').replace(/\|/g, '/').replace(/\r?\n/g, ' ');
  const file = path.join(REPO, 'PUBLISHES.md');
  if (!fs.existsSync(file)) write(file, HEADER);
  const { date, time } = local(now);
  write(file, `| ${date} ${time.slice(0, 2)}:${time.slice(2, 4)} | ${module} | ${status} | ${story || '-'} | ${notes} |\n`, true);

  if (!published) {
    return `${module} was NOT published (status: ${status}). Logged in PUBLISHES.md. No lambdas were written to changes/; they will be logged by the next successful publish in this session.`;
  }
  return [
    `${module} was published and logged in PUBLISHES.md. ${changes.length} applyModelApiCode lambda(s) written to changes/.`,
    note ? `Warning: ${note}. Tell the user the change log for this publish is incomplete.` : '',
    !note && changes.length === 0 ? 'No lambdas were found in this session for the module (changes made in another session, by a subagent, or by hand in Service Studio are not logged). Mention this to the user.' : '',
    'Next: refresh the snapshots following references/snapshot.md of the outsystems-mcp-publish skill, then update the story file.',
  ].filter(Boolean).join(' ');
}

// Walks the transcript in order. Changes since the last successful publish/reset of the module are kept.
function collectChanges(transcriptPath, module, currentPublishId) {
  if (!transcriptPath) throw new Error('no transcript_path in hook input');
  const uses = new Map();
  let pending = [];
  for (const line of fs.readFileSync(transcriptPath, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    let entry;
    try { entry = JSON.parse(line); } catch { continue; }
    if (entry.isSidechain) continue;
    const blocks = Array.isArray(entry.message?.content) ? entry.message.content : [];
    for (const b of blocks) {
      if (b?.type === 'tool_use' && String(b.name).startsWith(SS)) {
        if (b.id === currentPublishId) return pending;
        uses.set(b.id, { name: b.name.slice(SS.length), input: input(b.input), when: entry.timestamp });
        continue;
      }
      if (b?.type !== 'tool_result' || b.is_error) continue;
      const use = uses.get(b.tool_use_id);
      if (!use || use.input.eSpaceName !== module) continue;
      const res = parseResult(entry.toolUseResult ?? b.content) ?? {};
      if (use.name === 'applyModelApiCode' && use.input.code && res.mutatedOmlPath) pending.push({ ...use, result: res });
      else if (use.name === 'omlReset') pending = [];
      else if (use.name === 'omlPublish' && res.published === true) pending = [];
    }
  }
  return pending;
}

function writeChange(change, module, story, publishedAt) {
  const at = change.when ? new Date(change.when) : publishedAt;
  const { date, time } = local(at);
  const errors = (change.result.validationMessages || []).filter(m => String(m.type).toLowerCase() === 'error');
  const header = [
    `// Published: ${publishedAt.toISOString()}`,
    `// Module:   ${module}`,
    `// When:     ${at.toISOString()}`,
    `// Story:    ${story || '-'}`,
    `// Outcome:  ${errors.length ? `saved with ${errors.length} validation error(s)` : 'saved'}`,
    `// Imports:  ${(change.input.imports || []).join(', ') || '-'}`,
    ...errors.map(e => `// Error:    ${e.ownerPath || ''} - ${e.message || ''}`.replace(/\r?\n/g, ' ')),
    '',
  ];
  let file = path.join(REPO, 'changes', date, `${time}-${safeName(module)}${story ? `-${safeName(story)}` : ''}.cs`);
  for (let n = 2; fs.existsSync(file); n++) file = file.replace(/(?:-\d+)?\.cs$/, `-${n}.cs`);
  write(file, header.join('\n') + String(change.input.code).replace(/\r\n/g, '\n') + '\n');
}

// ---------- helpers ----------
function input(toolInput) { return toolInput?.input ?? toolInput ?? {}; }

// MCP results arrive as a string, an array of content blocks, { content: [...] } or { structuredContent }.
function parseResult(resp) {
  if (resp == null) return null;
  if (typeof resp === 'object' && !Array.isArray(resp)) {
    if (resp.structuredContent) return resp.structuredContent;
    if (Array.isArray(resp.content)) return parseResult(resp.content);
    return resp;
  }
  const text = Array.isArray(resp) ? resp.map(b => (typeof b === 'string' ? b : b?.text ?? '')).join('') : String(resp);
  try { return JSON.parse(text); } catch { return null; }
}

function readStdin() {
  return new Promise(resolve => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', c => (data += c));
    process.stdin.on('end', () => resolve(data));
  });
}

function read(file) { try { return fs.readFileSync(file, 'utf8'); } catch { return ''; } }

function write(file, content, append = false) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  (append ? fs.appendFileSync : fs.writeFileSync)(file, content);
}

function local(d) {
  const p = n => String(n).padStart(2, '0');
  return { date: `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`, time: `${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}` };
}

function safeName(s) { return String(s).replace(/[^\w.-]+/g, '_'); }
