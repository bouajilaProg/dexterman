```
pnpm install
pnpm run dev
```

```
open http://localhost:3000
```

This project now supports:

- Hono server-side HTML responses
- JSX rendering with `hono/jsx`
- Tailwind CSS v4 built from `src/styles/tailwind.css` into `public/styles.css`

## Local Dev

```bash
pnpm run dev
```

## Docker (Production-like)

```bash
pnpm run docker:up
```

or:

```bash
docker compose up --build
```

Then open:

```bash
http://localhost:3000
```

Stop:

```bash
pnpm run docker:down
```

## Docker Dev (Live Reload)

```bash
pnpm run docker:dev:up
```

or:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

This runs with bind mounts and auto-reload:

- `tsx watch` restarts server on `src/` edits
- `tsc --watch` keeps browser-side editor modules emitted in `dist/`
- Tailwind watches `src/styles/tailwind.css` and writes `public/styles.css`

Then open:

```bash
http://localhost:3000
```

Stop:

```bash
pnpm run docker:dev:down
```
