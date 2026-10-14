# 0001. Use this repository as the record of the OutSystems project

- **Date:** {{DATE}}
- **Status:** Accepted

## Context

{{PROJECT_NAME}} is built on {{PLATFORM}} through the Service Studio MCP. The platform stores modules as binary `.oml` files with its own version history, which git can't diff. Changes made by an AI agent still need to be traceable, reviewable and explainable.

## Decision

This repository is the record around the platform:

- every Model API lambda applied to a module is saved in `changes/`;
- the state of each module after a publish is saved as Model API code in `snapshots/`;
- stories, reviews, publishes and decisions are kept as Markdown.

The OutSystems platform stays the source of truth for the running app. The repository is the source of truth for **why** and **how** it changed.

## Consequences

- Any change can be traced to a story, a review and a publish.
- Snapshots must be refreshed after every publish, or they go out of date.
- Changes made directly in Service Studio, outside the MCP, show up only in the next snapshot diff, not in `changes/`.
