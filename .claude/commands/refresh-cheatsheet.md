---
description: Diff the official Claude Code docs against this repo's content/*.json and propose updates as a unified diff for review. Owner reviews + commits.
allowed-tools: Read, Write, Edit, Bash(git:*), WebFetch
model: opus
---

You are the curator for **CheatyBang**, a Claude Code cheat-sheet hosted at this repo's root. Your job: refresh `content/cheatsheet.json`, `content/glossary.json`, and `content/decisions.json` so they reflect the **current state of Claude Code**, then hand the owner a clean diff to review.

## What to do

1. **Read the current dataset.** Load all three JSON files in `content/`. Note schemas: each item has `id`, `title`, `level` (`beginner`|`mid`|`pro`), `summary`, `details`, optional `pitfalls`, optional `envs`, optional `tags`, optional `example`, optional `envExamples`, optional `table`, optional `updated`, optional `since`. Categories are top-level objects in `categories[]`. The Pinned pseudo-category is generated at runtime; don't add it to the data.

2. **Fetch the official docs.** Use WebFetch on each URL in `.claude/docs-sources.txt` (one per line). If that file doesn't exist, ask the owner for the canonical doc URL list and offer to create it. Skip URLs that 4xx; report them.

3. **Build a delta plan.** For each fetched page:
   - **Edits** to existing items where the docs disagree (rename, reword, new flag, removed flag).
   - **New items** for features the cheat-sheet doesn't cover yet — pick the right category by feel.
   - **Obsoletions**: items that describe behavior the docs no longer document. Flag them; suggest removal but don't delete unilaterally.
   - **`updated` / `since`**: add or refresh these fields where you have evidence.

4. **Write the changes locally** to `content/*.json` files. Keep changes surgical — don't reformat untouched lines, don't drop fields you can't verify, don't reorder existing items. Preserve the `_license` field at the top of each file.

5. **Produce a review report.** After writing, print:
   - A `git diff --stat` summary.
   - A short bullet list of the most consequential changes (5–10 items).
   - A "needs human judgment" list — anything you weren't confident about.
   - Any URLs that failed to fetch or returned ambiguous content.

6. **Stop before committing.** The owner will review with `git diff` and commit/push themselves. Do **not** run `git commit` or `git push`.

## Constraints

- Don't fabricate URLs in any field. If you can't verify, leave the field blank.
- Keep `level` honest — beginner content stays beginner. Don't promote things to "pro" just because the underlying mechanism is complex.
- Pitfalls are precious — only add a pitfall if you have a concrete failure mode in mind, not a vague worry.
- Preserve item IDs. Renaming an item's title is fine; renaming its `id` breaks every existing pin and deep-link in the wild.
- If a docs page contradicts a `pitfalls` entry (i.e. the pitfall is now obsolete), flag it for removal in the report — don't silently delete.

## Output to the owner

End your response with:
- `git diff --stat`
- A concise changelog (~150 words) suitable for a commit message.
- The bullet list of items needing human judgment.

The owner takes it from there.
