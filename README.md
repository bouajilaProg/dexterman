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

## Docker

Build and run with Docker Compose:

```bash
docker compose up --build
```

This runs the app in dev mode with auto-reload:

- `tsx watch` restarts server on `src/` edits
- Tailwind watches `src/styles/tailwind.css` and writes `public/styles.css`
- bind mounts keep code/data changes live in the container

Then open:

```bash
http://localhost:3000
```
