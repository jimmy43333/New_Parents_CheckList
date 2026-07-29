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

`/home/tgsung/Desktop/Side_Project/New_Parent_Checklist/npchecklist.html`

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

## Workflow

**Only when the user explicitly says to publish** (「發布」, "publish", etc.):

1. Load the `artifact-design` skill first if it hasn't been loaded yet this
   session (required before writing/publishing artifact HTML).
2. Call the `Artifact` tool with `file_path` set to the working file above,
   `url` set to the existing artifact URL (so it updates in place), the same
   `favicon` (👶), and a short `label` describing what changed in this batch.
3. After publishing, remind the user that the on-page version picker doesn't
   auto-select "latest" for a device/browser that has already opened this
   artifact before — they (or whoever they shared it with) may need to
   manually pick the newest version once on that device. There is no tool
   available to prune old versions or force always-latest behavior; that
   lives in the claude.ai Artifact viewer chrome, outside what these tools
   can control.
