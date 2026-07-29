---
name: npchecklist-dev
description: Local-first dev loop for the 新手爸媽準備清單 checklist — edit the local HTML file with live-reload in the browser. Publishing to the Claude Artifact and syncing from Notion are separate skills (npchecklist-publish, npchecklist-notion-sync); this one only covers routine local edits.
---

# npchecklist dev workflow

This project iterates on a single-page checklist tool that also lives as a Claude
Artifact. Editing locally (instead of publishing on every tweak) keeps the Artifact's
version picker clean. This skill is intentionally narrow — it only covers the routine
"edit the file, see it live" loop, so it stays cheap to load on every small change.
Publishing and Notion sync are separate skills, loaded only when actually needed.

## The working file

`/home/tgsung/Desktop/Side_Project/New_Parent_Checklist/npchecklist.html`

This file's contents are exactly what gets published to the Claude Artifact — it
starts at `<title>` and has no `<!doctype>`, `<html>`, `<head>`, or `<body>` tags
(the Artifact platform wraps those automatically at publish time). Never add them.

## Workflow

1. **On every change request**, edit `npchecklist.html` directly with Edit/Write.
   Do **not** call the Artifact tool for this — no publish on every tweak. If the
   user asks to publish, that's the `npchecklist-publish` skill, not this one.

2. **Make sure the local preview server is running** so the user's browser
   auto-refreshes on save:
   - Check first: `ps aux | grep dev_server.py | grep -v grep` (don't start a
     duplicate if one's already up).
   - If none is running, start it in the background:
     `cd "/home/tgsung/Desktop/Side_Project/New_Parent_Checklist" && nohup python3 dev_server.py 5555 > /tmp/dev_server.log 2>&1 & disown`
   - This is `dev_server.py` in the project root — a small dependency-free
     Python `http.server` wrapper (no npm/network needed; `npx live-server` was
     tried first but hit a network/port hiccup in this environment, so this
     replaced it). It serves `npchecklist.html` and injects a tiny polling
     reload script (checks `/__mtime`, reloads on change) **only in the HTTP
     response** — it never writes to the file on disk, so the file always
     stays byte-for-byte what will eventually get published.
   - Give the user the local preview URL once: `http://127.0.0.1:5555/npchecklist.html`.
     No need to repeat it every turn — just keep editing the file and the
     already-open browser tab will auto-refresh within ~1s of each save.

3. **Keep iterating locally** across as many turns as needed without publishing.
