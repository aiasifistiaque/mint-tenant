import mainApi, { routeTags } from './mainApi';
import { BACKEND } from '../../config/lib/constants/panel';

/**
 * The tenant panel's own calls (backend routes-tenant; docs:
 * backend/docs/multi-tenancy): organizations, members, roles, invitations
 * and projects. Everything else the tenant panel does goes through the same
 * hooks as the admin panel — `auth/self`, tables, the builder — at the tenant
 * API (config/lib/constants/panel.ts picks the base per request).
 */

export type OrgRef = { _id: string; name: string; slug: string; logo?: string; role?: string; system?: SystemRole };
export type SystemRole = 'owner' | 'admin' | 'member' | null;

export type Onboarding = {
	businessName?: string;
	industry?: string;
	teamSize?: string;
	role?: string;
	website?: string;
	country?: string;
	heardFrom?: string;
	heardFromOther?: string;
	goals?: string[];
};

export type Organization = {
	_id: string;
	name: string;
	slug: string;
	logo?: string;
	plan?: string;
	/** Its country's code (docs/widgets W-02) — decides `paymentProviders`. */
	country?: string;
	paymentProviders?: string[];
	owner: string;
	onboarding?: Onboarding;
	counts?: { members: number; projects: number; websites: number };
	createdAt?: string;
};

export type ProjectType = 'app' | 'website' | 'api';
/** Whose media library a project uses (WO-23). */
export type MediaScope = 'project' | 'organization';

/** Which projects a member (or invitation) opens (WO-22): every one, or these ids. */
export type ProjectAccess = { allProjects: boolean; projects: string[] };

export type TenantProject = {
	_id: string;
	name: string;
	slug: string;
	publicSlug: string;
	type: ProjectType;
	description?: string;
	icon?: string;
	color?: string;
	domains?: string[];
	mediaScope?: MediaScope;
	isActive: boolean;
	models?: number;
	/** A template preview in the sandbox (docs/templates T-04). */
	preview?: { expiresAt: string; from: 'draft' | 'published' };
	/** A website template's starter code, filled for this project (docs/templates T-10). */
	starter?: { repoUrl: string; framework?: string; deployUrl?: string; env: { key: string; value: string }[] };
	createdAt?: string;
};

export type Member = ProjectAccess & {
	_id: string;
	user: { _id: string; name: string; email: string; image?: string; twoFactorEnabled?: boolean };
	role: { _id: string; name: string; system: SystemRole };
	status: 'active' | 'removed';
	joinedAt: string;
};

export type OrgRole = {
	_id: string;
	name: string;
	description?: string;
	permissions: string[];
	system: SystemRole;
	members: number;
};

export type Invitation = ProjectAccess & {
	_id: string;
	email: string;
	name?: string;
	role?: { _id: string; name: string };
	invitedBy?: { _id: string; name: string } | null;
	expiresAt: string;
	expired: boolean;
	lastSentAt?: string;
	createdAt: string;
};

/** The standard permissions (WO-21), in their groups: Records, Projects, Organization. */
export type PermissionCatalog = {
	organization: { key: string; group: string; label: string; description: string }[];
};

export type InvitationInfo = {
	email: string;
	name?: string;
	organization: { name: string; logo?: string };
	role?: string;
	allProjects: boolean;
	projects: string[];
	existingAccount: boolean;
	/** The reader is signed in to the invited account: joining takes one click. */
	signedInAsInvitee?: boolean;
	expiresAt: string;
};

/** An invitation to the signed-in account's (verified) email, shown in the app (WO-24). */
export type MyInvitation = {
	_id: string;
	organization: { _id: string; name: string; logo?: string };
	role?: string;
	invitedBy?: string;
	allProjects: boolean;
	projects: string[];
	expiresAt: string;
};

export type RegisterBody = {
	name: string;
	email: string;
	password: string;
	organization: string;
	/** The organization's country code, e.g. BD (left out only when the server has no countries list). */
	country?: string;
	onboarding?: Onboarding;
};

