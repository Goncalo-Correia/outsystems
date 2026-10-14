// PostToolUse hook for mcp__servicestudio__applyModelApiCode.
// Saves each lambda that produced a saved OML to changes/<date>/<time>-<Module>[-<story>].cs.
// Compile errors never reach PostToolUse, and runs that saved nothing (mutatedOmlPath "") are skipped.

import path from 'node:path';
import { run, write, REPO, toolInput, responseJson, currentStory, localStamp, safeName } from './lib.mjs';

run('log-model-change', event => {
  const input = toolInput(event);
  if (!input.code) return;
  const result = responseJson(event.tool_response) ?? {};
  if (!result.mutatedOmlPath) return;

  const module = input.eSpaceName || 'UnknownModule';
  const story = currentStory();
  const { date, time, iso } = localStamp();
  const errors = (result.validationMessages || []).filter(m => String(m.type).toLowerCase() === 'error');

  const header = [
    `// Module:   ${module}`,
    `// When:     ${iso}`,
    `// Story:    ${story || '-'}`,
    `// Outcome:  ${errors.length ? `saved with ${errors.length} validation error(s)` : 'saved'}`,
    `// Imports:  ${(input.imports || []).join(', ') || '-'}`,
    ...errors.map(e => `// Error:    ${e.ownerPath || ''} - ${e.message || ''}`.replace(/\r?\n/g, ' ')),
    '',
  ];

  const file = path.join(REPO, 'changes', date, `${time}-${safeName(module)}${story ? `-${safeName(story)}` : ''}.cs`);
  write(file, header.join('\n') + String(input.code).replace(/\r\n/g, '\n') + '\n');
});
