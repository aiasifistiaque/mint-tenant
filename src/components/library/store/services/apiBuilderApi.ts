import mainApi from './mainApi';

/**
 * The API builder (backend docs/api-builder): the project's public API as
 * endpoints — the overview, endpoints (made, generated, changed), server keys,
 * and the request logs (AB-06; read-only, refetched rather than tagged).
 * Backend: routes-tenant/apiBuilder.router.ts at /p/:project/api-builder.
 * Saving an endpoint changes its model's `publicApi` summary too, so the
 * model lists (`builder`) refetch.
 */

const TAG = 'api-builder';

export type EndpointAction = 'list' | 'get' | 'create' | 'update' | 'delete';
export type EndpointWho = 'anyone' | 'customer' | 'key';
export type CustomerRef = { ref: 'customer' | 'customer.email' | 'customer.name' | 'customer.phone' };
export type EndpointCondition = { field: string; op: string; value?: any };

export type Endpoint = {
	_id: string;
	name: string;
	note: string;
	model: string;
	action: EndpointAction;
	method: 'GET' | 'POST' | 'PUT' | 'DELETE';
	path: string;
	standard: boolean;
	enabled: boolean;
	access: { who: EndpointWho; when: EndpointCondition[]; match: 'all' | 'any' };
	fields: { out: string[] | null; write: string[] | null; readOnly: string[] };
	list: { filters: EndpointCondition[]; callerFilters: boolean; sort: string; limit: number; maxLimit: number };
	stats: { calls: number; lastCalledAt: string | null };
	createdAt: string;
	updatedAt: string;
};

export type EndpointInput = Partial<Pick<Endpoint, 'name' | 'note' | 'model' | 'action' | 'path' | 'enabled'>> & {
	access?: Partial<Endpoint['access']>;
	fields?: Partial<Endpoint['fields']>;
	list?: Partial<Endpoint['list']>;
};

export type ApiModelField = { key: string; label: string; kind: string; required: boolean; ref?: string; options?: { value: string; label: string }[] };
export type ApiModel = {
	route: string;
	name: string;
	title: string;
	fields: ApiModelField[];
	/** What a rule can name: the filterable fields, the owner (`_customer`) and the id. */
	ruleFields: { key: string; label: string; kind: string }[];
	sort: string[];
};

export type ApiBuilderOverview = {
	endpoints: { total: number; on: number; custom: number };
	who: { anyone: number; customer: number; key: number };
	calls: number;
	keys: number;
	customers: number;
	models: { route: string; title: string; endpoints: number; on: number }[];
	recent: Endpoint[];
};

export type ServerKey = {
	_id: string;
	name: string;
	last4: string;
	createdAt: string;
	createdByName: string;
	lastUsedAt: string | null;
	revokedAt: string | null;
	/** Only in the answer that made it. */
	secret?: string;
};

/** One call to the API, as its request log keeps it (AB-06) — never bodies, tokens or addresses. */
export type ApiLog = {
	_id: string;
	at: string;
	method: string;
	path: string;
	/** Without the `?`; secret-looking values shown as •••. */
	query: string;
	status: number;
	ms: number | null;
	endpoint: { _id: string; name: string } | null;
	who: EndpointWho;
	customer: { _id: string; email: string } | null;
	key: { _id: string; name: string } | null;
	error: string;
	code: string;
	origin: string;
	client: string;
};

export type ApiLogPeriod = 1 | 24 | 168;
export type ApiLogFilters = {
	hours: ApiLogPeriod;
	/** ok, errors, 4xx, 5xx, or a status code. */
	status?: string;
	/** An endpoint's id, or "none": calls no endpoint answered. */
	endpoint?: string;
	method?: string;
	who?: string;
	q?: string;
};

export type ApiLogSummary = {
	hours: ApiLogPeriod;
	total: number;
	errors: number;
	avgMs: number | null;
	p95Ms: number | null;
	series: { at: string; ok: number; errors: number }[];
	topErrors: { status: number; code: string; error: string; endpoint: string; count: number; last: string }[];
	topEndpoints: { _id: string; name: string; calls: number; errors: number; avgMs: number }[];
};

