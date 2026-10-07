# MINT — tenant panel

The workspace MINT's customers sign in to: organizations, projects, models and
their records, pages, sidebar, dashboard, media, public API, websites, widgets,
payments, webhooks, team and roles.

It started as a copy of the super-admin panel (`aiasifistiaque/mint-admin`),
which used to serve both panels from one app (`NEXT_PUBLIC_PANEL=tenant`). Since
2026-10-07 the tenant panel is its own repo:

- only the pages tenants use are here (the super admin's own pages were removed);
- `IS_TENANT_PANEL` is always `true` (`src/components/library/config/lib/constants/panel.ts`);
- it looks like the marketing website (`aiasifistiaque/mint-website`) — see *Look* below.

The plan, decisions and work orders for the tenant platform live in the backend
repo: `backend/docs/multi-tenancy/` (WORK_ORDERS.md → WO-45, WO-46).

## Run it

```bash
cp .env.example .env.local   # point NEXT_PUBLIC_BACKEND at <backend>/tenant/api
npm install
npm run dev                  # http://localhost:3500
```

`npm run build` must pass before a push (Turbopack scope hoisting stays off —
see `next.config.mjs`).

### Production env

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_BACKEND` | `https://<api>/tenant/api` |
| `NEXT_PUBLIC_URL` | this panel's own address |
| `NEXT_PUBLIC_SIDEBAR_TYPE` | `server` |
| `NEXT_PUBLIC_DOCS_URL` | `https://docs.mintapp.shop` (default) |
| `NEXT_PUBLIC_SITES_URL` | the site renderer, for website previews |

## Addresses

- `/` — the public landing page (`src/app/_landing`); `/auth/*` — sign in, sign up, 2FA, invitations.
- `/dashboard` — the organization's home; `/projects`, `/org/*`, `/settings` — organization and account.
- `/<project>/<page>` — inside a project (`src/proxy.ts` rewrites onto the app's pages):
  `/acme-store` → `/dashboard`, `/acme-store/clients` → `/t/clients`,
  `/acme-store/clients/<id>` → `/view/clients/<id>`. Build links with `projectHref()` / `pagePath()`.
- User guides live on docs.mintapp.shop (`mint-docs`); `/docs/*` links go there through `docsPath()`.

## Look

The panel wears the marketing website's style (mint-webpage `src/app/globals.css`,
`src/lib/tones.ts`). The components are the admin's; only the styling differs:

- **Palette** — the website's light page (#fbfbfd, white panels, hairline #e6e8ef) and
  thinkcrypt.dev's neutral black at night (#0d0d0d, #1b1b1b panels, #faf8f1 text). It is the
  built-in theme (`src/theme/palettes.ts`, id `default`, named MINT) and is painted into the
  tokens themselves (`colors.theme.ts`, `index.ts`, mapping in `roles.ts`), so first paint is
  right. Accounts can still pick another colour theme (`applyTheme.ts`).
- **Type** — Outfit for everything at light weights, JetBrains Mono labels
  (`src/app/layout.tsx`); h1–h3 uppercase and extra-light; weights 500–800 are tokens one
  step lighter (no semibold or bold); field labels and table headers in mono spaced capitals.
- **Shapes** — pill buttons (ink pill with a violet glow on hover; hairline secondary),
  12px fields, 16px panels, 20px dialogs (`src/theme/recipes.ts`, `radius` in `constants.tsx`).
- **Colour** — the website's six tones (`src/theme/tones.ts`): one per sidebar section (its
  icon and the current page's dot), project kinds on glyph tiles, dashboard chart series.
  The MINT mark and the organization's name in spaced capitals top the sidebar.

Keep it in step with the website: when its palette, tones or type change, change
`palettes.ts` (default theme), `tones.ts` and `AuthFrame.tsx` here too.

## Conventions

Tabs and single quotes (there is no Prettier config — don't run a bare `prettier`).
Chakra tokens, not hex, outside `theme/`; the cl `Dropdown` for selects; `PromptDialog`
for confirms; `ModalFooter` in every dialog; no backdrop blur on modals.
