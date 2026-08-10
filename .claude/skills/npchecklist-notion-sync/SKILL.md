---
name: npchecklist-notion-sync
description: Sync the 新手爸媽準備清單 checklist's 準備清單 (supplies) tab from the user's Notion database. Only use when the user explicitly asks to sync (同步 Notion, "sync notion", 從 Notion 更新用品清單).
---

# npchecklist Notion sync workflow

The user tracks baby-supply shopping items in a Notion database. This skill pulls that
into `npchecklist.html`'s 準備清單 tab so Notion is the source of truth for the default
item list, while each visitor's own checkbox/notes/cost data stays local to their
browser (localStorage) and is never touched by this sync. **Only run this when the
user explicitly asks** — it is not part of the routine edit loop (`npchecklist-dev`).

## The working file

`npchecklist.html` (project root) — specifically
the `DATA.supplies.groups[].items[]` array and the `BRAND_INFO` map.

## Source

Database "用品清單與花費紀錄" under the "育兒" page.
- Database page id: `2f0fce77-9721-80af-be1d-c525dedeb3b4`
- Data source: `collection://2f0fce77-9721-801d-bb91-000b982bd4cf`

Properties: `Name` (title), `Status` (Not started/In progress/Done — ignored, see below),
`種類` (select — the item's group; renamed from `Select` at some point, always check the
live schema via `notion-fetch` on the data source rather than trusting this doc if it's
been a while), `時間標籤` (select: 懷孕前期/懷孕後期/生產期間/寶寶回家前/寶寶滿月後/待評估),
`Price`, `Cost`.

