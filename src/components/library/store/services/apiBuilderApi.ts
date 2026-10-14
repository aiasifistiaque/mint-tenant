import mainApi from './mainApi';

/**
 * The API builder (backend docs/api-builder): the project's public API as
 * endpoints — the overview, endpoints (made, generated, changed), server keys.
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
} = apiBuilderApi;