export type AnalyticsTotals = { pageviews: number; visitors: number; sessions: number; pagesPerSession: number; bounceRate: number };
export type AnalyticsDim = 'paths' | 'referrers' | 'devices' | 'browsers' | 'os' | 'countries' | 'clicks' | 'events';
export type AnalyticsRange = { from?: string; to?: string };
/** An outgoing webhook (backend routes-tenant/webhooks.router.ts, docs/templates T-09). Its secret is never read back. */
export type WebhookEvent = 'create' | 'update' | 'delete';
/* Site widgets (backend functions/widgets.function.ts, docs/widgets W-03/W-04). */
export type WidgetOption = {
	key: string;
	label: string;
	kind: 'select' | 'boolean' | 'text' | 'number';
	options?: { value: string; label: string }[];
	default: any;
	help: string;
	min?: number;
	max?: number;
};
export type WidgetType = {
	name: string;
	title: string;
	summary: string;
	description: string;
	guide: string;
	options: WidgetOption[];
	texts: { key: string; label: string; default: string }[];
	snippet: string;
};
export type WidgetSettings = { enabled: boolean; options: Record<string, any>; texts: Record<string, string> };
export type WidgetTheme = { primaryColor: string; fontFamily: string; radius: number; colorMode: 'auto' | 'light' | 'dark' };
export type WidgetsView = {
	catalog: WidgetType[];
	widgets: Record<string, WidgetSettings>;
	theme: WidgetTheme;
	/** The tag a site adds once per page. */
	script: string;
	updatedAt: string | null;
};
export type WidgetsPatch = { widgets?: Record<string, Partial<WidgetSettings>>; theme?: Partial<WidgetTheme> };
/** The shop behind the cart (backend functions/shop.function.ts, docs/widgets W-05): which model is the catalogue and what its fields mean. */
export type ShopMapping = {
	product: {
		model: string;
		fields: { name: string; price: string; compareAtPrice?: string; image?: string; stock?: string; status?: string; variants?: string; sku?: string };
		activeValues?: (string | boolean)[];
		variant?: { name: string; price?: string; priceChange?: string; stock?: string };
	};
	cart: { model: string; fields: { product: string; quantity: string; variant?: string; label?: string } } | null;
	/** Where checkout writes orders (W-06). */
	order?: ShopOrderMapping | null;
	currency: string;
};
export type ShopOrderMapping = {
	model: string;
	fields: { items: string; status: string; email?: string; name?: string; phone?: string; address?: string; note?: string; shippingCost?: string; total?: string; paymentReference?: string };
	item: { name: string; quantity: string; unitPrice: string; variant?: string; sku?: string; product?: string };
	statuses: { pending: string; paid: string; cancelled?: string };
};
export type ShopModelField = { key: string; label: string; kind: string; ref?: string; options?: { value: string; label: string }[]; fields?: { key: string; label: string; kind: string }[] };
export type ShopModel = { name: string; title: string; route: string; publicApi: { enabled: boolean; ownerOnly: boolean; auth: string }; fields: ShopModelField[] };
export type ShopView = {
	shop: ShopMapping | null;
	/** What's saved, when it no longer fits the models (`problem` says why). */
	saved: ShopMapping | null;
	problem: string | null;
	/** A suggestion from the models' names and fields. */
	guess: ShopMapping | null;
	models: ShopModel[];
};

/* The organization's own email server (backend routes-tenant/org/mail.router.ts, docs/messaging M-02). */
export type MailSettings = {
	host: string;
	port: number;
	secure: boolean;
	username: string;
	/** The password is never sent back — only whether one is stored. */
	passwordSet: boolean;
	fromName: string;
	fromAddress: string;
	replyTo: string;
	customerWelcome: boolean;
	verifiedAt: string | null;
	lastError: string;
	lastErrorAt: string | null;
	updatedAt?: string;
};
export type MailSettingsInput = Omit<MailSettings, 'passwordSet' | 'verifiedAt' | 'lastError' | 'lastErrorAt' | 'updatedAt'> & { password: string };
export type MailLogEntry = { _id: string; kind: string; to: string; subject: string; status: 'sent' | 'failed'; error: string; project: string | null; createdAt: string };
export type MailView = { settings: MailSettings | null; messages: MailLogEntry[]; ports: number[] };

