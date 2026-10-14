// PostToolUse hook for mcp__servicestudio__get.* (Service Studio read tools).
// Only active while .claude/state/snapshot-mode exists (created and removed by the
// outsystems-snapshot-refresh skill). Writes each read result to snapshots/<Module>/ so
// Claude doesn't have to re-emit large outputs through the Write tool.
//
//   getDataModel                  -> data-model.cs
//   getActionNames {objectType}   -> names/<objectType>-actions.json
//   get<Kind>Names[Traditional]   -> names/<kind>s.json
//   get<Kind>[Traditional] {objectName} -> <kind>s/<objectName>.cs
//   get<Kind>[Traditional]        -> <kind>.cs

import fs from 'node:fs';
import path from 'node:path';
import { run, write, REPO, STATE, toolInput, responseText, safeName } from './lib.mjs';

const SKIP = new Set(['getValidationMessages', 'getSerializedObject', 'getSerializedObjectByKey', 'getSerializedObjectByNameAndType', 'getImage']);
const kebab = s => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

run('capture-snapshot', event => {
  if (!fs.existsSync(path.join(STATE, 'snapshot-mode'))) return;
  const tool = String(event.tool_name || '').replace(/^mcp__servicestudio__/, '');
  if (SKIP.has(tool) || !tool.startsWith('get')) return;

  const input = toolInput(event);
  const module = input.eSpaceName;
  if (!module) return;

  let text = responseText(event.tool_response);
  if (!text.trim()) return;

  let rel;
  const base = tool.slice(3).replace(/Traditional$/, '');
  if (tool === 'getActionNames') {
    rel = `names/${kebab(input.objectType || 'all')}-actions.json`;
  } else if (base.endsWith('Names')) {
    rel = `names/${kebab(base.slice(0, -5))}s.json`;
  } else if (input.objectName) {
    rel = `${kebab(base)}s/${safeName(input.objectName)}.cs`;
  } else {
    rel = `${kebab(base)}.cs`;
  }

  // Code reads may arrive JSON-encoded as a string; name lists as JSON arrays (sorted for stable diffs).
  try {
    const parsed = JSON.parse(text);
    if (typeof parsed === 'string') text = parsed;
    else if (Array.isArray(parsed)) text = JSON.stringify([...parsed].sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))), null, 2);
    else text = JSON.stringify(parsed, null, 2);
  } catch { /* plain text */ }

  write(path.join(REPO, 'snapshots', safeName(module), rel), text.replace(/\r\n/g, '\n').replace(/\n?$/, '\n'));
});
