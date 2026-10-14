# {{PROJECT_NAME}}

{{DESCRIPTION}}

This is an {{PLATFORM}} project built with Claude Code through the Service Studio MCP. OutSystems keeps the modules in the platform as binary `.oml` files. This repository is the text record around them: what was asked for, what changed, what the model looked like after each publish, and why.

## Prerequisites

- Service Studio 11 with the MCP server enabled. The repo expects it at `{{MCP_URL}}`.
- Claude Code.
- Node.js 18 or later, for the publish hook of the `outsystems-mcp-publish` skill.
- The user-level skills `servicestudio-mcp-oml`, `outsystems-mcp-code-review` and `outsystems-mcp-publish` in `~/.claude/skills/`. This repo ships no skills of its own.
- The modules ({{MODULE_NAMES}}) open in Service Studio when you work on them.

## Getting started

1. Clone the repository and open Claude Code in its folder.
2. Approve the `servicestudio` MCP server when Claude Code asks; it's defined in `.mcp.json`.
3. Open the module in Service Studio.
4. Describe the story you want to build. Claude follows the workflow in [CLAUDE.md](CLAUDE.md).

## Layout

| Path | Contents |
|---|---|
| [CLAUDE.md](CLAUDE.md) | Project instructions and workflow for Claude |
| [docs/architecture.md](docs/architecture.md) | Apps, modules, layers and references |
| [docs/conventions.md](docs/conventions.md) | Naming and design conventions |
| [docs/decisions/](docs/decisions/) | Architecture decision records |
| [stories/](stories/) | User stories and technical tasks |
| [changes/](changes/) | Every Model API change applied to a module |
| [snapshots/](snapshots/) | Module state after each publish, as Model API code |
| [reviews/](reviews/) | Code review rounds before each publish |
| [PUBLISHES.md](PUBLISHES.md) | Publish history |
| [queries/](queries/) | Reusable ModelQL queries |

## What changed?

- **In a story:** read the story file, then the files in `changes/` tagged with its ID.
- **Between two publishes:** `git log -p snapshots/<Module>/`.
- **Who approved it:** `reviews/<Module>/<story-id>.md`.

Set up on {{DATE}} with the `outsystems-mcp-repo-setup` skill.
