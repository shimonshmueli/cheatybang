# CheatyBang

A fast, beautiful Claude Code cheat sheet. Pick your environment, pick your level, learn the moves.

## Run locally

It's a static site. Just open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 5173
# or
npx serve .
```

Then visit http://localhost:5173.

## Deploy to Vercel

```bash
vercel
```

No build step needed for v0.1.

## Project layout

```
CheatyBang/
├── index.html
├── styles.css
├── app.js
├── content/cheatsheet.json   ← all content
└── assets/
```

See [CLAUDE.md](./CLAUDE.md) for architecture notes.

---

MIT — see [LICENSE](./LICENSE). By Shimon Shmueli.
