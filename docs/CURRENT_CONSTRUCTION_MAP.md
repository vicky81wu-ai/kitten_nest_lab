# Current Construction Map · Kitten Nest Text Target System

Status: current deployment map
Last updated: 2026-08-10

This file is only for the text writing system.

Full text-target milestone log:

```text
docs/MAJOR_MILESTONE_TEXT_TARGETS_MCP_TOTAL_KEY_2026-06-16.md
```

## Current route

```text
/api/mcp
update_text_target
data/text-targets.v1.json
```

## Current authoritative files

```text
api/mcp.js
data/text-targets.v1.json
api/set-state.js
docs/MAJOR_MILESTONE_TEXT_TARGETS_MCP_TOTAL_KEY_2026-06-16.md
docs/TEXT_TARGET_ENVELOPE_CONTRACT.md
```

## Tool

```text
update_text_target(targetId, text, mode)
```

Modes:

```text
publish
dryRun
```

Current registered targetIds:

```text
coffeeCornerBubble
coffeeCornerLapCloseBubble
coffeeCornerBeachHandholdSunsetBubble
coffeeCornerBeachHandholdSunsetVickyBubble
coffeeCornerBeachBraceletPromiseBubble
coffeeCornerBeachBraceletPromiseVickyBubble
coffeeCornerBeachStallOrderBubble
coffeeCornerBeachStallOrderVickyBubble
windowWeather
hubbyNote
moodNote
roomStatus
```

## Canonical tags

```text
[coffeeCornerBubble]
[coffeeCornerLapCloseBubble]
[coffeeCornerBeachHandholdSunsetBubble]
[coffeeCornerBeachHandholdSunsetVickyBubble]
[coffeeCornerBeachBraceletPromiseBubble]
[coffeeCornerBeachBraceletPromiseVickyBubble]
[coffeeCornerBeachStallOrderBubble]
[coffeeCornerBeachStallOrderVickyBubble]
[windowWeather]
[hubbyNote]
[moodNote]
[roomStatus]
```

## New text target workflow

1. Register the target in `data/text-targets.v1.json`.
2. Make sure UI/runtime reads the registered fields.
3. Deploy.
4. Refresh/reconnect the ChatGPT Kitten Nest App.
5. Test with dryRun.
6. Then publish.

## Archived test pages

```text
actions-setup.html
text-target-actions.openapi.json
text-target-envelope-dry-run.html
lap-close-envelope-write-safety.html
write-v2-text-targets-safety.html
coffee-corner-dual-write-safety.html
```

These are kept for history only.

## Boundary

Use registered targetId only. Do not expose free-form state path writes.
