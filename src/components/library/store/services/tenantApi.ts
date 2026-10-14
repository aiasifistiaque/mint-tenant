import mainApi, { routeTags } from './mainApi';
import { BACKEND } from '../../config/lib/constants/panel';

/**
 * The tenant panel's own calls (backend routes-tenant; docs:
 * backend/docs/multi-tenancy): organizations, members, roles, invitations
 * and projects. Everything else the tenant panel does goes through the same
 * hooks as the admin panel — `auth/self`, tables, the builder — at the tenant
 * API (config/lib/constants/panel.ts picks the base per request).
 */

/** A project in another organization's list (WO-47): enough to show it and open it. */
export type ProjectRef = { _id: string; name: string; publicSlug: string; type: ProjectType; description?: string };

export type OrgRef = {
	_id: string;
	name: string;
	slug: string;
	logo?: string;
	role?: string;
	system?: SystemRole;
	/** Invited into its projects only (WO-47). */
	guest?: boolean;
	/** The projects this account opens there (auth/self, WO-47). */
	projects?: ProjectRef[];
};
export type SystemRole = 'owner' | 'admin' | 'member' | 'developer' | null;

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
	/** Its business details (backend docs/pdf-templates D14); `logo` is the organization's logo. */
	business?: BusinessDetails;
	counts?: { members: number; projects: number; websites: number };
	createdAt?: string;
};

/** Business details: what invoices print as {{business.*}} (docs/pdf-templates D14). */
export type BusinessDetails = { name: string; logo: string; address: string; phone: string; email: string; website: string; taxId: string };

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
	/** Comments on records and @mentions in them (WO-49): both on unless turned off. */
	collaboration?: { comments: boolean; mentions: boolean };
	isActive: boolean;
	models?: number;
	/** Its business details — only from GET /projects/:id and PUT (the organization's until it has its own). */
	business?: BusinessDetails;
	/** A template preview in the sandbox (docs/templates T-04). */
	preview?: { expiresAt: string; from: 'draft' | 'published' };
	/** A website template's starter code, filled for this project (docs/templates T-10). */
	starter?: { repoUrl: string; framework?: string; deployUrl?: string; env: { key: string; value: string }[] };
	/** What this account may do in it, when its role here isn't the organization one (auth/self, WO-47). */
	permissions?: string[];
	createdAt?: string;
	/* Only from GET /projects/:id (WO-48): */
	updatedAt?: string;
	/** How many people open it. */
	people?: number;
	createdBy?: { _id: string; name: string } | null;
	organizationName?: string;
	/** The template it was built from (docs/templates T-03). */
	fromTemplate?: { name: string; version?: number; appliedAt?: string };
};

/* Automations (backend docs/automations). */
export type AutomationEvent = 'create' | 'update' | 'delete';
export type AutomationCondition = { field: string; op: string; value?: any };
export type AutomationSet = { field: string; value?: any; from?: string; clear?: boolean };
export type AutomationAction =
	| { type: 'notify'; to: { people?: string[]; actor?: boolean }; title: string; message?: string }
	| { type: 'email'; to: { people?: string[]; actor?: boolean; fields?: string[]; emails?: string[] }; subject: string; body: string }
	| { type: 'webhook'; url: string }
	| { type: 'update'; target: string; set: AutomationSet[] }
	| { type: 'create'; route: string; set: AutomationSet[] };
export type Automation = {
	_id: string;
	name: string;
	description?: string;
	enabled: boolean;
	route: string;
	on: AutomationEvent[];
	changed: string[];
	when: AutomationCondition[];
	match: 'all' | 'any';
	actions: AutomationAction[];
	stats: { runs: number; failures: number; lastRunAt?: string; lastStatus?: string; lastError?: string };
	/** Signs its webhook calls — only from GET /:id and saves. */
	secret?: string;
	createdAt?: string;
	updatedAt?: string;
};
export type AutomationInput = Omit<Automation, '_id' | 'stats' | 'secret' | 'createdAt' | 'updatedAt'>;
export type AutomationStep = { type: string; ok: boolean; detail: string };
export type AutomationRun = {
	_id: string;
	automation: string | null;
	name: string;
	route: string;
	record: string | null;
	recordName: string;
	event: AutomationEvent;
	status: 'success' | 'failed' | 'skipped';
	steps: AutomationStep[];
	error: string;
	depth: number;
	actorName: string;
	createdAt: string;
};

