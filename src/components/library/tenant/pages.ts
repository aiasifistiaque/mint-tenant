/**
 * Which of the app's pages the tenant panel shows (docs: backend/docs/multi-tenancy).
 *
 * The two panels are one Next app, so every page under src/app exists in both.
 * These first path segments are the super-admin panel's own pages; the tenant
 * panel sends them home (PanelGuard). Tenant projects' tables live under
 * /t/<route> (pagePath), so a project route may share one of these names.
 * Add a new admin-only page folder here.
 */
export const ADMIN_ONLY_PAGES = new Set([
	'adminroles', 'admins', 'authors', 'bills', 'blogs', 'brands', 'categories', 'clickevents', 'clients',
	'collections', 'components', 'contents', 'customer-ledger', 'customers', 'damages', 'deliveries', 'doc',
	'documents', 'emails', 'employees', 'expenses', 'features', 'fgroups', 'groups', 'heroku-doc', 'herokus',
	'invoices-old', 'invoices', 'issues', 'jobapplications', 'jobposts', 'leads', 'leaves', 'maintenances',
	'meetings', 'modelattributes', 'npmlibraries', 'offers', 'orders', 'packages', 'payments',
	'permissions', 'plannedfeatures', 'plannedmodels', 'plannedpages', 'plannedprojects', 'portfolios', 'print',
	'products', 'props', 'purchased-themes', 'qr', 'report-issue', 'repos', 'resources', 'roles', 'sellers',
	'servicecat', 'services', 'sessions', 'shops', 'solutions', 'subscriptions', 'suppliers', 'support-tickets',
	'support', 'system-status', 'tcclients', 'teams', 'techstacks', 'templates', 'test', 'themes', 'user-feedback-success',
	'user-feedback', 'users', 'vercel-doc', 'vercels', 'views',
]);

/** The tenant panel's own pages; the super-admin panel sends them home. */
export const TENANT_ONLY_PAGES = new Set(['org', 't', 'analytics', 'public-api', 'preview', 'webhooks', 'widgets']);
