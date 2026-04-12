# AGENTS.md

Keep this file compact and high-signal. Include only details an agent is likely to miss.

## Dev commands (pnpm)
- Install: `pnpm install`
- Dev server + CSS watch: `pnpm run dev` (runs `tsx watch src/index.tsx` + Tailwind build of `src/styles/tailwind.css` to `public/styles.css`)
- Docker dev server + CSS + client watch: `pnpm run docker:dev` (runs `tsc` once, then `tsx watch src/index.tsx` + `tsc --watch` + Tailwind build)
- Build: `pnpm run build` (builds CSS then `tsc`)
- Start production: `pnpm run start` (runs `dist/index.js`)
- Docker prod run: `pnpm run docker:up` (or `docker compose up --build`)
- Docker dev run: `pnpm run docker:dev:up` (or `docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build`)

## Runtime/entrypoints
- Server entry: `src/index.tsx` (Hono app, serves `/`, `/health`, `/editor/data`, `/editor/save`, and static assets from `public` + `dist/pages/editor`)
- Server-side editor logic: `src/pages/editor/editor.ts` (render/init + load/save handlers backed by `data/base.xml`, supports `?path=<api>` for root APIs and `?path=<folder>/<api>` for folder APIs)
- Editor client library: `src/pages/editor/editor-client.ts` (browser load/save helpers that call server endpoints)
- Editor UI boot: `src/pages/editor/ui.ts` (UI-only browser behavior; SAVE button + folder drag/drop autosave)
- Editor module lib: `src/pages/editor/lib/*` (editor-scoped serializer/transform helpers; module-local core)

## Dev vs Prod path resolution
- Determined automatically from `import.meta.url`: if running from `src/`, dev paths are used; if from `dist/`, prod paths.
- No `NODE_ENV` needed.
- XML data source is always `data/base.xml` (repo root `data/`), for both render and save.
- `public/styles.css` is generated; edit `src/styles/tailwind.css` instead.

## File map (role + pattern used)
- `Dockerfile` — production multi-stage image; installs deps, builds TS/CSS, runs `node dist/index.js`.
- `docker-compose.yml` — production-like container orchestration; runs default container command and maps host `3000`.
- `docker-compose.dev.yml` — docker dev override; runs `pnpm run docker:dev` with bind mounts for `src`, `data`, `public`, `scripts`.
- `.dockerignore` — excludes local build/cache/git files from Docker build context.
- `src/index.tsx` — Hono server entrypoint; serves static assets from `public` + `dist/pages/editor`.
- `src/pages/editor/editor.ts` — server-side editor module; route handlers + filesystem access for `data/base.xml`.
- `src/pages/editor/editor-client.ts` — browser-side editor client; fetch wrapper for `/editor/data` and `/editor/save`.
- `src/pages/editor/lib/transform.ts` — editor-local XSLT pipeline; XML + XSLT → HTML string, embeds into layout by element id.
- `src/pages/editor/lib/editor-data.ts` — editor-local serializer/parser; editor JSON model (`apis` + `folders`) ↔ XML `<collection>/<api>` and `<collection>/<group>/<api>`.
- `src/pages/editor/page.html` — base layout; HTML shell with `#sidebar` and `#editor` placeholders.
- `src/pages/editor/components/editor.xsl` — editor view template; uses named `xsl:call-template` helpers and renders selected API with inline main-panel not-found state.
- `src/pages/editor/components/sidebar.xsl` — sidebar view template; XSLT 1.0 transform for root APIs + folder/API tree with active API markers.
- `src/pages/editor/ui.ts` — browser behavior; caches data at init, builds payload from DOM + cache on SAVE, manages root/folder API actions, and autosaves folder API moves.
- `src/pages/editor/components/ui/editor.ts` — main attachEditor; wires click delegation, drag-drop, save via sub-modules.
- `src/pages/editor/components/ui/dirty-state.ts` — save button dirty/busy state management.
- `src/pages/editor/components/ui/empty-row.ts` — empty row placeholder for tables.
- `src/pages/editor/components/ui/row-actions.ts` — add/delete/move/toggle row handlers.
- `src/pages/editor/components/ui/drag-drop.ts` — API sidebar + table row drag-and-drop.
- `src/pages/editor/components/ui/save-handler.ts` — save button click handler.
- `src/pages/editor/**` files start with a small header comment block using `@title` and `@descrption` tags.
- `data/base.xml` — canonical editor dataset; persistent XML source of truth.
- `src/styles/tailwind.css` — Tailwind + DaisyUI config; design tokens defined via `@plugin`.
- `public/styles.css` — generated Tailwind output; built artifact (do not edit directly).
