/**
 * Which panel this build is (docs: backend/docs/multi-tenancy, D7/D8).
 *
 * This repo (mint-tenant) is the tenant panel only. It started as a copy of
 * the super-admin panel (mint-admin), whose components branch on
 * IS_TENANT_PANEL; here it is always on. Run it with
 * NEXT_PUBLIC_BACKEND=<api>/tenant/api.
 *
 * No imports here: the store and the API slice read this module.
 */
export type Panel = 'admin' | 'tenant';

export const PANEL: Panel = 'tenant';
export const IS_TENANT_PANEL = true;

export const BACKEND = (process.env.NEXT_PUBLIC_BACKEND || 'http://localhost:5000').replace(/\/+$/, '');

/**
 * Where tenants' sites call: the backend's root (the panel's API address
 * without /tenant/api or /admin/api) — so examples carry the real address.
 */
export const API_ORIGIN = BACKEND.replace(/\/(tenant|admin)\/api\/?$/, '');

/* ------------------------------------------------- the current project */

/**
 * Inside a project, the tenant panel's addresses start with it (docs/
 * multi-tenancy D18): /<project>/<page>, where <project> is the project's
 * publicSlug — so each tab can work in its own project, and a link names the
 * project it's in. src/proxy.ts serves them from the app's own pages:
 *
 *   /acme-store                    → /dashboard
 *   /acme-store/clients            → /t/clients          (a model's table)
 *   /acme-store/clients/<id>       → /view/clients/<id>  (a record)
 *   /acme-store/model-builder/new  → /model-builder/new  (PROJECT_PAGES)
 *
 * Organization and account pages (/projects, /org/…, /settings) have no project.
 */
export const PROJECT_PAGES = new Set([
	'dashboard', 't', 'view', 'model-builder', 'builder', 'sidebar-builder', 'dashboard-builder', 'images', 'public-api',
	'analytics', 'site-setup', 'get-started', 'activity', 'webhooks', 'widgets', 'site-payments', 'site-builder',
]);

// Every top-level page folder (next.config.mjs); any other first segment is a project.
const APP_PAGES = new Set(['api', '_next', ...(process.env.NEXT_PUBLIC_APP_PAGES || '').split(',').filter(Boolean)]);

/** Whether an address's first segment names a project rather than one of the app's pages. */
export const isProjectSegment = (segment = ''): boolean => !APP_PAGES.has(segment) && /^[a-z0-9][a-z0-9-]*$/.test(segment);

/** The project (publicSlug) the tab's address is in — tenant panel only. */
export const getProjectSlug = (): string | null => {
	if (!IS_TENANT_PANEL || typeof window === 'undefined') return null;
	const first = window.location.pathname.split('/')[1] || '';
	return isProjectSegment(first) ? first : null;
};

/** A project's address (the part after /<project>) → the app page that serves it. */
export const projectPagePath = (segments: string[]): string => {
	const [first, ...more] = segments;
	if (!first) return '/dashboard';
	if (PROJECT_PAGES.has(first)) return `/${segments.join('/')}`;
	if (more.length === 1 && more[0] === 'create') return `/t/${first}/create`;
	if (more.length === 1) return `/view/${first}/${more[0]}`;
	return `/t/${segments.join('/')}`;
};

/**
 * An app page's address inside a project (the reverse of projectPagePath):
 * '/t/clients?status=open' → '/acme-store/clients?status=open'. Anything that
 * isn't a project page, or with no project, is returned as it is.
 */