/* A project's payments (backend routes-tenant/payments.router.ts, docs/widgets W-06/W-07). Keys are never sent back. */
export type SitePaymentSettings = {
	stripe: { enabled: boolean; mode: 'test' | 'live'; publishableKey: string; secretKeySet: boolean; webhookSecretSet: boolean; webhookUrl: string };
	successUrl: string;
	cancelUrl: string;
	/** The providers the organization's country offers. */
	offered: string[];
	providers: Record<string, { name: string; ready: boolean }>;
	siteOrigin: string;
};
export type SitePaymentSettingsInput = {
	stripe?: { enabled: boolean; mode: 'test' | 'live'; publishableKey: string; secretKey?: string; webhookSecret?: string };
	successUrl?: string;
	cancelUrl?: string;
};
export type SitePayment = {
	_id: string;
	ref: string;
	order: string;
	orderModel: string;
	orderCode: string;
	provider: string;
	mode: 'test' | 'live';
	amount: number;
	currency: string;
	status: 'created' | 'pending' | 'paid' | 'failed' | 'cancelled' | 'expired' | 'refunded';
	email: string;
	error: string;
	paidAt: string | null;
	createdAt: string;
	events: { type: string; at: string; note?: string }[];
};

/** A published template a new project can start from (backend routes-tenant/templates.router.ts). */
export type TemplateQuestion = {
	key: string;
	label: string;
	help: string;
	kind: 'text' | 'textarea' | 'select' | 'currency' | 'locale' | 'color' | 'image' | 'email' | 'url';
	options?: { value: string; label: string }[];
	default: string;
	required: boolean;
};
export type ProjectTemplateCard = {
	key: string;
	name: string;
	summary: string;
	icon: string;
	version: number;
	inside: { models: string[]; pages: string[]; sidebar?: string[]; widgets?: number; roles?: string[]; sampleRecords: number };
	questions: TemplateQuestion[];
};
export type TemplateApplying = {
	status: 'building' | 'ready' | 'failed' | null;
	key?: string;
	name?: string;
	error?: string;
	problems?: string[];
	result?: {
		models: { name: string; title: string; route: string }[];
		pages: string[];
		categories?: string[];
		widgets?: number;
		roles?: { created: string[]; skipped: string[] };
		endpoints?: string[];
		records: Record<string, number>;
		warnings: string[];
	};
};

export type Webhook = {
	_id: string;
	route: string;
	events: WebhookEvent[];
	url: string;
	note: string;
	active: boolean;
	lastDelivery: { at: string; event: string; ok: boolean; status?: number; error?: string; test?: boolean } | null;
	createdAt: string;
	updatedAt: string;
};
export type WebhookDelivery = {
	_id: string;
	delivery: string;
	event: string;
	route: string;
	record: string | null;
	source: 'panel' | 'api' | 'test';
	url: string;
	body: string;
	ok: boolean;
	pending: boolean;
	status: number | null;
	response: string;
	error: string;
	attempts: number;
	durationMs: number | null;
	createdAt: string;
	finishedAt: string | null;
};
export type WebhookInput = { route?: string; events?: WebhookEvent[]; url?: string; note?: string; active?: boolean };
/** What an API project's dashboard shows (GET /api-overview). */
export type ApiOverview = {
	endpoints: { route: string; title: string; actions: string[]; auth: 'none' | 'customer'; ownerOnly: boolean }[];
	calls: { method: string; path: string; route: string; status: number; ms: number; customer: boolean; at: string }[];
	day: { calls: number; failed: number };
	webhooks: { total: number; active: number };
	deliveries: WebhookDelivery[];
};

export type PublicApi = {
	enabled: boolean;
	actions: ('list' | 'get' | 'create' | 'update' | 'delete')[];
	auth: 'none' | 'customer';
	ownerOnly: boolean;
	/** Fields the public API never writes (an order's status) — creates get the default, updates ignore them. */
	readOnlyFields?: string[];
};

