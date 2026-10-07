/**
 * The project's public API as the backend describes it (GET /public/api/<project>/,
 * backend routes-public/public.router.ts), and what the reference and the
 * tester build from it: endpoints, example bodies, example responses.
 */

export type ApiField = {
	key: string;
	label: string;
	kind: string;
	required: boolean;
	options?: string[];
	/** Never written by the API — a formula, or a field the builder made read-only (an order's status). Sent, it's ignored. */
	readOnly?: boolean;
};
/** A field a list can be filtered by, and its operators (`eq` is `key=value`, the rest `key_<op>=value`). */
export type ApiFilter = { key: string; kind: string; ops: string[] };
export type ApiModel = {
	route: string;
	title: string;
	actions: string[];
	auth: 'none' | 'customer';
	ownerOnly: boolean;
	/** What the site or app uses it for (a template's endpoint note). */
	note?: string;
	fields: ApiField[];
	/** What its list takes — sent by the backend when List is on (routes-public listCapabilities). */
	filters?: ApiFilter[];
	search?: string[];
	sort?: string[];
};
export type ApiInfo = { name: string; type: 'app' | 'website' | 'api'; slug: string; models: ApiModel[] };

export type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

export type Endpoint = {
	method: Method;
	/** Relative to the API's base: `/products`, `/products/:id`, `/auth/login`. */
	path: string;
	summary: string;
	/** Needs `Authorization: Bearer <customer token>`. */
	customer?: boolean;
	/** An example JSON body (POST, PUT). */
	body?: Record<string, any>;
};

/* ------------------------------------------------ lists: filters & paging */

/**
 * The list parameters every model's list takes — the admin lists' syntax
 * (backend routes-public/public.router.ts, "lists: filters, search, sort").
 * Shown on the reference and in user-docs/public-api#filters; keep the three
 * in step.
 */
export const LIST_PARAMS: [string, string, string][] = [
	['page', 'number', 'Which page, from 1 (default 1). Past the last page you get an empty doc and the same total.'],
	['limit', 'number', 'Records per page, 1–100 (default 20). Above 100 counts as 100.'],
	['sort', 'fields', 'Up to three fields, comma-separated, - for descending: sort=-price,name. Default -createdAt (newest first).'],
	['search', 'text', 'Records whose text fields contain these words, any case: search=trail shoe.'],
	['fields', 'fields', 'Only these fields in each record (plus _id): fields=name,price. Smaller, faster answers.'],
	['<field>', 'value', 'Equals: status=live. Repeat it for any of several: status=live&status=sold.'],
	['<field>_<op>', 'value', 'An operator — see the table below: price_gte=10, status_in=live,sold, createdAt_btwn=2026-10-01_2026-10-31.'],
];

/** Every operator, what it does, and which kinds of field take it. */
export const FILTER_OPS: { op: string; does: string; on: string; example: string }[] = [
	{ op: '(none)', does: 'Equals. On a list field (tags, multi-select, links): has it. On a date: that whole day.', on: 'every filterable field', example: 'status=live' },
	{ op: '_ne', does: 'Not equal (a list field: doesn’t have it)', on: 'every filterable field', example: 'status_ne=draft' },
	{ op: '_in', does: 'Any of these, comma-separated', on: 'text, options, number, link, list fields', example: 'status_in=live,sold' },
	{ op: '_nin', does: 'None of these', on: 'text, options, number, link, list fields', example: 'tags_nin=archived' },
	{ op: '_gt · _gte', does: 'Greater than · or equal. On a date: after the day · from the day', on: 'number, date', example: 'price_gte=10' },
	{ op: '_lt · _lte', does: 'Less than · or equal. On a date: before the day · up to the end of the day', on: 'number, date', example: 'createdAt_lte=2026-10-31' },
	{ op: '_btwn', does: 'Between, both ends included: from_to. Leave an end out for open-ended (100_)', on: 'number, date', example: 'price_btwn=10_50' },
	{ op: '_contains', does: 'Contains this text, any case', on: 'text, email, link, long text', example: 'name_contains=shoe' },
	{ op: '_all', does: 'Has all of these', on: 'tags, multi-select, several links', example: 'tags_all=run,trail' },
];

/** Date values: a day, a moment, or the admin lists' shortcuts. */
export const DATE_VALUES =
	'2026-10-04 (that whole day, UTC) · 2026-10-04T09:30:00Z (that moment) · today · week (last 7 days) · month · year · days_30 · months_3';