Each row's Notion **page** also has body content beyond the properties, under three
fixed headings: `簡短說明`, `經驗分享`, and `品牌分享`. Fetch each row's page
individually (`notion-fetch` on the row's id/url) to read these — a query only returns
properties. A full sync therefore costs one page fetch per item in addition to the
query below (~61 items as of 2026-08-10).

**Match these headings by text, not by heading level.** Every group uses `##` except
嬰幼兒發展, whose items and page template use `###` instead (a pre-existing
inconsistency, not something to "fix" during a sync — just read whichever level is
there). All 6 category page templates (see `page_templates` in the data source schema)
now include an empty 品牌分享 heading too, at the same level as that category's other
two headings, so new items created from a template already have the right structure.

**Anything written above the first heading is the user's own personal working note**
(e.g. a page might start with a stray line like a vendor name jotted down before the
`簡短說明` heading) — it is not part of any of the three tracked sections and must
never be read into `note`/`notionNote`/`brandSuggestions`, or altered/moved/removed by
a sync.

## Ordering

Cards are grouped by `種類`, and within each group should follow the item's relative
order in Notion. Notion has no manual/free sort field exposed to this skill — per the
user, the "All" view is the reference order: sorted by `種類` ascending, then `時間標籤`
ascending. Query it directly in **view mode** rather than plain SQL, so results already
come back grouped and ordered:

```
{ mode: "view", view_url: "https://www.notion.so/<workspace>/2f0fce77972180af?v=2f0fce77-9721-8034-8324-000ca993c148" }
```

(page_size 100 covers the full ~61 rows in one page; only paginate with `next_cursor`
if `has_more` comes back true). Write items into each group's `items[]` array in the
order they come back for that group.

## Direction & scope

One-way, Notion → `npchecklist.html` only. Never write back Notion property values or
existing body content. Every sync is a **full mirror**, but only over items whose id
starts with `notion-` — those are the ones this skill owns. Matched `notion-*` items get
updated, Notion rows with no existing `notion-*` match get added (new `notion-*` id),
and existing `notion-*` items with no corresponding Notion row anymore get removed.

**Never touch items whose id does not start with `notion-`** (e.g. `custom-*` items,
visitor-added or promoted orphans — see the orphan-preservation section below). Leave
them exactly where they are on every sync.

**One `notion-*` item is permanently exempt from sync:** `notion-2f7fce7797218022870adda06b2ed7ea`
(待產包) in the 懷孕生產 group. Although its ID is derived from the Notion row
(`2f7fce77-9721-8022-870a-dda06b2ed7ea`), it is a static shortcut card that uses
`linkToTab: "bag"` to jump to the 待產包 tab — not a real purchasable item. Never
overwrite its `name`, `note`, `phase`, or any other field from Notion, and never remove
it even if the Notion row disappears. Treat it as read-only on every sync (including
the one-time 品牌分享 heading setup below — its Notion page was deliberately skipped).

## Field mapping

| Notion field | npchecklist.html field | Rule |
|---|---|---|
| `Name` | `name` | direct copy |
| `種類` | which group the item is in | exact match to the 6 existing group names (incl. 嬰幼兒發展) |
| `時間標籤` | `phase` | 懷孕前期→`pregnancy-early`, 懷孕後期→`pregnancy-late`, 生產期間→`during-birth`, 寶寶回家前→`before-home`, 寶寶滿月後→`after-full-month`. If one of those 5, set/update `phase` accordingly. If `待評估` **or** empty: for a **brand-new** item being added, omit `phase` entirely — the existing fallback (`... || "unassessed"` in the phase lookup) already buckets it under "待評估", no code change needed. For an **already-matched existing item**, `待評估`/empty means Notion has nothing definite to say about phase — leave that item's current `phase` value untouched rather than overwriting it to unassessed. |
| `Status` | — | **ignored completely.** The webpage's own 已準備/未準備 checkbox state (localStorage) is the only source of truth for that; never overwritten. |
| `Price` / `Cost` | — | **not synced.** `estCost` is a locally-authored placeholder value (shown as the cost-input's placeholder), independent of the user's personal Notion price/spend data. Existing items keep their current `estCost`. Brand-new items get a reasonable Taiwan market-average estimate, written in the same style as existing values — do not derive it from `Price`/`Cost`. |
| `簡短說明` (page body) | `note` | Copy verbatim, exactly as written in Notion — no paraphrasing. If empty in Notion, `note` is empty too (`""`) — do **not** auto-generate a description. Applies to both already-matched and brand-new items. |
| `經驗分享` (page body) | `BRAND_INFO[id].notionNote` | If non-empty in Notion: clear any existing `notionNote` and replace it with exactly the Notion text content — an array of plain-text strings, one per line (checklist/markdown syntax stripped, bold removed, link URLs dropped keeping only the visible text, leading/trailing whitespace trimmed per line). Content itself must not be reworded, only formatting is stripped. If empty in Notion: remove `notionNote` from the `BRAND_INFO` entry (or leave absent). |
| `品牌分享` (page body) | `BRAND_INFO[id].brandSuggestions` | If non-empty in Notion: parse as a list, one entry per line. A line with a link becomes `{ name: "<visible text>", url: "<link>" }` (renders as a clickable link in the modal); a line with no link becomes a plain string. Replace any existing `brandSuggestions` with this parsed list. If empty in Notion: remove `brandSuggestions` from the `BRAND_INFO` entry (or leave absent) — the modal's 品牌分享 section then stays hidden for that item. This section was newly established on 2026-08-10 (all 60 synced item pages plus all 6 category page templates got an empty 品牌分享 heading; 待產包's page was deliberately skipped since it's permanently sync-exempt); it starts empty everywhere and fills in over time as the user edits pages in Notion. |
| — | `month` | No Notion equivalent (used only for some `after-full-month` items). Leave unset for anything sync touches. |

## Stable IDs

Item ids are `notion-<page-id-without-dashes>`, derived from the Notion row's page id.
This makes renames in Notion safe (the id doesn't change) and gives every sync a
trivial exact-id match — no fuzzy name matching needed. `BRAND_INFO` is keyed by the
same item ids and must be kept in lockstep whenever an id changes.

**If a Notion page is deleted and later recreated** (even with identical content), it
gets a brand-new page id — there is no way to reconnect it to the old `notion-*` id.
Any visitor data attached to the old id will have already been promoted to a `custom-*`
orphan (see below) and stays a separate, permanently-local item; the recreated page
syncs in as an entirely new item.

## Matching logic

Ongoing syncs (all ids are already `notion-*` as of 2026-08-10, no legacy `sp-*` ids
remain): match by exact id. Trivial.

## Orphan preservation (client-side, already built into the page)

`npchecklist.html` caches the default supplies list on load and diffs it against the
current one; any item that disappeared but has recorded user data (checked state,
custom cost, notes, or a phase override) gets promoted into a separate "custom items"
localStorage store so the visitor keeps seeing it. This means it's safe for this skill
to actually remove items from `DATA.supplies` when Notion removes them — no user data
gets silently destroyed, and it happens automatically without this skill needing to do
anything. A visitor who never interacted with a removed item sees it simply disappear,
no trace. See the "custom items" section of `npchecklist.html`'s script if you need to
understand or extend that mechanism; this sync skill does not need to touch it
directly.

## After syncing

Tell the user what changed (added / updated / removed, by name), and surface anything
you had to flag as ambiguous during matching instead of guessing. Do not publish — that
is the separate `npchecklist-publish` skill, only on explicit request.
