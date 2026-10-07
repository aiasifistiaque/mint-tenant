# Templates (Template Studio)

The plan, decisions, work orders and changelog live in the **backend** repo:
`backend/docs/templates/` — start with `README.md`, then the Handoff section
of `WORK_ORDERS.md`.

Admin-side summary: the studio is a **super admin** feature at `/templates`
(gallery, `/templates/[id]` editor, `/templates/connect` for the Templates MCP
keys). A template is a blueprint only — the studio never builds models; a
preview opens a throwaway project in the tenant panel (`/auth/preview`).
Every tab and dialog explains itself and links to its `/docs/templates#…`
section.
