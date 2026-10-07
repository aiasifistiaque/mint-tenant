// import { URL } from '../..';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { defaultSerializeQueryArgs } from '@reduxjs/toolkit/query';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { IS_TENANT_PANEL, apiUrl, getProjectSlug } from '../../config/lib/constants/panel';


// Tag types for endpoints with fixed tags (providesTags: ['builder'] etc.).
// RTK Query logs "Tag type 'x' was used, but not specified in `tagTypes`!" for
// any tag not registered here. The generic endpoints in commonApi.ts build their
// tags from the caller's `path`/`invalidate` values — including routes created
// at runtime in the model builder — so those go through `routeTags()` below,
// which registers them on first use. Paths already listed here are harmless.
// Deliberately typed as string[] (not `as const`): the dynamic tag callbacks
// return plain strings, and a literal union would fail to type-check.
const tags: string[] = [
	'/categories/create',
	'/customers/sms',
	'/products',
	'/products/create',
	'/roles/create',
	// `/sidebar/crm/${NEXT_PUBLIC_SIDEBAR_TYPE}` — all three values the env var takes.
	'/sidebar/crm/page',
	'/sidebar/crm/server',
	'/sidebar/crm/generic',
	'adjustments/damages',
	'access-users',
	'adminroles',
	'admins',
	'auth',
	'authors',
	'bills',
	'billsubscriptions',
	'blogs',
	'brands',
	'categories',
	'clickevents',
	'clients',
	'collections',
	'components',
	'config',
	'content',
	'contents',
	'coupons',
	'customers',
	'customers/analytics/top-buying',
	'dashboard',
	'deliveries',
	'doc',
	'documents',
	'donations',
	'donors',
	'emails',
	'employees',
	'expense-categories',
	'expenses',
	'features',
	'feedbacks',
	'fgroups',
	'files',
	'files/get/distinct/folder',
	'filters',
	'folders',
	'media',
	'media-trash',
	'media-usage',
	'builder',
	'apiKeys',
	'tableconfigs',
	'formfields',
	'groups',
	'heroku-account',
	'heroku-activity',
	'heroku-apps',
	'heroku-billing',
	'heroku-config',
	'heroku-dynos',
	'heroku-releases',
	'heroku-resources',
	'heroku-usage',
	'herokus',
	'vercel-account',
	'vercel-activity',
	'vercel-deployments',
	'vercel-domains',
	'vercel-env',
	'vercel-project',
	'vercel-projects',
	'vercel-resources',
	'vercel-teams',
	'vercel-usage',
	'vercels',
	'history',
	'hongo',
	'images',
	'inventories',
	'inventories/transfer/product/bulk',
	'invoices',
	'issues',
	'jobapplications',
	'jobposts',
	'leads',
	'leaves',
	'ledgers',
	'maintenances',
	'meetings',
	'modelattributes',
	'newsletters',
	'npmlibraries',
	'offers',
	'orders',
	'packages',
	'packages/assign-package',
	'packages/renew',
	'payments',
	'permissionlist',
	'permissions',
	'plannedfeatures',
	'plannedmodels',
	'plannedpages',
	'plannedprojects',
	'portfolios',
	'product',
	'products',
	'products/top-selling',
	'projects',
	'props',
	'purchased-themes',
	'purchasedthemes',
	'purchasedthemes/make/default',
	'reported-issues',
	'support-tickets',
	'my-tickets',
	'ticket-thread',
	// The tenant panel (tenantApi.ts).
	'tenant-org',
	'tenant-members',
	'tenant-roles',
	'tenant-invitations',
	'tenant-projects',
	'tenant-analytics',
	'tenant-site',
	'tenant-webhooks',
	'tenant-widgets',
	'tenant-mail',
	'tenant-payments',
	// Template Studio (templatesApi.ts).
	'templates',
	'template',
	'template-previews',
	'template-keys',
	'repos',
	'resources',
	'restaurant',
	'returns',
	'roles',
	'route',
	'schema',
	'self',
	'sessions',
	'sellers',
	'servicecat',
	'servicecategories',
	'services',
	'settings',
	'shops',
	'sidebarcategories',
	'sidebaritems',
	'sms/check',
	'solutions',
	'subscriptions',
	'suppliers',
	'tcclients',
	'teams',
	'techstacks',
	'themes',
	'transfers',
	'upload',
	'uploads',
	'users',
	'views',
	'notifications',
];

const rawBaseQuery = fetchBaseQuery({
	baseUrl: '',
	prepareHeaders: (headers, { getState }) => {
		const token: string = (getState() as any).auth?.token;
		if (token) {
			headers.set('authorization', token);
		}
	},
});

/**
 * Every request's base is chosen per path (config/lib/constants/panel.ts): the
 * admin API for the super-admin panel; for the tenant panel the tenant API's
 * root (account, organization) or the current project's (everything else).
 */
const baseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = (args, api, extra) => {
	const url = typeof args === 'string' ? args : args.url;
	const full = apiUrl(url);
	return rawBaseQuery(typeof args === 'string' ? full : { ...args, url: full }, api, extra);
};

export const mainApi = createApi({
	reducerPath: 'mainApi',
	baseQuery,
	// In the tenant panel the same path answers differently per project (and
	// outside one): the tab's project is part of every cache key, so moving
	// between a project's pages and the organization's — a client-side
	// navigation, the cache kept — never shows one's data in the other.
	serializeQueryArgs: args =>
		IS_TENANT_PANEL ? `${getProjectSlug() || '-'}:${defaultSerializeQueryArgs(args)}` : defaultSerializeQueryArgs(args),
	tagTypes: tags,
	endpoints: builder => ({}),
});

const registered = new Set(tags);

/**
 * Tags derived from a route path (or other runtime value). Registers any tag
 * type not seen yet, since RTK only knows `tagTypes` up front and model-builder
 * routes (/surveyfigures, …) don't exist at build time. Drops empty values so a
 * missing `path`/`invalidate` never becomes a '' tag type.
 */
export const routeTags = (...values: (string | null | undefined)[]): string[] => {
	const list = values.filter((v): v is string => !!v);
	const fresh = list.filter(t => !registered.has(t));
	if (fresh.length) {
		fresh.forEach(t => registered.add(t));
		mainApi.enhanceEndpoints({ addTagTypes: fresh });
	}
	return list;
};

export default mainApi;
