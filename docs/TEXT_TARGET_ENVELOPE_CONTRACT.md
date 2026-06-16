# Text Target Envelope Contract v1

This document records the stable write contract for Kitten Nest text targets.

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

## Enabled publish targets

Currently verified for direct envelope publish:

- `coffeeCornerBubble`
- `coffeeCornerLapCloseBubble`

These are light text targets: no permanent archive and no notebook/trash/history mutation.

## Dry-run only targets

Currently dry-run only:

- `windowWeather`
- `moodNote`
- `roomStatus`
- `hubbyNote`

`hubbyNote` is permanent notebook content. It must not be mixed into routine bubble/panel updates. If it is ever enabled, it needs an explicit confirm gate and separate testing.

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
- Full state is not returned for envelope publish responses.
- `hubbyNote` remains locked for direct envelope publish.

## Connector / MCP layer note

The repo endpoint alone does not make a ChatGPT tool appear. A separate actions/MCP connector must expose a callable tool, for example:

```text
update_text_target(targetId, text, mode="publish", dryRun=false)
```

That connector must pass through only registered target ids and should reuse this envelope contract.