/**
 * A comment on a record (WO-49). `mentions`: the people it @mentions, by the names they had then.
 * `parent`: the top-level comment it replies to (WO-53), null for a top-level one.
 */
export type RecordComment = {
	_id: string;
	route: string;
	record: string;
	author: { _id: string; name: string };
	body: string;
	mentions: { _id: string; name: string }[];
	parent?: string | null;
	createdAt: string;
	editedAt?: string | null;
};
export type MentionPerson = { _id: string; name: string; email: string };
/** Who can be @mentioned on a record: everyone on the page, the private record's people, or no one (Only me). */
export type Mentionable = { enabled: boolean; mode: 'everyone' | 'private' | 'none'; people: MentionPerson[]; blocked: MentionPerson[] };

export type Member = ProjectAccess & {
	_id: string;
	user: { _id: string; name: string; email: string; image?: string; twoFactorEnabled?: boolean };
	role: { _id: string; name: string; system: SystemRole };
	/** Invited into projects, not the organization (WO-47), and their role in each. */
	guest?: boolean;
	projectRoles?: { project: string; role: string }[];
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
	/** An invitation into one project (WO-47). */
	project?: { _id: string; name: string } | null;
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
	/** Into one project (WO-47), named in `projects`. */
	project?: boolean;
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
	/** Into one project (WO-47), named in `projects`. */
	project?: boolean;
	allProjects: boolean;
	projects: string[];
	expiresAt: string;
};

/** One invitation's own page (WO-50): what it offers, and whether it can still be answered. */
export type MyInvitationDetail = MyInvitation & {
	state: 'open' | 'accepted' | 'declined' | 'cancelled' | 'expired' | 'joined';
	roleDescription?: string;
	/** The project's address once it's theirs. */
	address?: string | null;
	createdAt?: string;
};

/** Someone who opens the current project (its People page, WO-47). */
export type ProjectPerson = {
	_id: string;
	user: { _id: string; name: string; email: string; image?: string };
	/** Their role here: the project's own, or their organization role. */
	role: { _id: string; name: string; system: SystemRole };
	organizationRole: { _id: string; name: string; system: SystemRole };
	/** 'organization': opens every project; 'project': this one was given to them. */
	access: 'organization' | 'project';
	guest: boolean;
	joinedAt: string;
};

/** The standard roles a project's invitation gives (WO-47, WO-50) — or a project role's id. */
export type ProjectInviteRole = 'full' | 'member' | 'developer' | (string & {});

/** A role offered in a project: a standard one, or the project's own with its per-model keys (WO-50). */
export type ProjectRoleOption = { _id: string; name: string; system: string | null; description?: string; custom?: boolean; permissions?: string[] };

/** What a project's own role can name (WO-50): each model, the media library, History. */
export type ProjectRoleTarget = { route: string; name: string; actions: ('view' | 'create' | 'edit' | 'delete')[] };

