# Kitten Nest Docs Map

This folder has two clear document types.

## 1. Permanent rule docs / 永久规则文档

Location:

```text
docs/*.md
```

Purpose:

```text
Current architecture
Current object identity
Current coordinates / selectors
Current rules and guardrails
Approved naming and ownership decisions
```

These files should stay lean. They are the nest's rulebook and map, not a diary.

Examples:

```text
CONSTRUCTION_RULES.md
NAMING_CONVENTIONS_20260613.md
ADMIN_ENTRY_AND_BOTTOM_NAV_20260613.md
HOTSPOT_CONFIG_SOURCE_20260613.md
HUBBY_NOTE_PANEL_ARCHIVE_FIRST_20260613.md
```

## 2. Dated construction logs / 当天施工日志

Location:

```text
docs/construction-logs/YYYY-MM-DD.md
```

Purpose:

```text
Daily construction history
Incident sequence
Failed attempts
Regressions and fixes
Verification notes
Temporary handoff details
```

These logs can be longer because they preserve what happened during construction.

Example:

```text
docs/construction-logs/2026-06-13.md
```

## Slimming rule / 瘦身规则

Do not automatically move or delete details from permanent docs.

Before slimming a document, the construction agent must:

```text
1. Identify which details are permanent rules and which are construction history.
2. Explain the proposed split to Vicky.
3. Get Vicky's approval.
4. Move history into a dated construction log.
5. Leave the permanent lesson / guardrail in the permanent rule doc.
```

Short rule:

```text
Permanent docs keep the lesson.
Construction logs keep the story.
No automatic slimming without Vicky's approval.
```