export const projectHref = (href: string, slug: string | null = getProjectSlug()): string => {
	if (!IS_TENANT_PANEL || !slug || typeof href !== 'string' || !href.startsWith('/')) return href;
	const cut = href.search(/[?#]/);
	const path = cut === -1 ? href : href.slice(0, cut);
	const rest = cut === -1 ? '' : href.slice(cut);
	const segments = path.split('/').filter(Boolean);
	const [first, ...more] = segments;
	if (!first || !PROJECT_PAGES.has(first)) return href;
	if (first === 'dashboard' && !more.length) return `/${slug}${rest}`;
	if (first === 't' && more.length === 1) return `/${slug}/${more[0]}${rest}`;
	if (first === 't' && more.length === 2 && more[1] === 'create') return `/${slug}/${more.join('/')}${rest}`;
	if (first === 'view' && more.length === 2) return `/${slug}/${more.join('/')}${rest}`;
	return `/${slug}/${segments.join('/')}${rest}`;
};

/**
 * The project this browser last worked in, as a cookie: an address that
 * doesn't name a project (/dashboard, or an older link to /model-builder) is
 * sent into it by src/proxy.ts. Set whenever a tab in a project is in front
 * (PanelGuard); cleared on leaving a project, switching organization, signing out.
 */
export const PROJECT_COOKIE = 'mint_project';

export const rememberProject = (slug: string | null) => {
	if (typeof document === 'undefined') return;
	document.cookie = slug
		? `${PROJECT_COOKIE}=${encodeURIComponent(slug)}; path=/; max-age=31536000; samesite=lax`
		: `${PROJECT_COOKIE}=; path=/; max-age=0; samesite=lax`;
};

/* ------------------------------------------------------- API addresses */

/**
 * Account and organization calls go to the tenant API's root; everything else
 * — tables, the builder, the sidebar, media — is inside the current project
 * (`<api>/p/<publicSlug>/…`), mirroring the admin API's paths.
 */
const ACCOUNT_PATH = /^\/?(auth|org|projects|invitations|notifications)(\/|\?|$)/;

/** The base URL a request for `path` goes to. */
export const apiBase = (path = ''): string => {
	if (!IS_TENANT_PANEL) return BACKEND;
	const project = getProjectSlug();
	if (!project || ACCOUNT_PATH.test(path)) return BACKEND;
	return `${BACKEND}/p/${project}`;
};

/** A full API URL for `path` (relative to the admin API's root). */
export const apiUrl = (path = ''): string => {
	if (/^https?:\/\//i.test(path)) return path;
	return `${apiBase(path)}/${path.replace(/^\/+/, '')}`;
};

/* ------------------------------------------------------- page addresses */

/**
 * Where "Home" is. The tenant panel's / is its public landing page (sign up,
 * sign in, or on to the dashboard), so its dashboard lives at /dashboard —
 * inside a project that's /<project> (projectHref); the super-admin panel's
 * dashboard is / itself. Link and redirect home with this, never a bare '/'.
 */
export const HOME = IS_TENANT_PANEL ? '/dashboard' : '/';

/** A sidebar link as this tab should follow it: '/' is HOME, and inside a project, the project's address. */
export const homeHref = (href: string): string => projectHref(href === '/' ? HOME : href);

/**
 * A model's table page. The tenant panel serves its projects' tables at
 * /<project>/<route> (the app page /t/<route>): the two panels are one app,
 * and a project route named like one of the admin's own pages (`/invoices`,
 * `/clients`…) would otherwise open that page instead of its table.
 */
export const pagePath = (route = ''): string => {
	const r = String(route).replace(/^\/+/, '');
	return IS_TENANT_PANEL ? projectHref(`/t/${r}`) : `/${r}`;
};

/** A model's "add a record" page (CreateRecordPage): /<route>/create, in a project /<project>/<route>/create. */
export const createPath = (route = ''): string => {
	const r = String(route).replace(/^\/+/, '');
	return IS_TENANT_PANEL ? projectHref(`/t/${r}/create`) : `/${r}/create`;
};

/**
 * Where a table's add button set to open a page goes. The route builder saves
 * `/<route>/create`, which is the built-in add page; any other address is
 * taken as it's written (inside the project, in the tenant panel).
 */
export const addButtonHref = (href: string, route = ''): string => {
	const r = String(route).replace(/^\/+/, '');
	if (!href || href.replace(/^\/+/, '') === `${r}/create`) return createPath(r);
	return projectHref(href);
};

/* ------------------------------------------------------------- guides */

/**
 * The user guides live on their own site (mint-docs, docs.mintapp.shop); the
 * app's old /user-docs addresses redirect there (next.config.mjs). /docs
 * belongs to the super-admin panel (its guides and the component library).
 * Screens shared by both panels link to a /docs guide — in the tenant panel
 * `docsPath` turns that into the user guide covering the same thing, keeping
 * the section anchor (the user guides use the same ids). In the super-admin
 * panel it changes nothing.
 */
export const DOCS_URL = (process.env.NEXT_PUBLIC_DOCS_URL || 'https://docs.mintapp.shop').replace(/\/+$/, '');

const userDocsFor = (guide: string, anchor: string): [string, string] => {
	switch (guide) {
		case '':
			return ['', ''];
		case 'builder':
			if (/^mcp/.test(anchor)) return ['connect-ai', anchor];
			if (/^features/.test(anchor)) return ['models', 'features'];
			if (/^(models|notifications)/.test(anchor)) return ['models', anchor];
			return ['pages', anchor];
		case 'sidebar-builder':
			return ['sidebar', anchor];
		case 'dashboard-builder':
			return ['dashboard', anchor];
		case 'media':
			return ['media', anchor];
		case 'two-factor':
			return ['account', anchor];
		case 'themes':
			return ['account', 'appearance'];
		default:
			return ['', ''];
	}
};

/** A guide link for this panel: `/docs/<guide>#<section>`, or its user guide in the tenant panel. */
export const docsPath = (href: string): string => {
	if (!IS_TENANT_PANEL) return href;
	const [path, anchor = ''] = href.split('#');
	const match = path.match(/^\/docs(?:\/([^/?]+))?/);
	if (!match) return href;
	const [page, section] = userDocsFor(match[1] || '', anchor);
	return `${DOCS_URL}${page ? `/${page}` : ''}${section ? `#${section}` : ''}`;
};
