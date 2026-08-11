---
name: npchecklist-publish
description: Publish the local 新手爸媽準備清單 checklist (npchecklist.html) to its Claude Artifact. Only use when the user explicitly says to publish (發布, "publish").
---

# npchecklist publish workflow

Local edits happen constantly (see `npchecklist-dev`), but publishing to this
production Artifact should be rare and deliberate — every publish adds an entry to the
Artifact's version picker, and made it hard for the user (and anyone they shared the
link with, e.g. via Teams/Notion) to reliably see the latest content. So: publish only
on request. For Artifact-platform-specific testing before a real release, use the
sibling `npchecklist-publish-test` skill instead, which targets a separate throwaway
link with no version discipline.

## The working file

`npchecklist.html` (project root)

This file's contents are exactly what gets published — it starts at `<title>` and has
no `<!doctype>`, `<html>`, `<head>`, or `<body>` tags (the Artifact platform wraps those
automatically at publish time). Never add them.

Target Artifact URL (update in place, never mint a new one unless the user asks
for a separate artifact):
`https://claude.ai/code/artifact/5a0c702a-8f34-4238-a926-cf0f7c087237`

(The original artifact, `.../dcb69ff9-c259-4a4f-9030-680b0d2164b8`, was deleted
or lost write access on 2026-07-29 — publishing to it now fails with "the
artifact you're updating was deleted, or you no longer have write access to
it". If that ever happens again to the current URL, mint a fresh artifact with
`Artifact` and no `url` param, then update this file with the new URL.)

On 2026-08-11 the previous production URL
(`.../936d69df-d148-4671-9bb9-92dad69a8b8e`) was repurposed as the
free-to-publish test link — see `npchecklist-publish-test`. This skill's URL
above is the new production link; it should be shared anywhere the old one
was previously distributed (Teams, Notion, etc.).

**Minting a new artifact from `npchecklist.html` inside a session that has
already published this same file path won't create a separate URL** — the
`Artifact` tool redeploys to whatever URL that file path is already bound to
in this session, even without a `url` param. To genuinely mint a new one,
publish a throwaway copy of the file under a different path first, capture
its URL, then switch back to publishing `npchecklist.html` with that URL
passed explicitly — explicit `url` does correctly retarget away from the
file's prior in-session binding.

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
