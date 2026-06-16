# Current Construction Map · Kitten Nest Text Target System

Status: current deployment map  
Last updated: 2026-06-16

## Read this first

This is the short, current-only map. For the full milestone history and rules, read:

```text
docs/MAJOR_MILESTONE_TEXT_TARGETS_MCP_TOTAL_KEY_2026-06-16.md
```

## Current correct route

```text
ChatGPT all-window Kitten Nest App
→ /api/mcp?t=<private token>
→ tools/list
→ update_text_target
→ data/text-targets.v1.json
→ Supabase nest_state
→ /cloud / PWA display
```

Do not start from My GPT Actions for normal Kitten Nest all-window work. The OpenAPI files are archived backup/reference only.

## Current authoritative files

```text
api/mcp.js
```

The live all-window MCP tool server. It exposes `update_text_target` and reads the registry.

```text
data/text-targets.v1.json
```

The text target registry / 户口本. New text areas must be registered here first.

```text
api/set-state.js
```

The legacy/general state endpoint plus textTarget envelope support. Useful for web safety pages and direct REST tests, but not the primary ChatGPT all-window tool source.

```text
docs/MAJOR_MILESTONE_TEXT_TARGETS_MCP_TOTAL_KEY_2026-06-16.md
```

The full milestone log and future construction rules.

```text
docs/TEXT_TARGET_ENVELOPE_CONTRACT.md
```

Contract reference, now points back to the MCP route and registry-first rule.

## Current live tool

Use:

```text
update_text_target(targetId, text, mode)
```

Modes:

```text
publish
 dryRun
```

TargetIds come from:

```text
data/text-targets.v1.json
```

Current registered targetIds:

```text
coffeeCornerBubble
coffeeCornerLapCloseBubble
windowWeather
hubbyNote
moodNote
roomStatus
```

## Current canonical tags

Use full tags only:

```text
[coffeeCornerBubble]
[coffeeCornerLapCloseBubble]
[windowWeather]
[hubbyNote]
[moodNote]
[roomStatus]
```

Do not use vague aliases:

```text
[coffee]
[coffeeCorner]
[lapClose]
[weather]
[note]
[mood]
[status]
```

## New text target workflow

1. Register the target in `data/text-targets.v1.json`.
2. Make sure UI/runtime reads the registered fields.
3. Deploy.
4. Refresh/reconnect the ChatGPT Kitten Nest App so tool schema reloads.
5. Test with `update_text_target(..., mode="dryRun")`.
6. Then publish.

## Archive / old road notes

These files/pages are historical or backup only:

```text
actions-setup.html
text-target-actions.openapi.json
text-target-envelope-dry-run.html
lap-close-envelope-write-safety.html
write-v2-text-targets-safety.html
coffee-corner-dual-write-safety.html
```

They are kept for lessons and past verification, not as the current route.

## Non-negotiable rule

Never expose arbitrary state path writes.

Allowed:

```text
update_text_target(targetId, text, mode)
```

Not allowed:

```text
update_state_path(path, value)
```

The registry is the permission boundary.