---
name: npchecklist-notion-sync
description: Sync the 新手爸媽準備清單 checklist's 準備清單 (supplies), 待產包 (hospital bag), and 照顧能力表 (skills) tabs from the user's Notion pages/database. Only use when the user explicitly asks to sync (同步 Notion, "sync notion", 從 Notion 更新用品清單/待產包/能力表).
---

# npchecklist Notion sync workflow

The user tracks baby-prep content across Notion. This skill pulls that into
`npchecklist.html` so Notion is the source of truth for the default item lists, while
each visitor's own checkbox/notes/cost data stays local to their browser (localStorage)
and is never touched by any sync. **Only run this when the user explicitly asks** — it
is not part of the routine edit loop (`npchecklist-dev`).

There are three independent sync targets, covered in their own sections below:

| Tab | Notion source | Section |
|---|---|---|
| 準備清單 (supplies) | Database "用品清單與花費紀錄" | [A](#a-準備清單-supplies) |
| 待產包 (bag) | Page "🫄🏻 待產包" | [B](#b-待產包-bag) |
| 照顧能力表 (skills) | Page "照顧寶寶能力檢視表" | [C](#c-照顧能力表-skills) |

Direction is always one-way, Notion → `npchecklist.html`. Never write back Notion
property values or content **except** where a section below explicitly says otherwise
(only B's own checked-state has ever been written back, and only when the user asks for
that specifically — default assumption is still read-only).

---

## A. 準備清單 (supplies)

`DATA.supplies.groups[].items[]` array and the `BRAND_INFO` map.

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

### Ordering

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

### Scope & matching

Every sync is a **full mirror**, but only over items whose id starts with `notion-` —
those are the ones this skill owns. Matched `notion-*` items get updated, Notion rows
with no existing `notion-*` match get added (new `notion-*` id), and existing
`notion-*` items with no corresponding Notion row anymore get removed.

**Never touch items whose id does not start with `notion-`** (e.g. `custom-*` items,
visitor-added or promoted orphans — see the orphan-preservation section below). Leave
them exactly where they are on every sync.

**One `notion-*` item is permanently exempt from sync:** `notion-2f7fce7797218022870adda06b2ed7ea`
(待產包) in the 懷孕生產 group. Although its ID is derived from the Notion row
(`2f7fce77-9721-8022-870a-dda06b2ed7ea` — the same page as section B's source!), it is
a static shortcut card that uses `linkToTab: "bag"` to jump to the 待產包 tab — not a
real purchasable item. Never overwrite its `name`, `note`, `phase`, or any other field
from this section's sync, and never remove it even if the Notion row disappears. Treat
it as read-only here (including the one-time 品牌分享 heading setup below — its Notion
page was deliberately skipped). Its actual content is synced separately, by section B.

Ids are `notion-<page-id-without-dashes>`, derived from the Notion row's page id. This
makes renames in Notion safe (the id doesn't change) and gives every sync a trivial
exact-id match — no fuzzy name matching needed. `BRAND_INFO` is keyed by the same item
ids and must be kept in lockstep whenever an id changes. All ids are already `notion-*`
as of 2026-08-10 (no legacy `sp-*` ids remain) — match by exact id, trivial.

**If a Notion page is deleted and later recreated** (even with identical content), it
gets a brand-new page id — there is no way to reconnect it to the old `notion-*` id.
Any visitor data attached to the old id will have already been promoted to a `custom-*`
orphan (see below) and stays a separate, permanently-local item; the recreated page
syncs in as an entirely new item.

### Field mapping

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

### Orphan preservation (client-side, already built into the page)

`npchecklist.html` caches the default supplies list on load and diffs it against the
current one; any item that disappeared but has recorded user data (checked state,
custom cost, notes, or a phase override) gets promoted into a separate "custom items"
localStorage store so the visitor keeps seeing it. This means it's safe for this skill
to actually remove items from `DATA.supplies` when Notion removes them — no user data
gets silently destroyed, and it happens automatically without this skill needing to do
anything. A visitor who never interacted with a removed item sees it simply disappear,
no trace. See the "custom items" section of `npchecklist.html`'s script if you need to
understand or extend that mechanism; this sync skill does not need to touch it
directly. **This orphan mechanism is supplies-only** — it is not built for the bag or
skills tabs (see the id-churn warnings in sections B and C).

---

## B. 待產包 (bag)

`DATA.bag.description` (array of strings) and `DATA.bag.groups[].items[]`.

Source: the Notion **page** "🫄🏻 待產包", id `2f7fce77-9721-8022-870a-dda06b2ed7ea`
(`notion-fetch` it directly — it's a page, not a database, so no query/view is
involved). This is the same page section A treats as permanently sync-exempt under
its `notion-` id — the two sections sync the same Notion content into two different
parts of the HTML (a read-only shortcut card in 準備清單, and the actual tab content
here).

### Structure

The page body is plain Notion-flavored markdown, not database rows:

- A `### 筆記` (or similar) heading whose bullet lines map directly to
  `DATA.bag.description` (one string per bullet; strip markdown bullet/bold syntax and
  any inline `<br>` — fold into natural punctuation instead). Copy the content
  faithfully; light rewording to drop raw HTML tags is fine, inventing new content is
  not.
- One `###`/`##` heading per group (e.g. `去醫院（大約待 3 天）`, `可去醫院在購買的物品`,
  `去月中`). **The heading text is the group's `name` verbatim, including any
  parenthetical** — copy it exactly, don't trim it down to match old shorter names.
  Groups can be added, removed, or renamed freely; mirror whatever heading structure
  Notion currently has.
- Under each heading, a flat list of `- [ ]`/`- [x]` checklist lines — each line is one
  item's `name`. The checkbox state itself is **not** synced (see below).

### Field mapping & matching

There are no stable per-item Notion page ids here (these are markdown checkbox lines,
not database rows), so matching is **by name** against the existing `items[]` in that
group. For an exact name match: leave the item's `note` untouched (Notion has no
per-item description for this page — `note` is always locally authored, elaborating on
what the bracketed/plain item name means and why it matters; never overwrite a
hand-written note just because the sync ran). For a Notion line with no existing name
match: it's a new item — add it in the same position (relative to its neighbors) as
Notion shows, write a short locally-authored `note` in the same voice as sibling items,
and give it a new id following that group's prefix convention (see below). For an
existing item whose name no longer appears anywhere on the Notion page: remove it (no
orphan-preservation safety net exists for this tab — see the warning below).

Checkbox checked/unchecked state on the Notion page reflects the user's own personal
prep tracking *in Notion*, separate from the webpage's own 已準備/未準備 toggle
(localStorage per visitor). **Never let Notion's checked state set/overwrite anything
in `npchecklist.html`** unless the user explicitly asks to sync checked-state too — that
has never been the default and should be treated as a one-off special request each time.

### Ids

Existing convention: `bg-h-N` (去醫院 group), `bg-c-N` (去月中 group), and `bg-m-N`
(established 2026-08-10 for 可去醫院在購買的物品). If Notion adds a group that doesn't
map to an existing prefix, mint a new short prefix (one or two letters hinting at the
group name) and start its own `-1` counter. Numbers are **not** sequential/meaningful
within a prefix (there are gaps from past edits) — for a new item, just pick any unused
number under that prefix; don't renumber existing siblings to close gaps.

**Renumbering ids is destructive** for any visitor who has already toggled that item's
checkbox: the webpage's localStorage keys items by id, so reusing/reassigning an id to
a different item silently reattaches a stranger's old checked-state to it. Only
renumber/reorder ids when the user explicitly asks for it (as opposed to a routine
content sync) — default behavior is to keep every existing item's id fixed for life and
only mint new ids for genuinely new items.

### Cross-check with A

Because A treats this same Notion page's *database-row-level* fields (`簡短說明` etc.)
as exempt, running a supplies sync will never touch this page's content — only a bag
sync (this section) does. If the user asks to "sync everything," run both A and B; they
don't conflict, they read different parts of the same Notion page/row.

---

## C. 照顧能力表 (skills)

`DATA.skills.groups[0].items[]` (single group, `照顧能力項目`).

Source: the Notion **page** "照顧寶寶能力檢視表", id
`30ffce77-9721-8090-b725-c6ccc9a8912c`. Plain flat markdown checklist, no headings, no
groups — every line is one skill.

### Field mapping & matching

Same shape as section B: no stable per-item ids, match **by name**. Existing matches
keep their locally-authored `note` (short explanation of how/why to do the skill —
never present in Notion, always hand-written here, never overwritten by a sync). New
Notion lines become new items with a fresh id and a new locally-authored note written
in the same voice as existing entries. Names removed from Notion get removed from the
HTML (no orphan-preservation net here either).

Checked/unchecked state in Notion is the user's own "have I actually learned this"
tracking, separate from the webpage's own 未學習/已學習 checkbox (localStorage). Same
rule as section B: never sync checked-state into the webpage unless explicitly asked.

### Ordering & ids

Per explicit user instruction (2026-08-10): **this tab's order should track Notion's
current order exactly, and ids get fully renumbered sequentially (`sk-1`...`sk-N`) to
match, on every sync** — unlike section B, where id stability is the default. The user
has confirmed they're fine with the resulting visitor-localStorage churn (any already-
recorded 已學習 progress can silently reattach to a different skill after a renumber,
same mechanism as described in section B's id warning) — don't re-raise that caveat
every time, a one-time mention is enough, but do still surface *what* changed (added /
removed / reordered) after each sync so the user can sanity-check.

---

## After syncing

Tell the user what changed (added / updated / removed, by name) for whichever
section(s) you ran, and surface anything you had to flag as ambiguous during matching
instead of guessing. Do not publish — that is the separate `npchecklist-publish` skill,
only on explicit request.