/** Read filters for a model: what the API says, or (an older API) worked out from its fields. */
const FALLBACK_OPS: Record<string, string[]> = {
	text: ['eq', 'ne', 'in', 'nin', 'contains'],
	email: ['eq', 'ne', 'in', 'nin', 'contains'],
	url: ['eq', 'ne', 'in', 'nin', 'contains'],
	textarea: ['eq', 'ne', 'in', 'nin', 'contains'],
	select: ['eq', 'ne', 'in', 'nin'],
	number: ['eq', 'ne', 'in', 'nin', 'gt', 'gte', 'lt', 'lte', 'btwn'],
	formula: ['eq', 'ne', 'in', 'nin', 'gt', 'gte', 'lt', 'lte', 'btwn'],
	date: ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'btwn'],
	boolean: ['eq', 'ne'],
	reference: ['eq', 'ne', 'in', 'nin'],
	multiselect: ['eq', 'ne', 'in', 'nin', 'all'],
	tags: ['eq', 'ne', 'in', 'nin', 'all'],
	references: ['eq', 'ne', 'in', 'nin', 'all'],
};
export const filtersOf = (m: ApiModel): ApiFilter[] =>
	m.filters ||
	[...m.fields, { key: 'createdAt', kind: 'date' }, { key: 'updatedAt', kind: 'date' }]
		.filter(f => FALLBACK_OPS[f.kind])
		.map(f => ({ key: f.key, kind: f.kind, ops: FALLBACK_OPS[f.kind] }));

/** A value that reads well in an example query for a field. */
const queryValue = (f: ApiField | undefined, kind: string): string => {
	if (f?.options?.length) return f.options[0];
	return (
		{
			number: '10',
			formula: '10',
			boolean: 'true',
			date: '2026-10-01',
			reference: '<id>',
			references: '<id>',
			email: 'name@example.com',
		}[kind] ?? (kind === 'tags' || kind === 'multiselect' ? 'new' : 'shoe')
	);
};

/** A few list requests that use this model's own fields: filter, range, search, sort, page. */
export const listExamples = (m: ApiModel): { path: string; note: string }[] => {
	const base = `/${m.route}`;
	const filters = filtersOf(m).filter(f => !['createdAt', 'updatedAt'].includes(f.key));
	const field = (key: string) => m.fields.find(f => f.key === key);
	const out: { path: string; note: string }[] = [{ path: `${base}?page=2&limit=12&sort=-createdAt`, note: 'Page 2, 12 to a page, newest first' }];
	const choice = filters.find(f => ['select', 'boolean'].includes(f.kind));
	if (choice) out.push({ path: `${base}?${choice.key}=${queryValue(field(choice.key), choice.kind)}`, note: `Only where ${field(choice.key)?.label || choice.key} is that` });
	const select = filters.find(f => f.kind === 'select' && (field(f.key)?.options?.length || 0) > 1);
	if (select) out.push({ path: `${base}?${select.key}_in=${field(select.key)!.options!.slice(0, 2).join(',')}`, note: 'Any of several values' });
	const num = filters.find(f => f.kind === 'number' || f.kind === 'formula');
	if (num) out.push({ path: `${base}?${num.key}_btwn=10_50&sort=${num.key}`, note: `${field(num.key)?.label || num.key} from 10 to 50, lowest first` });
	const text = filters.find(f => f.ops.includes('contains'));
	if (text) out.push({ path: `${base}?${text.key}_contains=${queryValue(field(text.key), text.kind)}`, note: `${field(text.key)?.label || text.key} contains it, any case` });
	if (m.search?.length || text) out.push({ path: `${base}?search=${queryValue(undefined, 'text')}&limit=5`, note: 'Search the text fields' });
	out.push({ path: `${base}?createdAt=week`, note: 'Added in the last 7 days' });
	const date = filters.find(f => f.kind === 'date');
	if (date) out.push({ path: `${base}?${date.key}_btwn=2026-10-01_2026-10-31`, note: `${field(date.key)?.label || date.key} in October 2026` });
	const two = m.fields.slice(0, 2).map(f => f.key);
	if (two.length) out.push({ path: `${base}?fields=${two.join(',')}`, note: 'Only these fields, for a lighter list' });
	return out;
};

// Formula fields are worked out by the server and read-only ones are the business's: they come back but can't be sent.
export const sendable = (f: ApiField) => f.kind !== 'formula' && !f.readOnly;

/** A plausible value for a field, for example bodies and responses. */
export const exampleOf = (f: ApiField): any => {
	switch (f.kind) {
		case 'email':
			return 'name@example.com';
		case 'url':
			return 'https://example.com';
		case 'number':
		case 'formula':
			return 10;
		case 'boolean':
			return true;
		case 'date':
			return '2026-10-02';
		case 'color':
			return '#2563eb';
		case 'select':
			return f.options?.[0] ?? 'value';
		case 'multiselect':
		case 'tags':
			return f.options?.slice(0, 2) ?? ['one', 'two'];
		case 'reference':
			return '<id of the linked record>';
		case 'references':
			return ['<id>', '<id>'];
		case 'image':
		case 'file':
		case 'video':
			return 'https://…/file.jpg';
		case 'images':
		case 'files':
			return ['https://…/1.jpg'];
		case 'section':
			return {};
		case 'sectionlist':
			return [];
		default:
			return f.label || 'Text';
	}
};

