// Shared helpers for the Service Studio MCP hooks.
// Hooks must never block a tool call: callers wrap everything in run(), which always exits 0.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// <repo>/.claude/hooks/lib.mjs -> <repo>
export const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const STATE = path.join(REPO, '.claude', 'state');

export async function run(name, handler) {
  try {
    const raw = await readStdin();
    const event = JSON.parse(raw || '{}');
    if (event.tool_input) delete event.tool_input.sessionToken;
    if (process.env.OS_REPO_HOOK_DEBUG) write(path.join(STATE, `last-${name}.json`), JSON.stringify(event, null, 2));
    const out = await handler(event);
    if (out) process.stdout.write(JSON.stringify(out));
  } catch (err) {
    try { write(path.join(STATE, `error-${name}.log`), `${new Date().toISOString()} ${err?.stack || err}\n`, true); } catch {}
  }
  process.exit(0);
}

function readStdin() {
  return new Promise(resolve => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', c => (data += c));
    process.stdin.on('end', () => resolve(data));
  });
}

export function write(file, content, append = false) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  (append ? fs.appendFileSync : fs.writeFileSync)(file, content);
}

// MCP tool responses reach hooks in a few shapes: a string, an array of content blocks,
// { content: [...] }, or { structuredContent }. Return the text payload.
export function responseText(resp) {
  if (resp == null) return '';
  if (typeof resp === 'string') return resp;
  if (Array.isArray(resp)) return resp.map(b => (typeof b === 'string' ? b : b?.text ?? '')).join('');
  if (Array.isArray(resp.content)) return responseText(resp.content);
  if (resp.structuredContent) return JSON.stringify(resp.structuredContent);
  return JSON.stringify(resp);
}

// Parse the response as JSON when possible; otherwise return null.
export function responseJson(resp) {
  if (resp && typeof resp === 'object' && !Array.isArray(resp) && !resp.content) return resp.structuredContent ?? resp;
  try { return JSON.parse(responseText(resp)); } catch { return null; }
}

export const toolInput = event => event.tool_input?.input ?? event.tool_input ?? {};

export function currentStory() {
  try { return fs.readFileSync(path.join(STATE, 'current-story'), 'utf8').trim(); } catch { return ''; }
}

export const pad = n => String(n).padStart(2, '0');
export function localStamp(d = new Date()) {
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`,
    iso: d.toISOString(),
  };
}

export const safeName = s => String(s).replace(/[^\w.-]+/g, '_');
