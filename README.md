# CheatyBang

> The interactive Claude Code cheat sheet — by [Shimon Shmueli](https://github.com/shimonshmueli)

<!-- Add a screenshot here: assets/screenshot.png -->

**[Live →](https://cheatybang.vercel.app)**

Pick your environment (Desktop · CLI · VS Code · Cursor), pick your level (Beginner → Mid → Pro), and get the moves that apply to you — right now, in one page.

---

## Why CheatyBang?

Most Claude Code references are flat docs you read once and forget. CheatyBang is a quick-reference tool you keep open while you work:

- **Environment-aware** — Desktop, CLI, VS Code, and Cursor each have different commands and behaviours; the content adjusts to match yours
- **Progressive levels** — start at Beginner and unlock Mid and Pro items as you grow; nothing is hidden forever, just surfaced at the right time
- **Fuzzy search** across every item, tag, and example
- **Drill-down modals** with per-environment code examples for each item
- **Section info** — the `?` button on each section explains when and how to use that whole area
- **Glossary** of Claude Code terms
- **Decision trees** — "which tool do I reach for?" answered interactively
- **Pin items** you reference constantly to the top
- Themes (Indigo · Claude · Slate · Emerald) · light and dark mode

## Who is this for?

Anyone who uses Claude Code — whether you installed it yesterday or you're wiring up multi-agent pipelines. The Beginner level covers setup, slash commands, and memory. Mid adds hooks, MCP, and scripting. Pro surfaces the power moves and advanced integrations. You grow into the tool rather than being overwhelmed by it upfront.

## Run locally

Static site — no build step.

```bash
python3 -m http.server 5173
# or
npx serve .
```

Then visit http://localhost:5173.

## Deploy

```bash
vercel
```

No build step. Deploys as a static site. Current version: v0.2.

## Project layout

```
CheatyBang/
├── index.html                  shell, header, layout, all modal markup
├── styles.css                  custom layer over Tailwind CDN
├── app.js                      Alpine component: state, filters, search, modal, theme
├── content/
│   ├── cheatsheet.json         ← all cheat sheet content (single source of truth)
│   ├── glossary.json           ← glossary terms
│   └── decisions.json          ← decision trees
└── assets/
```

See [CLAUDE.md](./CLAUDE.md) for the full architecture and data model.

## Contributing

Suggestions, fixes, and pull requests are welcome. See **[CONTRIBUTING.md](./CONTRIBUTING.md)** for the full guide.

Quick links:
- [Report a wrong or missing item](../../issues/new?template=content-issue.yml)
- [Report a bug](../../issues/new?template=bug-report.yml)
- [Suggest a feature](../../issues/new?template=feature-request.yml)

## License

MIT — see [LICENSE](./LICENSE). © Shimon Shmueli.
