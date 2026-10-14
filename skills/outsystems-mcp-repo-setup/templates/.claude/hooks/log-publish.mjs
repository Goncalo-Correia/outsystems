// PostToolUse hook for mcp__servicestudio__omlPublish.
// Appends a row to PUBLISHES.md and, after a successful publish, reminds Claude to refresh snapshots.

import fs from 'node:fs';
import path from 'node:path';
import { run, write, REPO, toolInput, responseJson, currentStory, localStamp } from './lib.mjs';

const HEADER = '# Publish history\n\n| When | Module | Status | Story | Notes |\n|---|---|---|---|---|\n';

run('log-publish', event => {
  const module = toolInput(event).eSpaceName || 'UnknownModule';
  const result = responseJson(event.tool_response) ?? {};
  const status = result.published ? 'published' : (result.status || 'unknown');
  const notes = String(result.reason || '').replace(/\|/g, '/').replace(/\r?\n/g, ' ');
  const { date, time } = localStamp();
  const when = `${date} ${time.slice(0, 2)}:${time.slice(2, 4)}`;

  const file = path.join(REPO, 'PUBLISHES.md');
  if (!fs.existsSync(file)) write(file, HEADER);
  write(file, `| ${when} | ${module} | ${status} | ${currentStory() || '-'} | ${notes} |\n`, true);

  if (!result.published) return;
  return {
    hookSpecificOutput: {
      hookEventName: 'PostToolUse',
      additionalContext: `${module} was published and logged in PUBLISHES.md. Refresh its snapshots now with the outsystems-snapshot-refresh project skill (light mode, plus every element changed in this story), then update the story file.`,
    },
  };
});
