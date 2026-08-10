---
name: npchecklist-publish
description: Publish the local 新手爸媽準備清單 checklist (npchecklist.html) to its Claude Artifact. Only use when the user explicitly says to publish (發布, "publish").
---

# npchecklist publish workflow

Local edits happen constantly (see `npchecklist-dev`), but publishing to the Claude
Artifact should be rare and deliberate — every publish adds an entry to the Artifact's
version picker, and made it hard for the user (and anyone they shared the link with,
e.g. via Teams/Notion) to reliably see the latest content. So: publish only on request.

## The working file

`npchecklist.html` (project root)

This file's contents are exactly what gets published — it starts at `<title>` and has
no `<!doctype>`, `<html>`, `<head>`, or `<body>` tags (the Artifact platform wraps those
automatically at publish time). Never add them.

Target Artifact URL (update in place, never mint a new one unless the user asks
for a separate artifact):
`https://claude.ai/code/artifact/936d69df-d148-4671-9bb9-92dad69a8b8e`

(The original artifact, `.../dcb69ff9-c259-4a4f-9030-680b0d2164b8`, was deleted
or lost write access on 2026-07-29 — publishing to it now fails with "the
artifact you're updating was deleted, or you no longer have write access to
it". If that ever happens again to the current URL, mint a fresh artifact with
`Artifact` and no `url` param, then update this file with the new URL.)

## On-page version label

The hero section has a hardcoded line: `<p class="hero-updated">更新日期:... ·
版本:vN</p>` (search for `hero-updated` / `版本:v`). This is a plain text label the
page displays about itself — it is not read from anywhere and has no connection to the
Artifact platform's own internal version counter (the one behind the version picker)
except by manual bookkeeping.

**The trap:** every `Artifact` publish call bumps the platform's real version counter
by 1, *including* a publish that only fixes this label. So if you edit `vN` → `vN+1`
and then publish, that publish itself becomes real version `N+2`, not `N+1` — the label
is already one behind the moment it goes live. This bit us on 2026-08-10: the label sat
at v4 through a content-only publish (real version became 5, label still said v4), then
got hand-edited to "v5" and published (real version became 6, label said v5) — visibly
wrong ("你再重新發布應該變v6吧").

**The fix:** before *every* publish (content-changing or label-only), set the label to
(current label number) **+ 1**, unconditionally — never to the number the label
currently shows. Treat the label as "the version this publish is about to become," not
"the version that's currently live." Do this even on a publish that only bumps the
label with no other content change.

## Workflow

**Only when the user explicitly says to publish** (「發布」, "publish", etc.):

1. Load the `artifact-design` skill first if it hasn't been loaded yet this
   session (required before writing/publishing artifact HTML).
2. Find the current `版本:vN` label (see above) and edit it to `vN+1` — always,
   even if nothing else in this publish changed.
3. Call the `Artifact` tool with `file_path` set to the working file above,
   `url` set to the existing artifact URL (so it updates in place), the same
   `favicon` (👶), and a short `label` describing what changed in this batch.
4. After publishing, remind the user that the on-page version picker doesn't
   auto-select "latest" for a device/browser that has already opened this
   artifact before — they (or whoever they shared it with) may need to
   manually pick the newest version once on that device. There is no tool
   available to prune old versions or force always-latest behavior; that
   lives in the claude.ai Artifact viewer chrome, outside what these tools
   can control.
