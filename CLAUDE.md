# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**CheatyBang** — a static, single-page Claude Code cheat sheet. Hosted on Vercel.

The user picks an **environment** (Desktop / CLI / VS Code / Cursor) and a **level** (Beginner / Mid / Pro). Items are filtered by level (beginner-only, beginner+mid, or all). Examples in the drill-down modal adapt to the selected environment.

## Stack

- Vanilla HTML/CSS/JS — no build step in v0.1.
- **Tailwind** via Play CDN, **Alpine.js** for reactivity, **Fuse.js** for fuzzy search, **Google Fonts** (Inter + JetBrains Mono).
- All cheat sheet content lives in `content/cheatsheet.json` — keep it the single source of truth. UI code in `app.js` and `index.html` should stay generic and data-driven.

## File map

- `index.html` — shell, header, layout, modal markup
- `styles.css` — small custom layer over Tailwind
- `app.js` — Alpine `app()` component: state, filters, search, modal, theme
- `content/cheatsheet.json` — categories → items → per-env examples
- `api/ask.js` *(phase 2)* — Vercel Edge Function proxy to Anthropic API for LLM-backed search
- `vercel.json` — Vercel config

## Data model (cheatsheet.json)

Every item must have: `id`, `title`, `level` (`beginner` | `mid` | `pro`), `summary`, `details`, and either `example` (default for all envs) or `envExamples` (per-env override map keyed by `desktop` | `cli` | `vscode` | `cursor`). When an env-specific override is missing, fall back to `example`.

`level` is a tier, not a tag. Beginner sees beginner only; Mid sees beginner+mid; Pro sees all three.

## Conventions

- **MIT licensed** — see `LICENSE`. Generated files use an SPDX header (`SPDX-License-Identifier: MIT` + `By Shimon Shmueli`) instead of the bare `©` marker. This overrides the global "© Shimon Shmueli" rule for this project. The `LICENSE` file itself keeps the standard MIT copyright assertion line because removing it would invalidate the license.
- Keep dependencies CDN-only until we explicitly add a build step.
- Prefer adding items to existing categories over inventing new ones; categories are deliberately broad.

## Owner content workflow

Run `/refresh-cheatsheet` (custom command in `.claude/commands/refresh-cheatsheet.md`) every ~2 weeks. It asks Claude to diff official Claude Code docs against the current dataset and propose updates as a unified diff for review. Owner reviews, commits, pushes — Vercel redeploys.

<!-- SPDX-License-Identifier: MIT -->
<!-- By Shimon Shmueli -->