/** What a create sends: every required field, then the rest, by example. */
export const exampleBody = (m: ApiModel, all = false): Record<string, any> =>
	Object.fromEntries(m.fields.filter(f => sendable(f) && (all || f.required)).map(f => [f.key, exampleOf(f)]));

/** A record as the API returns it. */
export const exampleRecord = (m: ApiModel) => ({
	_id: '66f0c1d2e3a4b5c6d7e8f901',
	...Object.fromEntries(m.fields.map(f => [f.key, exampleOf(f)])),
	createdAt: '2026-10-02T09:30:00.000Z',
	updatedAt: '2026-10-02T09:30:00.000Z',
});

const ACTION_ENDPOINT: Record<string, (m: ApiModel) => Endpoint> = {
	list: m => ({ method: 'GET', path: `/${m.route}`, summary: `List ${m.title} — filter, search, sort and page` }),
	get: m => ({ method: 'GET', path: `/${m.route}/:id`, summary: 'Read one' }),
	create: m => ({ method: 'POST', path: `/${m.route}`, summary: 'Create', body: exampleBody(m, true) }),
	update: m => ({ method: 'PUT', path: `/${m.route}/:id`, summary: 'Update (send only what changes)', body: exampleBody(m) }),
	delete: m => ({ method: 'DELETE', path: `/${m.route}/:id`, summary: 'Delete' }),
};
const ORDER = ['list', 'get', 'create', 'update', 'delete'];

/** A model's endpoints, in the usual order. */
export const endpointsOf = (m: ApiModel): Endpoint[] =>
	ORDER.filter(a => m.actions.includes(a)).map(a => ({ ...ACTION_ENDPOINT[a](m), customer: m.auth === 'customer' }));

/** The customer sign-in endpoints every project has. */
export const AUTH_ENDPOINTS: Endpoint[] = [
	{ method: 'POST', path: '/auth/register', summary: 'Sign a customer up → { token, customer }', body: { name: 'Ada Lovelace', email: 'ada@example.com', password: 'at-least-8-characters' } },
	{ method: 'POST', path: '/auth/login', summary: 'Sign in → { token, customer }', body: { email: 'ada@example.com', password: 'at-least-8-characters' } },
	{ method: 'GET', path: '/auth/me', summary: 'The signed-in customer', customer: true },
	{ method: 'PUT', path: '/auth/me', summary: 'Change their name or phone', customer: true, body: { name: 'Ada King', phone: '+44 20 0000 0000' } },
	{ method: 'POST', path: '/auth/logout-everywhere', summary: 'Sign them out on every device', customer: true },
];

/** A website project's content endpoints. */
export const SITE_ENDPOINTS: Endpoint[] = [
	{ method: 'GET', path: '/site', summary: 'Site settings and menu' },
	{ method: 'GET', path: '/pages/by-path?path=/about', summary: 'A published page with its SEO and contents' },
];

export const METHOD_TONE: Record<Method, string> = { GET: 'green', POST: 'blue', PUT: 'orange', DELETE: 'red' };

/* ------------------------------------------------ example requests (T-09) */

const quote = (s: string) => `'${s.replace(/'/g, `'\\''`)}'`;

/**
 * An endpoint as a request you can paste: curl for a terminal, fetch for a
 * site or app. `:id` becomes an example id; a customer endpoint carries the
 * Authorization header to fill in. Shown on each endpoint of the reference,
 * in the studio's Public API tab and in user-docs/public-api#examples.
 */
export const exampleRequests = (base: string, e: Endpoint): { curl: string; fetch: string } => {
	const url = `${base}${e.path.replace(':id', '66f0c1d2e3a4b5c6d7e8f901')}`;
	const headers: Record<string, string> = {
		...(e.body && { 'Content-Type': 'application/json' }),
		...(e.customer && { Authorization: 'Bearer <customer token>' }),
	};
	const curl = [
		`curl${e.method === 'GET' ? '' : ` -X ${e.method}`} ${quote(url)}`,
		...Object.entries(headers).map(([k, v]) => `  -H ${quote(`${k}: ${v}`)}`),
		...(e.body ? [`  -d ${quote(JSON.stringify(e.body))}`] : []),
	].join(' \\\n');
	const options = [
		...(e.method !== 'GET' ? [`  method: '${e.method}',`] : []),
		...(Object.keys(headers).length ? [`  headers: ${JSON.stringify(headers, null, 2).replace(/\n/g, '\n  ')},`] : []),
		...(e.body ? [`  body: JSON.stringify(${JSON.stringify(e.body, null, 2).replace(/\n/g, '\n  ')}),`] : []),
	];
	const fetchCode = [
		`const res = await fetch('${url}'${options.length ? `, {\n${options.join('\n')}\n}` : ''});`,
		'const data = await res.json();',
		"if (!res.ok) throw new Error(data.message); // 400, 401, 404, 429 — see the reference",
	].join('\n');
	return { curl, fetch: fetchCode };
};
