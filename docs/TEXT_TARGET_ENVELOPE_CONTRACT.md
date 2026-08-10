# Text Target Envelope Contract v1

This document records the stable write contract for Kitten Nest text targets.

> **重大提示 / must read:** 2026-06-16 已完成 textTargets 户口本总钥匙与 MCP 全窗写入口里程碑。未来施工狼/导演狼必须先读：
>
> ```text
> docs/MAJOR_MILESTONE_TEXT_TARGETS_MCP_TOTAL_KEY_2026-06-16.md
> data/text-targets.v1.json
> api/mcp.js
> ```
>
> The ChatGPT all-window Kitten Nest App is powered by `/api/mcp`, not by a My GPT Action. Do not route future work through Custom GPT Actions unless explicitly requested.

## Endpoint

POST `/api/set-state`

Request body:

```json
{
  "textTarget": {
    "targetId": "coffeeCornerBubble",
    "mode": "publish",
    "text": "line 1\nline 2",
    "dryRun": true
  }
}
```

Auth uses the existing nest write header. Do not put secrets in repo docs.

## Modes

- `dryRun: true`: generate the patch and return it without writing state.
- `dryRun: false`: write only if the target is explicitly enabled for publish.
- `mode: publish`: publish directly into the target state fields.
- `mode: draft`: generate a pending draft patch in dry-run; publish support should stay disabled unless separately tested.

## Registry-first rule

All writable text targets should be registered in:

```text
data/text-targets.v1.json
```

MCP now reads this registry for `update_text_target` targetIds. Do not create one-off MCP tools for every new room/panel/bubble. New text areas should be added to the registry first, then consumed by UI/runtime code.

## Enabled publish targets

Verified direct publish targets include:

- `coffeeCornerBubble`
- `coffeeCornerLapCloseBubble`
- `coffeeCornerBeachHandholdSunsetBubble`
- `coffeeCornerBeachHandholdSunsetVickyBubble`
- `coffeeCornerBeachBraceletPromiseBubble`
- `coffeeCornerBeachBraceletPromiseVickyBubble`
- `coffeeCornerBeachStallOrderBubble`
- `coffeeCornerBeachStallOrderVickyBubble`

MCP `update_text_target` reads the registry and supports all registered targetIds. Permanent archive-style targets, especially `hubbyNote`, must still be handled intentionally and should not be mixed into routine bubble test packages.

## Never allowed

- Arbitrary state paths
- Unregistered `targetId`
- Ambiguous short tags
- Automatic writes to archive/history/trash without a specific permanent-note workflow

## Response contract

Direct publish should return a compact response:

```json
{
  "ok": true,
  "dryRun": false,
  "writesState": true,
  "callsSupabaseWrite": true,
  "textTarget": {
    "request": {
      "targetId": "coffeeCornerBubble",
      "mode": "publish",
      "dryRun": false
    },
    "target": {
      "targetId": "coffeeCornerBubble",
      "type": "bubbleQueue",
      "tag": "coffeeCornerBubble"
    },
    "writtenFields": []
  },
  "summary": {}
}
```

It should not return the full `nest_state.value` for text-target envelope publish responses.

## Current verified behavior

- `coffeeCornerBubble` envelope publish writes canonical fields and legacy compatibility fields together.
- `coffeeCornerLapCloseBubble` envelope publish writes only lap-close bubble fields.
- Each `coffeeCornerBeach*Bubble` envelope publish writes only that scene and speaker's current, queue, index, and timestamp fields.
- Alex and Vicky use distinct registered targets in every beach scene.
- Full state is not returned for envelope publish responses.
- `/api/mcp` exposes `update_text_target` for the all-window Kitten Nest App.
- `/api/mcp` reads targetIds from `data/text-targets.v1.json`.

## Connector / MCP layer note

The all-window ChatGPT Kitten Nest App uses:

```text
/api/mcp?t=<private token>
```

Expected tool:

```text
update_text_target(targetId, text, mode="publish" | "dryRun")
```

Refresh/reconnect the ChatGPT App after changing the registry so cached tool schemas reload.