/** A website project's settings (WO-34, WO-38; backend siteConfig.function.ts → WebsiteSettings). */
export type SiteTracking = {
	mintAnalytics: boolean;
	ga4: string;
	gtm: string;
	googleAds: string;
	metaPixel: string;
	tiktokPixel: string;
	linkedinPartner: string;
	pinterestTag: string;
	xPixel: string;
	snapPixel: string;
	clarity: string;
	hotjar: string;
};
export type SiteTag = { _id?: string; name: string; location: 'head' | 'bodyStart' | 'bodyEnd'; content: string; enabled: boolean };
export type SiteCheck = {
	checkedAt: string;
	origin: string;
	reachable: boolean;
	status?: number;
	url?: string;
	message: string;
	script?: { found: boolean; tags: boolean };
	items: { key: string; label: string; configured: string; inHtml: string[]; status: 'ok' | 'warning' | 'missing' | 'idle'; message: string }[];
	extra: { key: string; label: string; ids: string[] }[];
	serverSide: { meta?: { ok: boolean | null; note: string }; ga4?: { ok: boolean | null; note: string } };
};
export type SiteConfig = {
	_id: string;
	identity: { siteName: string; tagline: string; logo: string; favicon: string; footerText: string; primaryColor: string; secondaryColor: string; fontFamily: string };
	contact: { email: string; phone: string; whatsapp: string; address: string; mapEmbedUrl: string; hours: string };
	social: { facebook: string; instagram: string; x: string; linkedin: string; youtube: string; tiktok: string; pinterest: string };
	seo: {
		metaTitle: string;
		titleTemplate: string;
		metaDescription: string;
		ogImage: string;
		keywords: string[];
		indexing: boolean;
		sitemap: boolean;
		robots: string;
		canonicalDomain: string;
		googleVerification: string;
		bingVerification: string;
	};
	tracking: SiteTracking;
	/** Whether each key is set — the keys themselves never leave the server. */
	serverSide: { meta: { enabled: boolean; testEventCode: string; tokenSet: boolean }; ga4: { enabled: boolean; secretSet: boolean } };
	headTags: SiteTag[];
	redirects: { from: string; to: string; permanent: boolean }[];
	headers: { source: string; name: string; value: string }[];
	check: SiteCheck | null;
	domains: string[];
	origin: string;
	updatedAt: string;
	/** The old Site settings table (before WO-38), while the project still has it — its record was copied here. */
	legacy: { _id: string; title: string } | null;
};
/** A change to the settings: any sections, each with only the keys that change. */
export type SiteConfigPatch = {
	[K in 'identity' | 'contact' | 'social' | 'seo' | 'tracking']?: Partial<SiteConfig[K]>;
} & {
	serverSide?: { meta?: { enabled?: boolean; testEventCode?: string }; ga4?: { enabled?: boolean } };
	secrets?: { metaAccessToken?: string; ga4ApiSecret?: string };
	headTags?: SiteTag[];
	redirects?: SiteConfig['redirects'];
	headers?: SiteConfig['headers'];
	domains?: string[];
};
export type SiteOverview = {
	settings: { _id: string; siteName: string; logo: string; favicon: string; metaTitle: string; metaDescription: string } | null;
	pages: { _id: string; name: string; path: string; status: string; seo: boolean; contents: number; updatedAt: string }[];
	counts: { total: number; published: number; withSeo: number };
	checklist: { key: string; label: string; done: boolean }[];
	domains: string[];
	origin: string;
	kit: { settings: boolean; pages: boolean; seo: boolean; contents: boolean };
};

/** One entry of a project's History (WO-36, backend routes-tenant/history.router.ts). */
export type HistoryEntry = {
	_id: string;
	action: 'create' | 'update' | 'delete';
	model: string;
	modelPath: string;
	document: string | null;
	documentName: string;
	documentCode: string;
	text: string;
	changes: { field: string; label: string; from: string; to: string }[];
	user: { _id: string; name: string } | null;
	userName: string;
	createdAt: string;
};
export type HistoryQuery = { model?: string; action?: string; user?: string; from?: string; to?: string; search?: string; limit?: number };

const rangeQuery = (r: AnalyticsRange = {}) => new URLSearchParams(Object.entries(r).filter(([, v]) => v) as [string, string][]).toString();

const ORG = ['tenant-org', 'self'];

