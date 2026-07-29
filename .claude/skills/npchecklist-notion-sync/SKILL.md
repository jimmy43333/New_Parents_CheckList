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

`/home/tgsung/Desktop/Side_Project/New_Parent_Checklist/npchecklist.html` — specifically
the `DATA.supplies.groups[].items[]` array and the `BRAND_INFO` map.

## Source

Database "用品清單與花費紀錄" under the "育兒" page.
- Database page id: `2f0fce77-9721-80af-be1d-c525dedeb3b4`
- Data source: `collection://2f0fce77-9721-801d-bb91-000b982bd4cf`

Query all rows with `notion-query-data-sources` (SQL mode, `SELECT * FROM
"collection://2f0fce77-9721-801d-bb91-000b982bd4cf"`). Properties: `Name` (title),
`Status` (Not started/In progress/Done), `Select` (懷孕生產/嬰兒大型用品/尿布衣物類/
喝奶用品/嬰兒生活用品 — matches the 5 existing group names in `DATA.supplies.groups`
exactly), `時間標籤` (懷孕前期/懷孕後期/生產期間/寶寶回家前/寶寶滿月後), `Price`, `Cost`.

Each row's Notion **page** also has body content beyond the properties, under two
fixed headings: `## 簡短說明` and `## 經驗分享`. Fetch each row's page individually
(`notion-fetch` on the row's id/url) to read these — the SQL query above only returns
properties. A full sync therefore costs one page fetch per item in addition to the one
database query (~45 items as of 2026-07-29).

## Direction & scope

One-way, Notion → `npchecklist.html` only. Never write back to Notion. Every sync is a
**full mirror**, but only over items whose id starts with `notion-` — those are the
ones this skill owns. Matched `notion-*` items get updated, Notion rows with no
existing `notion-*` match get added (new `notion-*` id), and existing `notion-*` items
with no corresponding Notion row anymore get removed.

**Never touch items whose id does not start with `notion-`.** As of 2026-07-29 there
is one such item: `link-baggage-tab` (待產包) in the 懷孕生產 group — a static shortcut
card that jumps to the 待產包 (bag) tab via `linkToTab: "bag"`, not a real purchasable
item, and not present in Notion at all. There will also eventually be `custom-*` items
(visitor-added, or promoted orphans — see the orphan-preservation section below).
Leave any `link-*`/`custom-*`/other-prefixed item exactly where it is, whatever group
it's currently in, on every sync — full-mirror logic applies only within the `notion-*`
id space.

## Field mapping

| Notion field | npchecklist.html field | Rule |
|---|---|---|
| `Name` | `name` | direct copy |
| `Select` | which group the item is in | exact match to the 5 existing group names |
| `時間標籤` | `phase` | 懷孕前期→`pregnancy-early`, 懷孕後期→`pregnancy-late`, 生產期間→`during-birth`, 寶寶回家前→`before-home`, 寶寶滿月後→`after-full-month`. If non-empty, set/update `phase` accordingly. If empty: for a **brand-new** item being added, omit `phase` entirely — the existing fallback (`... || "unassessed"` in the phase lookup) already buckets it under the pre-existing "待評估" phase, no code change needed. For an **already-matched existing item**, an empty `時間標籤` means Notion has nothing to say about phase — leave that item's current `phase` value untouched rather than deleting it (deleting it would wrongly dump every already-categorized item into "待評估"). |
| `Status` | — | **ignored completely.** The webpage's own 已準備/未準備 checkbox state (localStorage) is the only source of truth for that; never overwritten. |
| `Price` / `Cost` | — | **not synced.** `estCost` is a locally-authored placeholder value (shown as the cost-input's placeholder), independent of the user's personal Notion price/spend data. Existing items keep their current `estCost`. Brand-new items get a reasonable Taiwan market-average estimate, written in the same style as existing values — do not derive it from `Price`/`Cost`. |
| `簡短說明` (page body) | `note` | Overwrite the existing note only when this section is **non-empty**. When empty (the common case today): keep the existing hand-written note for already-matched items; for brand-new items with no note either, write a short one-line note in the same style, from general knowledge. |
| `經驗分享` (page body) | `BRAND_INFO[id].notionNote` | Fully mirrored each sync (array of short plain-text lines, checklist/markdown syntax stripped, link URLs dropped keeping only the visible text) — added/updated/removed to match Notion verbatim. `BRAND_INFO[id].brandSuggestions` (Claude-authored generic fallback) is untouched by sync. Note: despite the comment above `BRAND_INFO` suggesting `brandSuggestions` is only a fallback for when `notionNote` is absent, the actual render code (`npchecklist.html` around `buildExperienceHtml`/`openItemModal`) shows both independently and simultaneously when both are present — `notionNote` renders as inline text in the experience block, `brandSuggestions` renders as a separate clickable brand-carousel block. Don't remove `brandSuggestions` just because `notionNote` gained content. |
| — | `month` | No Notion equivalent (used only for some `after-full-month` items). Leave unset for anything sync touches. |

## Stable IDs

Item ids are `notion-<page-id-without-dashes>`, derived from the Notion row's page id.
This makes renames in Notion safe (the id doesn't change) and gives every sync after
the first a trivial exact-id match — no fuzzy name matching needed going forward.
`BRAND_INFO` is keyed by the same item ids and must be kept in lockstep whenever an id
changes.

## Matching logic

- **Ongoing syncs** (ids already `notion-*`): match by exact id. Trivial.
- **The first sync after adopting this scheme**: match existing hardcoded items
  (`sp-*` ids) against Notion rows by name and judgment, not strict string equality —
  a handful of rows have been renamed or made more specific in Notion since the
  hardcoded list was written (e.g. 月子中心→月子中心-拾玥集, 安撫椅→安撫搖椅, 百日咳、
  RSV 疫苗評估→百日咳+RSV). Treat those as the same item: adopt the Notion name, assign
  the `notion-` id, keep the existing `note`/`estCost`/`BRAND_INFO` entry (renaming its
  key). If a match is genuinely ambiguous (a Notion row that might or might not
  correspond to an existing item, e.g. one whose name and price both differ a lot),
  **ask the user** rather than guessing — getting this wrong either duplicates an item
  or silently drops someone's notes/brand info.

## Orphan preservation (client-side, already built into the page)

`npchecklist.html` caches the default supplies list on load and diffs it against the
current one; any item that disappeared but has recorded user data (checked state,
custom cost, notes, or a phase override) gets promoted into a separate "custom items"
localStorage store so the visitor keeps seeing it. This means it's safe for this skill
to actually remove items from `DATA.supplies` when Notion removes them — no user data
gets silently destroyed. See the "custom items" section of `npchecklist.html`'s script
if you need to understand or extend that mechanism; this sync skill does not need to
touch it directly.

## After syncing

Tell the user what changed (added / updated / removed, by name), and surface anything
you had to flag as ambiguous during matching instead of guessing. Do not publish — that
is the separate `npchecklist-publish` skill, only on explicit request.
