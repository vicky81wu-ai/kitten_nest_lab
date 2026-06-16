# Major Milestones Index · Kitten Nest

Status: current milestone index  
Last updated: 2026-06-16

This file is the top-level map for foundation-level achievements. It prevents one new milestone from burying another older milestone just because its log is newer or louder.

## Foundation milestones

### 1. 场景框架结构 / navigation framework hook

Status: **foundation-level hook, needs source-backed detail**  
Role: scene framework / navigation structure

Important correction:

```text
Do not use this index as the technical definition of the scene framework.
The previous wording about “go-back / push scene isolation” was an unverified shorthand from conversation and has been removed to avoid misleading future construction windows.
```

What this entry means:

```text
There is an important foundation-level scene framework / navigation structure achievement in the nest.
Future construction wolves must locate the real source in code, JSON, or construction discipline before modifying scene routing, room transitions, go-back behavior, or push-like navigation.
```

What not to do:

```text
Do not infer implementation details from memory.
Do not rename it casually.
Do not copy this hook as a spec.
Do not let the text-target milestone hide this scene-framework line.
```

Next cleanup task:

```text
Find the authoritative source for the scene framework structure and either link it here or write a verified standalone milestone log based on actual code/doc evidence.
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

If working on scene framework, navigation, room transitions, go-back behavior, or push-like routing, first find the authoritative source in code/JSON/docs. This index intentionally does not define that system.

If working on text writing, tags, bubbles, panels, notes, or room status, follow the textTargets registry + update_text_target route.

## Rule for future milestone logs

Do not write every new fix as “THE final version.”

Use these labels:

```text
foundation-level milestone
foundation-level hook, needs source-backed detail
current route
archived test
historical lesson
deprecated route
backup/reference only
```

The goal is clarity, not shouting.