export const tenantApi = mainApi.injectEndpoints({
	endpoints: builder => ({
		/* ---------------------------------------------------------- sign-up */
		tenantRegister: builder.mutation<{ token: string }, RegisterBody>({
			query: body => ({ url: 'auth/register', method: 'POST', body }),
		}),

		/* ---------------------------------------------------- organizations */
		getOrganization: builder.query<Organization, void>({
			query: () => 'org',
			providesTags: ['tenant-org'],
		}),
		updateOrganization: builder.mutation<Organization, { name?: string; logo?: string; country?: string; onboarding?: Onboarding }>({
			query: body => ({ url: 'org', method: 'PUT', body }),
			invalidatesTags: ORG,
		}),
		getMyOrganizations: builder.query<{ doc: OrgRef[] }, void>({
			query: () => 'org/list',
			providesTags: ['tenant-org'],
		}),
		createOrganization: builder.mutation<{ token: string; organization: Organization }, { name: string; country?: string; onboarding?: Onboarding }>({
			query: body => ({ url: 'org', method: 'POST', body }),
		}),
		switchOrganization: builder.mutation<{ token: string }, string>({
			query: id => ({ url: `org/switch/${id}`, method: 'POST' }),
		}),
		transferOwnership: builder.mutation<{ message: string }, { member: string }>({
			query: body => ({ url: 'org/transfer-ownership', method: 'POST', body }),
			invalidatesTags: [...ORG, 'tenant-members', 'tenant-roles'],
		}),

		/* ---------------------------------------------------------- members */
		getMembers: builder.query<{ doc: Member[]; total: number }, void>({
			query: () => 'org/members',
			providesTags: ['tenant-members'],
		}),
		updateMember: builder.mutation<Member, { id: string; role?: string } & Partial<ProjectAccess>>({
			query: ({ id, ...body }) => ({ url: `org/members/${id}`, method: 'PUT', body }),
			invalidatesTags: ['tenant-members', 'tenant-roles'],
		}),
		removeMember: builder.mutation<{ message: string }, string>({
			query: id => ({ url: `org/members/${id}`, method: 'DELETE' }),
			invalidatesTags: ['tenant-members', 'tenant-roles', 'tenant-org'],
		}),

		/* ------------------------------------------------------------ roles */
		getOrgRoles: builder.query<{ doc: OrgRole[] }, void>({
			query: () => 'org/roles',
			providesTags: ['tenant-roles'],
		}),
		getOrgPermissions: builder.query<PermissionCatalog, void>({
			query: () => 'org/permissions',
			providesTags: ['tenant-roles', 'tenant-projects'],
		}),
		createOrgRole: builder.mutation<OrgRole, { name: string; description?: string; permissions: string[] }>({
			query: body => ({ url: 'org/roles', method: 'POST', body }),
			invalidatesTags: ['tenant-roles'],
		}),
		updateOrgRole: builder.mutation<OrgRole, { id: string; name: string; description?: string; permissions: string[] }>({
			query: ({ id, ...body }) => ({ url: `org/roles/${id}`, method: 'PUT', body }),
			invalidatesTags: ['tenant-roles', 'self'],
		}),
		deleteOrgRole: builder.mutation<{ message: string }, string>({
			query: id => ({ url: `org/roles/${id}`, method: 'DELETE' }),
			invalidatesTags: ['tenant-roles'],
		}),

		/* ------------------------------------------------------ invitations */
		getInvitations: builder.query<{ doc: Invitation[] }, void>({
			query: () => 'org/invitations',
			providesTags: ['tenant-invitations'],
		}),
		inviteMember: builder.mutation<Invitation, { email: string; name?: string; role: string } & Partial<ProjectAccess>>({
			query: body => ({ url: 'org/invitations', method: 'POST', body }),
			invalidatesTags: ['tenant-invitations'],
		}),
		resendInvitation: builder.mutation<{ message: string }, string>({
			query: id => ({ url: `org/invitations/${id}/resend`, method: 'POST' }),
			invalidatesTags: ['tenant-invitations'],
		}),
		cancelInvitation: builder.mutation<{ message: string }, string>({
			query: id => ({ url: `org/invitations/${id}`, method: 'DELETE' }),
			invalidatesTags: ['tenant-invitations'],
		}),
		getTenantInvitation: builder.query<InvitationInfo, string>({
			query: token => `invitations/${token}`,
		}),
		acceptTenantInvitation: builder.mutation<{ token: string; message: string }, { token: string; name?: string; phone?: string; password?: string }>({
			query: ({ token, ...body }) => ({ url: `invitations/${token}/accept`, method: 'POST', body }),
		}),

		/* ------------------------------------ invitations for me (WO-24) */
		getMyInvitations: builder.query<{ verified: boolean; email: string; doc: MyInvitation[] }, void>({
			query: () => 'invitations/for-me',
			providesTags: ['tenant-invitations', 'self'],
		}),
		acceptMyInvitation: builder.mutation<{ token: string; message: string }, string>({
			query: id => ({ url: `invitations/for-me/${id}/accept`, method: 'POST' }),
		}),
		declineMyInvitation: builder.mutation<{ message: string }, string>({
			query: id => ({ url: `invitations/for-me/${id}`, method: 'DELETE' }),
			invalidatesTags: ['tenant-invitations'],
		}),
		sendEmailCode: builder.mutation<{ message: string; verified?: boolean }, void>({
			query: () => ({ url: 'auth/verify-email/send', method: 'POST' }),
		}),
		verifyEmail: builder.mutation<{ message: string; verified: boolean }, { code: string }>({
			query: body => ({ url: 'auth/verify-email', method: 'POST', body }),
			invalidatesTags: ['self', 'tenant-invitations'],
		}),

		/* --------------------------------------------------------- projects */
		getProjects: builder.query<{ doc: TenantProject[] }, { archived?: boolean } | void>({
			query: arg => `projects${arg && arg.archived ? '?archived=1' : ''}`,
			providesTags: ['tenant-projects'],
		}),
		createProject: builder.mutation<
			TenantProject,
			{ name: string; type: ProjectType; description?: string; domains?: string[]; color?: string; icon?: string; mediaScope?: MediaScope }
		>({
			query: body => ({ url: 'projects', method: 'POST', body }),
			invalidatesTags: ['tenant-projects', 'self', 'tenant-org'],
		}),
		updateProject: builder.mutation<TenantProject, { id: string } & Partial<Omit<TenantProject, '_id'>>>({
			query: ({ id, ...body }) => ({ url: `projects/${id}`, method: 'PUT', body }),
			invalidatesTags: ['tenant-projects', 'self', 'tenant-org'],
		}),
		deleteProject: builder.mutation<{ message: string }, { id: string; force?: boolean }>({
			query: ({ id, force }) => ({ url: `projects/${id}${force ? '?force=1' : ''}`, method: 'DELETE' }),
			invalidatesTags: ['tenant-projects', 'self', 'tenant-org'],
		}),

		/* ------------------------------------- inside the open project */
		getAnalyticsSummary: builder.query<{ current: AnalyticsTotals; previous: AnalyticsTotals; from: string; to: string }, AnalyticsRange>({
			query: r => `analytics/summary?${rangeQuery(r)}`,
			providesTags: ['tenant-analytics'],
		}),
		getAnalyticsSeries: builder.query<{ days: { date: string; pageviews: number; visitors: number }[] }, AnalyticsRange>({
			query: r => `analytics/timeseries?${rangeQuery(r)}`,
			providesTags: ['tenant-analytics'],
		}),
		getAnalyticsTop: builder.query<{ rows: { value: string; count: number; visitors: number }[] }, AnalyticsRange & { dim: AnalyticsDim; limit?: number }>({
			query: ({ dim, limit, ...r }) => `analytics/top?dim=${dim}&limit=${limit || 8}&${rangeQuery(r)}`,
			providesTags: ['tenant-analytics'],
		}),
		getSiteConfig: builder.query<SiteConfig, void>({
			query: () => 'site-config',
			providesTags: ['tenant-site'],
		}),
		updateSiteConfig: builder.mutation<SiteConfig, SiteConfigPatch>({
			query: body => ({ url: 'site-config', method: 'PUT', body }),
			invalidatesTags: ['tenant-site'],
		}),
		checkSite: builder.mutation<SiteCheck, void>({
			query: () => ({ url: 'site-config/check', method: 'POST' }),
			invalidatesTags: ['tenant-site'],
		}),
		getSiteOverview: builder.query<SiteOverview, void>({
			query: () => 'site-overview',
			// The kit's own tables too, so editing a page or its SEO refreshes it (routeTags registers them).
			providesTags: () => routeTags('tenant-site', 'pages', 'seo', 'web-contents'),
		}),
		getProjectHistory: builder.query<{ doc: HistoryEntry[]; totalDocs: number; totalPages: number }, HistoryQuery>({
			query: q => `history?${new URLSearchParams(Object.entries(q).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)])).toString()}`,
			providesTags: ['history'],
		}),
		getHistoryFacets: builder.query<{ models: string[]; people: { _id: string; name: string }[] }, void>({
			query: () => 'history/facets',
			providesTags: ['history'],
		}),
		updatePublicApi: builder.mutation<{ publicApi: PublicApi }, { id: string } & PublicApi>({
			query: ({ id, ...body }) => ({ url: `builder/models/${id}/public-api`, method: 'PUT', body }),
			invalidatesTags: ['builder', 'tenant-webhooks'],
		}),

		/* ---------------------------------------- site widgets (docs/widgets) */
		getWidgets: builder.query<WidgetsView, void>({
			query: () => 'widgets',
			providesTags: ['tenant-widgets'],
		}),
		saveWidgets: builder.mutation<WidgetsView, WidgetsPatch>({
			query: body => ({ url: 'widgets', method: 'PUT', body }),
			invalidatesTags: ['tenant-widgets'],
		}),
		getWidgetsShop: builder.query<ShopView, void>({
			query: () => 'widgets/shop',
			providesTags: ['tenant-widgets'],
		}),
		saveWidgetsShop: builder.mutation<ShopView, { shop: ShopMapping | null }>({
			query: body => ({ url: 'widgets/shop', method: 'PUT', body }),
			invalidatesTags: ['tenant-widgets'],
		}),

		/* ------------------------------------- site payments (docs/widgets W-06) */
		getSitePaymentSettings: builder.query<SitePaymentSettings, void>({
			query: () => 'payments/settings',
			providesTags: ['tenant-payments'],
		}),
		saveSitePaymentSettings: builder.mutation<SitePaymentSettings, SitePaymentSettingsInput>({
			query: body => ({ url: 'payments/settings', method: 'PUT', body }),
			invalidatesTags: ['tenant-payments'],
		}),
		checkSitePaymentKeys: builder.mutation<{ ok: boolean; mode: string }, void>({
			query: () => ({ url: 'payments/settings/check', method: 'POST' }),
		}),
		getSitePayments: builder.query<{ doc: SitePayment[] }, void>({
			query: () => 'payments',
			providesTags: ['tenant-payments'],
		}),

		/* ------------------------ the organization's email (docs/messaging M-02) */
		getOrgMail: builder.query<MailView, void>({
			query: () => 'org/mail',
			providesTags: ['tenant-mail'],
		}),
		saveOrgMail: builder.mutation<{ settings: MailSettings }, MailSettingsInput>({
			query: body => ({ url: 'org/mail', method: 'PUT', body }),
			invalidatesTags: ['tenant-mail'],
		}),
		testOrgMail: builder.mutation<{ message: string; settings: MailSettings }, { to?: string }>({
			query: body => ({ url: 'org/mail/test', method: 'POST', body }),
			invalidatesTags: ['tenant-mail'],
		}),
		removeOrgMail: builder.mutation<{ message: string }, void>({
			query: () => ({ url: 'org/mail', method: 'DELETE' }),
			invalidatesTags: ['tenant-mail'],
		}),

		/* ------------------------- start from a template (docs/templates T-14) */
		getProjectTemplates: builder.query<{ doc: ProjectTemplateCard[] }, void>({
			query: () => 'templates',
		}),
		applyProjectTemplate: builder.mutation<{ status: 'building'; key: string; name: string }, { key: string; answers: Record<string, string>; sampleData: boolean }>({
			query: ({ key, ...body }) => ({ url: `templates/${key}/apply`, method: 'POST', body }),
		}),
		getTemplateApplying: builder.query<TemplateApplying, void>({
			query: () => 'templates/applying',
		}),
		/** New project's gallery, before there's a project: the organization-level route, so the full address (a bare path would go to the current project). */
		getNewProjectTemplates: builder.query<{ doc: ProjectTemplateCard[] }, ProjectType>({
			query: type => `${BACKEND}/templates?type=${type}`,
		}),

		/* ---------------------------- webhooks and the API overview (T-09) */
		getWebhooks: builder.query<{ doc: Webhook[]; models: { route: string; title: string }[]; events: WebhookEvent[] }, void>({
			query: () => 'webhooks',
			providesTags: ['tenant-webhooks'],
		}),
		createWebhook: builder.mutation<{ doc: Webhook; secret: string }, WebhookInput>({
			query: body => ({ url: 'webhooks', method: 'POST', body }),
			invalidatesTags: ['tenant-webhooks', 'history'],
		}),
		updateWebhook: builder.mutation<Webhook, { id: string } & WebhookInput>({
			query: ({ id, ...body }) => ({ url: `webhooks/${id}`, method: 'PUT', body }),
			invalidatesTags: ['tenant-webhooks', 'history'],
		}),
		deleteWebhook: builder.mutation<{ message: string }, string>({
			query: id => ({ url: `webhooks/${id}`, method: 'DELETE' }),
			invalidatesTags: ['tenant-webhooks', 'history'],
		}),
		replaceWebhookSecret: builder.mutation<{ secret: string }, string>({
			query: id => ({ url: `webhooks/${id}/secret`, method: 'POST' }),
			invalidatesTags: ['history'],
		}),
		testWebhook: builder.mutation<WebhookDelivery, string>({
			query: id => ({ url: `webhooks/${id}/test`, method: 'POST' }),
			invalidatesTags: ['tenant-webhooks'],
		}),
		getWebhookDeliveries: builder.query<{ doc: WebhookDelivery[] }, string>({
			query: id => `webhooks/${id}/deliveries`,
			providesTags: ['tenant-webhooks'],
		}),
		getApiOverview: builder.query<ApiOverview, void>({
			query: () => 'api-overview',
			providesTags: ['tenant-webhooks', 'builder'],
		}),
	}),
});