const logQuery = (f: Partial<ApiLogFilters> & { limit?: number }) =>
	new URLSearchParams(Object.entries(f).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)])).toString();

export const apiBuilderApi = mainApi.enhanceEndpoints({ addTagTypes: [TAG] }).injectEndpoints({
	endpoints: builder => ({
		getApiBuilderOverview: builder.query<ApiBuilderOverview, void>({
			query: () => 'api-builder/overview',
			providesTags: [TAG],
		}),
		getApiEndpoints: builder.query<{ doc: Endpoint[]; total: number; models: ApiModel[] }, void>({
			query: () => 'api-builder/endpoints',
			providesTags: [TAG],
		}),
		getApiEndpoint: builder.query<Endpoint & { modelInfo: ApiModel | null }, string>({
			query: id => `api-builder/endpoints/${id}`,
			providesTags: [TAG],
		}),
		createApiEndpoint: builder.mutation<Endpoint, EndpointInput>({
			query: body => ({ url: 'api-builder/endpoints', method: 'POST', body }),
			invalidatesTags: [TAG, 'builder'],
		}),
		generateApiEndpoints: builder.mutation<
			{ made: Endpoint[]; turnedOn: Endpoint[]; skipped: string[] },
			{ model: string; actions: EndpointAction[]; who: EndpointWho }
		>({
			query: body => ({ url: 'api-builder/endpoints/generate', method: 'POST', body }),
			invalidatesTags: [TAG, 'builder'],
		}),
		updateApiEndpoint: builder.mutation<Endpoint, EndpointInput & { id: string }>({
			query: ({ id, ...body }) => ({ url: `api-builder/endpoints/${id}`, method: 'PUT', body }),
			invalidatesTags: [TAG, 'builder'],
		}),
		toggleApiEndpoint: builder.mutation<Endpoint, { id: string; enabled: boolean }>({
			query: ({ id, enabled }) => ({ url: `api-builder/endpoints/${id}`, method: 'PATCH', body: { enabled } }),
			invalidatesTags: [TAG, 'builder'],
		}),
		deleteApiEndpoint: builder.mutation<{ message: string }, string>({
			query: id => ({ url: `api-builder/endpoints/${id}`, method: 'DELETE' }),
			invalidatesTags: [TAG, 'builder'],
		}),
		getServerKeys: builder.query<{ doc: ServerKey[] }, void>({
			query: () => 'api-builder/keys',
			providesTags: [TAG],
		}),
		createServerKey: builder.mutation<ServerKey, { name: string }>({
			query: body => ({ url: 'api-builder/keys', method: 'POST', body }),
			invalidatesTags: [TAG],
		}),
		revokeServerKey: builder.mutation<{ message: string }, string>({
			query: id => ({ url: `api-builder/keys/${id}`, method: 'DELETE' }),
			invalidatesTags: [TAG],
		}),
		getApiRequestLogs: builder.query<{ doc: ApiLog[]; hasMore: boolean }, ApiLogFilters & { limit?: number }>({
			query: f => `api-builder/logs?${logQuery(f)}`,
			keepUnusedDataFor: 10,
		}),
		getApiRequestLogSummary: builder.query<ApiLogSummary, ApiLogFilters>({
			query: f => `api-builder/logs/summary?${logQuery(f)}`,
			keepUnusedDataFor: 10,
		}),
		getApiRequestLog: builder.query<ApiLog, string>({
			query: id => `api-builder/logs/${id}`,
		}),
	}),
});

export const {
	useGetApiBuilderOverviewQuery,
	useGetApiEndpointsQuery,
	useGetApiEndpointQuery,
	useCreateApiEndpointMutation,
	useGenerateApiEndpointsMutation,
	useUpdateApiEndpointMutation,
	useToggleApiEndpointMutation,
	useDeleteApiEndpointMutation,
	useGetServerKeysQuery,
	useCreateServerKeyMutation,
	useRevokeServerKeyMutation,
	useGetApiRequestLogsQuery,
	useGetApiRequestLogSummaryQuery,
	useGetApiRequestLogQuery,
} = apiBuilderApi;
