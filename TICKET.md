# Ticket: API Docs Module

## Goal
Create a read-only API docs page in the style of swagger.io — a single-page viewer with expandable API items, no sidebar. Users browse APIs by expanding items directly on the page.

See: https://editor.swagger.io/

## Pattern Reference

| Editor Pattern | File | Purpose |
| - | - | - |
| base layout | `src/pages/editor/page.html` | HTML shell with `#sidebar` + `#editor` |
| server entry | `src/pages/editor/editor.ts` | Route handlers, XML load |
| client entry | `src/pages/editor/ui.ts` | DOM interaction |
| main panel | `src/pages/editor/components/editor.xsl` | XSLT transform → content |
| sidebar | `src/pages/editor/components/sidebar.xsl` | XSLT transform → list |
| transform lib | `src/lib/transform.ts` | XSL + XML → HTML (moved from editor/lib/) |

The `transform.ts` module already handles XSLT → HTML rendering. Use it.

## Todo

- Design and implement a new standalone `/docs` page (no sidebar).
- Render all APIs as expandable accordion items using DaisyUI `<details>`.
- Each item displays: method badge, path, request params, response fields.
- Add "Execute" button per endpoint.
- Wire up endpoint execution (function to be created in `executor.ts`).
- Display response in an output section (JSON formatted).

## Notes
- `transform.ts` is already available for XSLT → HTML.
- Source: `data/base.xml` — same XML as editor, no separate docs data.
- Single-page layout, no sidebar navigation.
- Follow swagger.io aesthetics: clean, expandable cards per endpoint.