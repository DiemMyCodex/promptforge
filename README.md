# PromptForge

[![Svelte 5](https://img.shields.io/badge/Svelte-5-FF3E00?logo=svelte&logoColor=fff)](https://svelte.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=fff)](https://vite.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss&logoColor=fff)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=fff)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

A local-first Prompt & Skill Studio for AI coding agents. Draft `AGENTS.md`, `SKILL.md`, Master Prompts and provider snippets, watch a safe live Markdown preview, then copy or export the `.md` — entirely in your browser.

No backend. No database. No account. No API keys. Nothing leaves your device.

## Features

- **Runes-only Svelte 5** — `$state`, `$derived`, `$effect`, `$props`, `$bindable` and snippets. Zero legacy component syntax.
- **Local persistence** — every document, tag, favorite, theme and selection is synced to `localStorage` under a versioned key.
- **Built-in starter templates** — SKILL.md with validated YAML frontmatter, AGENTS.md, Master Prompt and an OpenCode custom provider snippet.
- **Agent-focused editor** — tab/Shift+Tab indentation, one-click snippet insertion, tag management, live token/word/line/character/byte counts.
- **Safe live preview** — all HTML metacharacters are escaped before rendering, link targets are scheme-checked, and frontmatter is validated with inline diagnostics.
- **Import / export** — drop in any `.md`, `.markdown` or `.txt`; copy to clipboard or download a clean `.md`.
- **Developer-tool UI** — zinc/slate dark default, light theme, crisp borders, split panes on desktop, tabbed Editor/Preview at 375px, 44px tap targets, WCAG AA contrast and reduced-motion support.

## Quick start

Requires Node.js 20.19+ and pnpm.

```bash
pnpm install
pnpm dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## Verification

```bash
pnpm exec svelte-check --tsconfig ./tsconfig.json
pnpm build
```

Both commands must finish with zero errors and zero warnings. `pnpm build` writes a static bundle to `dist/`.

To preview the production bundle locally:

```bash
pnpm preview
```

## Project structure

```text
promptforge/
├── src/
│   ├── components/
│   │   ├── EditorPane.svelte      # editor, snippets, tags, live counters
│   │   ├── Header.svelte          # branding, import, theme, GitHub link
│   │   ├── PreviewPane.svelte     # sanitized Markdown, frontmatter, copy/export
│   │   └── Sidebar.svelte         # search, tags, templates, document list
│   ├── lib/
│   │   ├── stores/workspace.svelte.ts  # rune store + localStorage sync
│   │   ├── templates.ts                # built-in starter documents
│   │   ├── types.ts                    # strict domain interfaces
│   │   └── utils/
│   │       ├── markdown.ts             # escape-first renderer
│   │       └── tokens.ts               # token estimator + frontmatter validator
│   ├── App.svelte
│   ├── app.css                    # Tailwind v4 @import + @theme tokens
│   └── main.ts
├── vercel.json                    # static dist output + SPA fallback
└── README.md
```

## Deploy to Vercel

1. Push this folder to a GitHub repository.
2. In Vercel, choose **Add New → Project** and import that repository.
3. Vercel detects Vite. Keep the defaults, or confirm:
   - **Build command:** `pnpm build`
   - **Output directory:** `dist`
   - **Install command:** `pnpm install`
4. Add no environment variables — there are none.
5. Deploy. `vercel.json` already supplies the SPA rewrite to `index.html`.

CLI alternative:

```bash
pnpm dlx vercel --prod
```

## Privacy note

Documents are stored in your browser's `localStorage` only. Clearing site data removes them. Export anything you want to keep. Both repository links read from one place: `src/lib/config.ts`. Override the default with a `VITE_GITHUB_URL` build-time variable if you fork the project.

## License

[MIT](./LICENSE) © 2026 PromptForge contributors.