export const {
	useTenantRegisterMutation,
	useGetOrganizationQuery,
	useUpdateOrganizationMutation,
	useGetMyOrganizationsQuery,
	useCreateOrganizationMutation,
	useGetWidgetsQuery,
	useSaveWidgetsMutation,
	useGetWidgetsShopQuery,
	useGetOrgMailQuery,
	useGetSitePaymentSettingsQuery,
	useSaveSitePaymentSettingsMutation,
	useCheckSitePaymentKeysMutation,
	useGetSitePaymentsQuery,
	useSaveOrgMailMutation,
	useTestOrgMailMutation,
	useRemoveOrgMailMutation,
	useSaveWidgetsShopMutation,
	useGetProjectTemplatesQuery,
	useGetNewProjectTemplatesQuery,
	useApplyProjectTemplateMutation,
	useGetTemplateApplyingQuery,
	useSwitchOrganizationMutation,
	useTransferOwnershipMutation,
	useGetMembersQuery,
	useUpdateMemberMutation,
	useRemoveMemberMutation,
	useGetOrgRolesQuery,
	useGetOrgPermissionsQuery,
	useCreateOrgRoleMutation,
	useUpdateOrgRoleMutation,
	useDeleteOrgRoleMutation,
	useGetInvitationsQuery,
	useInviteMemberMutation,
	useResendInvitationMutation,
	useCancelInvitationMutation,
	useGetTenantInvitationQuery,
	useAcceptTenantInvitationMutation,
	useGetMyInvitationsQuery,
	useAcceptMyInvitationMutation,
	useDeclineMyInvitationMutation,
	useSendEmailCodeMutation,
	useVerifyEmailMutation,
	useGetProjectsQuery,
	useCreateProjectMutation,
	useUpdateProjectMutation,
	useDeleteProjectMutation,
	useGetAnalyticsSummaryQuery,
	useGetAnalyticsSeriesQuery,
	useGetAnalyticsTopQuery,
	useUpdatePublicApiMutation,
	useGetSiteConfigQuery,
	useUpdateSiteConfigMutation,
	useCheckSiteMutation,
	useGetSiteOverviewQuery,
	useGetProjectHistoryQuery,
	useGetHistoryFacetsQuery,
	useGetWebhooksQuery,
	useCreateWebhookMutation,
	useUpdateWebhookMutation,
	useDeleteWebhookMutation,
	useReplaceWebhookSecretMutation,
	useTestWebhookMutation,
	useGetWebhookDeliveriesQuery,
	useGetApiOverviewQuery,
} = tenantApi;