export type ProjectRoleInput = { name: string; description?: string; permissions: string[] };

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
		updateOrganization: builder.mutation<Organization, { name?: string; logo?: string; country?: string; onboarding?: Onboarding; business?: Partial<BusinessDetails> }>({
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
		/** `project`: a project's invitation (WO-47) — its address, to open next. */
		acceptTenantInvitation: builder.mutation<{ token: string; message: string; project?: string | null }, { token: string; name?: string; phone?: string; password?: string }>({
			query: ({ token, ...body }) => ({ url: `invitations/${token}/accept`, method: 'POST', body }),
		}),

		/* ------------------------------------ invitations for me (WO-24) */
		getMyInvitations: builder.query<{ verified: boolean; email: string; doc: MyInvitation[] }, void>({
			query: () => 'invitations/for-me',
			providesTags: ['tenant-invitations', 'self'],
		}),
		acceptMyInvitation: builder.mutation<{ token: string; message: string; project?: string | null }, string>({
			query: id => ({ url: `invitations/for-me/${id}/accept`, method: 'POST' }),
		}),
		getMyInvitation: builder.query<{ verified: boolean; email: string; invitation: MyInvitationDetail | null }, string>({
			query: id => `invitations/for-me/${id}`,
			providesTags: ['tenant-invitations', 'self'],
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
		/** One project, with its business details. */
		getTenantProject: builder.query<TenantProject, string>({
			query: id => ({ url: `projects/${id}` }),
			providesTags: ['tenant-projects'],
		}),
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

		/* --------------------------------- automations (docs/automations) */
		getAutomations: builder.query<{ doc: Automation[]; total: number }, void>({
			query: () => 'automations',
			providesTags: ['automations'],
		}),
		getAutomation: builder.query<Automation, string>({
			query: id => `automations/${id}`,
			providesTags: ['automations'],
		}),
		getAutomationRuns: builder.query<{ doc: AutomationRun[] }, { automation?: string; status?: string; limit?: number } | void>({
			query: arg => {
				const q = new URLSearchParams();
				if (arg?.automation) q.set('automation', arg.automation);
				if (arg?.status) q.set('status', arg.status);
				q.set('limit', String(arg?.limit || 100));
				return `automations/runs?${q}`;
			},
			providesTags: ['automations'],
		}),
		createAutomation: builder.mutation<Automation, AutomationInput>({
			query: body => ({ url: 'automations', method: 'POST', body }),
			invalidatesTags: ['automations'],
		}),
		updateAutomation: builder.mutation<Automation, { id: string } & AutomationInput>({
			query: ({ id, ...body }) => ({ url: `automations/${id}`, method: 'PUT', body }),
			invalidatesTags: ['automations'],
		}),
		toggleAutomation: builder.mutation<Automation, { id: string; enabled: boolean }>({
			query: ({ id, enabled }) => ({ url: `automations/${id}`, method: 'PATCH', body: { enabled } }),
			invalidatesTags: ['automations'],
		}),
		testAutomation: builder.mutation<
			{ record: { _id: string; name: string }; event: AutomationEvent; conditions: boolean; status: string; steps: AutomationStep[]; error?: string },
			{ id: string; record: string; event?: AutomationEvent }
		>({
			query: ({ id, ...body }) => ({ url: `automations/${id}/test`, method: 'POST', body }),
		}),
		deleteAutomation: builder.mutation<{ message: string }, string>({
			query: id => ({ url: `automations/${id}`, method: 'DELETE' }),
			invalidatesTags: ['automations'],
		}),

		/* --------------------------------- comments on a record (WO-49) */
		getRecordComments: builder.query<
			{ doc: RecordComment[]; total: number; settings: { comments: boolean; mentions: boolean }; canModerate: boolean },
			{ route: string; record: string }
		>({
			query: ({ route, record }) => `comments?route=${encodeURIComponent(route)}&record=${record}`,
			providesTags: ['record-comments'],
		}),
		getMentionable: builder.query<Mentionable, { route: string; record: string }>({
			query: ({ route, record }) => `comments/mentionable?route=${encodeURIComponent(route)}&record=${record}`,
			providesTags: ['record-comments'],
		}),
		addRecordComment: builder.mutation<RecordComment, { route: string; record: string; body: string; mentions: string[]; parent?: string }>({
			query: body => ({ url: 'comments', method: 'POST', body }),
			invalidatesTags: ['record-comments'],
		}),
		updateRecordComment: builder.mutation<RecordComment, { id: string; body: string; mentions: string[] }>({
			query: ({ id, ...body }) => ({ url: `comments/${id}`, method: 'PUT', body }),
			invalidatesTags: ['record-comments'],
		}),
		deleteRecordComment: builder.mutation<{ message: string }, string>({
			query: id => ({ url: `comments/${id}`, method: 'DELETE' }),
			invalidatesTags: ['record-comments'],
		}),

		/* ------------------------------------- inside the open project */
		/** Who opens the project (everyone in it, WO-48); for those who manage it, its pending invitations and the roles it invites with (WO-47). */
		getProjectPeople: builder.query<
			{ doc: ProjectPerson[]; invitations: Invitation[]; roles: ProjectRoleOption[]; models?: ProjectRoleTarget[]; canManage?: boolean },
			void
		>({
			query: () => 'people',
			providesTags: ['tenant-people'],
		}),
		inviteToProject: builder.mutation<Invitation & { added?: boolean; message?: string }, { email: string; name?: string; role: ProjectInviteRole }>({
			query: body => ({ url: 'people/invitations', method: 'POST', body }),
			// tenant-projects: Settings counts the project's members (WO-48).
			invalidatesTags: ['tenant-people', 'tenant-invitations', 'tenant-members', 'tenant-projects'],
		}),
		resendProjectInvitation: builder.mutation<{ message: string }, string>({
			query: id => ({ url: `people/invitations/${id}/resend`, method: 'POST' }),
			invalidatesTags: ['tenant-people'],
		}),
		cancelProjectInvitation: builder.mutation<{ message: string }, string>({
			query: id => ({ url: `people/invitations/${id}`, method: 'DELETE' }),
			invalidatesTags: ['tenant-people', 'tenant-invitations'],
		}),
		setProjectRole: builder.mutation<{ message: string }, { id: string; role: ProjectInviteRole }>({
			query: ({ id, ...body }) => ({ url: `people/${id}`, method: 'PUT', body }),
			invalidatesTags: ['tenant-people', 'tenant-members'],
		}),
		/* The project's own roles (WO-50). */
		createProjectRole: builder.mutation<ProjectRoleOption, ProjectRoleInput>({
			query: body => ({ url: 'people/roles', method: 'POST', body }),
			invalidatesTags: ['tenant-people'],
		}),
		updateProjectRole: builder.mutation<ProjectRoleOption, ProjectRoleInput & { id: string }>({
			query: ({ id, ...body }) => ({ url: `people/roles/${id}`, method: 'PUT', body }),
			invalidatesTags: ['tenant-people', 'self'],
		}),
		deleteProjectRole: builder.mutation<{ message: string }, string>({
			query: id => ({ url: `people/roles/${id}`, method: 'DELETE' }),
			invalidatesTags: ['tenant-people'],
		}),
		removeFromProject: builder.mutation<{ message: string }, string>({
			query: id => ({ url: `people/${id}`, method: 'DELETE' }),
			invalidatesTags: ['tenant-people', 'tenant-members', 'tenant-projects'],
		}),
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
	useGetMyInvitationQuery,
	useGetProjectPeopleQuery,
	useGetRecordCommentsQuery,
	useGetAutomationsQuery,
	useGetAutomationQuery,
	useGetAutomationRunsQuery,
	useCreateAutomationMutation,
	useUpdateAutomationMutation,
	useToggleAutomationMutation,
	useTestAutomationMutation,
	useDeleteAutomationMutation,
	useGetMentionableQuery,
	useAddRecordCommentMutation,
	useUpdateRecordCommentMutation,
	useDeleteRecordCommentMutation,
	useInviteToProjectMutation,
	useResendProjectInvitationMutation,
	useCancelProjectInvitationMutation,
	useSetProjectRoleMutation,
	useCreateProjectRoleMutation,
	useUpdateProjectRoleMutation,
	useDeleteProjectRoleMutation,
	useRemoveFromProjectMutation,
	useSendEmailCodeMutation,
	useVerifyEmailMutation,
	useGetProjectsQuery,
	useGetTenantProjectQuery,
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
