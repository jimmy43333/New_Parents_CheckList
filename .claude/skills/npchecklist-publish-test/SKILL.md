---
name: npchecklist-publish-test
description: Publish the local 新手爸媽準備清單 checklist (npchecklist.html) to its throwaway TEST Claude Artifact — not the production link. Only use when the user explicitly asks for a test/staging publish (發布測試, 測試版, "publish test", "test 一下"), never for a bare 發布/"publish" (that's npchecklist-publish, the production skill).
---

# npchecklist test-publish workflow

Some bugs are specific to how the Claude Artifact platform wraps published
content (e.g. the mobile pinch-zoom bug on 2026-08-11 turned out to be caused
by the published page's `<meta viewport>` tag landing inside `<body>`, not
`<head>`, purely because of the Artifact wrapper — `npchecklist-dev`'s local
`dev_server.py` preview serves the raw file directly and can't reproduce that
class of bug). This skill exists so those platform-specific behaviors can be
verified on a real Artifact without touching the production version history.

## The working file

`npchecklist.html` (project root) — same file as `npchecklist-dev` and
`npchecklist-publish` use. Never edit it differently for a test publish;
you're always testing exactly what would go to production.

## Target Artifact URL

`https://claude.ai/code/artifact/936d69df-d148-4671-9bb9-92dad69a8b8e`

This is the *former* production URL, repurposed as the test link on
2026-08-11. Publish here as freely as needed — there is no version-label
discipline for this link (see below), and no need to warn about version-picker
clutter the way `npchecklist-publish` does for the real one.

## Workflow

**Only when the user explicitly asks for a test/staging publish** — distinct
from a bare "發布"/"publish", which means the production skill instead:

1. Load the `artifact-design` skill first if it hasn't been loaded yet this
   session (required before writing/publishing artifact HTML).
2. Do **not** touch the on-page `版本:vN` label — that bookkeeping exists for
   the production link only (see `npchecklist-publish`'s SKILL.md for why).
   Leave it exactly as it is in the working file.
3. **Never publish `npchecklist.html` directly for this link.** The Artifact
   platform names/titles the artifact from whatever `<title>` tag it finds in
   the published content (confirmed 2026-08-11), and `npchecklist.html`'s
   `<title>` is the bare production name "新手爸媽準備清單" — publishing the
   file as-is silently resets the artifact's display name back to that,
   discarding any name the user set manually (e.g. "新手爸媽準備清單-測試").
   Instead: copy `npchecklist.html` to a scratchpad temp file, change only its
   `<title>…</title>` text to "新手爸媽準備清單-測試" (nothing else — same
   rule as step 2, don't diverge functional content), and publish *that* temp
   file's path as `file_path`, still with `url` set to the test URL. Do this
   on every test publish, not just when told to fix the name.
4. Call the `Artifact` tool with `file_path` set to that temp copy, `url` set
   to the test URL above (so it updates in place rather than minting yet
   another artifact), the same `favicon` (👶), and a short `label` describing
   what's being verified (e.g. "驗證手機縮放修正").
5. After publishing, remind the user this is the test link — once whatever
   they were checking looks right, the fix still needs a real
   `npchecklist-publish` run to reach production. Same version-picker caveat
   applies here too: a device that already opened this artifact before won't
   auto-jump to the newest version.
