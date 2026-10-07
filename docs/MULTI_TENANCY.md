# Multi-tenancy (tenant panel)

The plan, decisions, work orders and changelog live in the **backend** repo:
`backend/docs/multi-tenancy/` — start with `README.md`.

This repo is the tenant panel on its own (WO-45, 2026-10-07). It was split from
the super-admin panel (`mint-admin`), which served both panels from one app; the
shared components still branch on `IS_TENANT_PANEL`, which is always `true` here.
A change to a component both panels have must now be made in both repos.

**Docs:** the user guides live on docs.mintapp.shop (`mint-docs`). Guide links
on shared screens go through `docsPath()` (panel.ts); keep section anchors in step.

**Home:** `/` is the public landing page (`src/app/_landing`) and the dashboard is
`/dashboard`. Link or redirect home with `HOME` (panel.ts), never a bare `'/'`.

**Project addresses:** inside a project the address is `/<publicSlug>/<page>`
(`src/proxy.ts` rewrites it onto the app's page; `projectHref()` makes links;
the project comes from the address, per tab). New page folders are picked up
automatically (next.config.mjs).

**Sign-in:** the token is kept under `MINT_TENANT_TOKEN` (constants.tsx).
