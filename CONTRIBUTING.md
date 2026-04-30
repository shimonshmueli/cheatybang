# Contributing to CheatyBang

Thanks for wanting to help. CheatyBang is maintained by [Shimon Shmueli](https://github.com/shimonshmueli) and welcomes contributions of all kinds — content fixes, new items, UI improvements, and bug reports.

## Two ways to contribute

### 1. Content (cheat sheet items, glossary, decision trees)

All cheat sheet content lives in `content/cheatsheet.json`. It is the single source of truth — the UI is fully data-driven.

**To add or edit an item:**

1. Fork the repo and create a branch (`git checkout -b content/your-item-name`)
2. Edit `content/cheatsheet.json` following the schema below
3. Open `index.html` in a browser (no build step) and verify it looks right
4. Submit a PR with a short description of what changed and why

**Data model — item fields:**

```jsonc
{
  "id": "unique-kebab-case-id",          // required, must be globally unique
  "title": "Display title",              // required; use font-mono style for /commands
  "level": "beginner",                   // required: "beginner" | "mid" | "pro"
  "summary": "One-line description.",    // required; shown inline on the card
  "details": "Longer explanation.",      // required; shown in the drill-down modal
  "tags": ["tag1", "tag2"],             // optional; drives tag-filter clicks
  "envs": ["cli", "vscode"],            // optional; omit if item applies to all envs
  "example": {                           // use this OR envExamples, not both
    "lang": "bash",                      // "bash" | "text" | "json" | "markdown" etc.
    "code": "claude --version",
    "note": "Optional caption."
  },
  "envExamples": {                       // per-env overrides; omit envs not covered
    "cli":     { "lang": "bash", "code": "...", "note": "" },
    "vscode":  { "lang": "text", "code": "...", "note": "" }
  },
  "pitfalls": "Common mistake to avoid.", // optional; shown in modal
  "table": {                              // optional reference table in modal
    "headers": ["Flag", "Effect"],
    "rows": [["--verbose", "More output"]]
  }
}
```

**Level tiers** — Beginner sees beginner only; Mid sees beginner + mid; Pro sees all three. Choose the lowest level where the item genuinely makes sense for someone new to that concept.

**Categories** — Prefer adding to an existing category over creating a new one. Categories are intentionally broad. If you feel a new category is truly warranted, open an issue to discuss it first.

**Style guide:**
- `summary` — one sentence, present tense, no trailing period is fine
- `details` — explain the *why*, not just the *what*; 2–5 sentences
- `pitfalls` — only when there is a genuinely common mistake; skip if nothing stands out
- Code examples — prefer the shortest example that demonstrates the real behaviour

### 2. UI / code

The UI is vanilla HTML + Alpine.js + Tailwind CDN. No build step — open `index.html` and it works.

1. Fork the repo and create a branch (`git checkout -b fix/your-fix` or `feat/your-feature`)
2. Make your changes in `index.html`, `styles.css`, or `app.js`
3. Test in at least one light and one dark theme, and at the three column counts (1 / 2 / 3)
4. Submit a PR

## Opening issues

Use the structured templates — they help get things resolved faster:

- **[Content issue](../../issues/new?template=content-issue.yml)** — wrong info, missing item, missing env example
- **[Bug report](../../issues/new?template=bug-report.yml)** — something broken in the UI
- **[Feature request](../../issues/new?template=feature-request.yml)** — ideas and improvements

For quick questions or discussion, GitHub Issues is the right place.

## Pull requests

- Keep PRs focused — one topic per PR is easier to review and merge
- Reference the related issue if one exists (`Closes #123`)
- For content PRs: note your source (official Claude Code docs, release notes, etc.)
- For UI PRs: describe what you tested

## Attribution

CheatyBang is MIT licensed. By contributing, you agree your changes are released under the same license. The project is created and maintained by Shimon Shmueli — please keep the attribution in place per the MIT terms.
