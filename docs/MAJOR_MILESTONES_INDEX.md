# Major Milestones Index · Kitten Nest

Status: current milestone index  
Last updated: 2026-06-16

This file is the top-level map for foundation-level achievements. It prevents one new milestone from burying another older milestone just because its log is newer or louder.

## Foundation milestones

### 1. Go-back / push scene isolation

Status: **foundation-level milestone**  
Role: scene navigation and return-flow safety

This milestone established that scene transitions, go-back behavior, and push-style scene changes must stay isolated instead of leaking state or breaking unrelated rooms. It is a foundation achievement on the same level as the text-target total key.

Why it matters:

```text
Scene navigation must not become a muddy shared global side effect.
A room transition should not accidentally corrupt another room.
Go-back behavior needs its own clean route/stack logic.
```

Current note:

```text
Detailed standalone log still needs to be found or reconstructed if it was not previously committed.
Do not let the newer text-target milestone hide this achievement.
```

### 2. textTargets registry + MCP total key

Status: **foundation-level milestone**  
Role: all-window text writing system

Detailed log:

```text
docs/MAJOR_MILESTONE_TEXT_TARGETS_MCP_TOTAL_KEY_2026-06-16.md
```

This milestone upgraded text writing from scattered one-off tools to a registry-based total key:

```text
data/text-targets.v1.json
→ /api/mcp reads registry
→ update_text_target appears in the all-window Kitten Nest App
→ registered text areas can be written by targetId
```

Why it matters:

```text
New text areas no longer require one new MCP tool each.
Future rooms, panels, and bubbles should register in the textTargets registry.
The permission boundary is targetId registry, not arbitrary state paths.
```

## Current must-read files

For any future construction wolf / director wolf:

```text
docs/MAJOR_MILESTONES_INDEX.md
docs/CURRENT_CONSTRUCTION_MAP.md
docs/MAJOR_MILESTONE_TEXT_TARGETS_MCP_TOTAL_KEY_2026-06-16.md
data/text-targets.v1.json
api/mcp.js
```

If working on navigation, go-back, push, or scene isolation, do not infer from the text-target milestone. Treat navigation isolation as its own foundation line.

If working on text writing, tags, bubbles, panels, notes, or room status, follow the textTargets registry + update_text_target route.

## Rule for future milestone logs

Do not write every new fix as “THE final version.”

Use these labels:

```text
foundation-level milestone
current route
archived test
historical lesson
deprecated route
backup/reference only
```

The goal is clarity, not shouting.