import mainApi from './mainApi';

type Kind = 'settings' | 'config';

// A publish or reset changes what the route's own pages read — its schema,
// config, header, filters and data — so those tags go stale along with the
// builder's.
const LIVE_TAGS = ['builder', 'schema', 'config', 'route', 'filters'];

/**
 * The route builder: a route's settings and config files as DB drafts, and
 * publishing them. See backend library/controllers/builder.
 */
export const builderApi = mainApi.injectEndpoints({
	overrideExisting: false,
	endpoints: builder => ({
		getBuilderRoutes: builder.query<any, void>({
			query: () => 'builder/routes',
			providesTags: ['builder'],
		}),
		getBuilderRoute: builder.query<any, string>({
			query: route => ({ url: 'builder/route', params: { route } }),
			providesTags: ['builder'],
		}),
		getBuilderVersions: builder.query<any, { route: string; kind: Kind }>({
			query: params => ({ url: 'builder/versions', params }),
			providesTags: ['builder'],
		}),
		getBuilderModelFields: builder.query<any, string>({
			query: name => `builder/model/${encodeURIComponent(name)}`,
		}),
		// Routes whose model has a field referencing model `name` — what a view
		// tab or related list on that model's detail page can list.
		getBuilderBacklinks: builder.query<{ doc: { route: string; model: string; fields: string[] }[] }, string>({
			query: name => `builder/backlinks/${encodeURIComponent(name)}`,
			providesTags: ['builder'],
		}),
		saveBuilderDraft: builder.mutation<any, { route: string; kind: Kind; draft: any }>({
			query: body => ({ url: 'builder/draft', method: 'PUT', body }),
			invalidatesTags: ['builder'],
		}),
		discardBuilderDraft: builder.mutation<any, { route: string; kind: Kind }>({
			query: params => ({ url: 'builder/draft', method: 'DELETE', params }),
			invalidatesTags: ['builder'],
		}),
		publishBuilderRoute: builder.mutation<any, { route: string; kinds?: Kind[]; note?: string }>({
			query: body => ({ url: 'builder/publish', method: 'POST', body }),
			invalidatesTags: LIVE_TAGS,
		}),
		resetBuilderRoute: builder.mutation<any, { route: string; kind: Kind }>({
			query: body => ({ url: 'builder/reset', method: 'POST', body }),
			invalidatesTags: LIVE_TAGS,
		}),
		// One record laid out by its route's published view config. Tagged
		// 'config' so a publish (which invalidates it) re-renders open pages.
		getViewDocument: builder.query<any, { path: string; id: string }>({
			query: ({ path, id }) => `${path}/get/view/${id}`,
			providesTags: ['config'],
		}),
		// One page of a view tab (records of another route that reference this one).
		getViewTab: builder.query<
			any,
			{ path: string; id: string; index: number; page?: number; limit?: number; search?: string }
		>({
			query: ({ path, id, index, page = 1, limit, search }) => ({
				url: `${path}/get/view/${id}/tab/${index}`,
				params: { page, ...(limit && { limit }), ...(search && { search }) },
			}),
			providesTags: ['config'],
		}),
		getBuilderState: builder.query<any, void>({
			query: () => 'builder/state',
			providesTags: ['builder'],
		}),
		compareBuilderRoute: builder.query<any, string>({
			query: route => ({ url: 'builder/compare', params: { route } }),
			providesTags: ['builder'],
		}),
		// Both switches are live immediately, so the route pages' tags go too.
		setBuilderState: builder.mutation<any, { settings?: 'db' | 'code'; config?: 'db' | 'code' }>({
			query: body => ({ url: 'builder/state', method: 'PUT', body }),
			invalidatesTags: LIVE_TAGS,
		}),
		setBuilderSource: builder.mutation<any, { route: string; kind: Kind; source: 'inherit' | 'db' | 'code' }>({
			query: body => ({ url: 'builder/source', method: 'PUT', body }),
			invalidatesTags: LIVE_TAGS,
		}),
		restoreBuilderVersion: builder.mutation<any, { route: string; kind: Kind; versionId: string }>({
			query: body => ({ url: 'builder/restore', method: 'POST', body }),
			invalidatesTags: ['builder'],
		}),

		// The model builder: Mongoose models defined here, each registered with
		// an admin route of its own. Saving one changes that route's schema,
		// config and data, so it invalidates what the route builder does.
		getBuiltModels: builder.query<any, void>({
			query: () => 'builder/models',
			providesTags: ['builder'],
		}),
		getBuiltModel: builder.query<any, string>({
			query: id => `builder/models/${id}`,
			providesTags: ['builder'],
		}),
		getModelBuilderOptions: builder.query<any, void>({
			query: () => 'builder/models/options',
			providesTags: ['builder'],
		}),
		checkModelName: builder.query<any, { name: string; route?: string; id?: string }>({
			query: params => ({ url: 'builder/models/check', params }),
		}),
		// What a definition would register as and generate; saves nothing. A
		// mutation, not a query: it's asked for on "Next", never cached.
		previewBuiltModel: builder.mutation<any, any>({
			query: body => ({ url: 'builder/models/preview', method: 'POST', body }),
		}),
		// A draft model, pages and filters from a description, by Claude. Saves nothing.
		buildModelWithAi: builder.mutation<any, { prompt: string; current?: any }>({
			query: body => ({ url: 'builder/models/ai', method: 'POST', body }),
		}),
		createBuiltModel: builder.mutation<any, any>({
			query: body => ({ url: 'builder/models', method: 'POST', body }),
			invalidatesTags: LIVE_TAGS,
		}),
		updateBuiltModel: builder.mutation<any, { id: string; body: any }>({
			query: ({ id, body }) => ({ url: `builder/models/${id}`, method: 'PUT', body }),
			invalidatesTags: LIVE_TAGS,
		}),
		deleteBuiltModel: builder.mutation<any, { id: string; dropData?: boolean }>({
			query: ({ id, dropData }) => ({ url: `builder/models/${id}`, method: 'DELETE', params: dropData ? { dropData: 'true' } : {} }),
			invalidatesTags: LIVE_TAGS,
		}),

		// Features: several models and their links at once (backend features.service.ts).
		getFeatureCatalog: builder.query<{ models: any[]; categories: { _id: string; name: string }[] }, void>({
			query: () => 'builder/features/catalog',
			providesTags: ['builder'],
		}),
		getBuiltFeatures: builder.query<{ doc: any[] }, void>({
			query: () => 'builder/features',
			providesTags: ['builder'],
		}),
		checkFeaturePlan: builder.mutation<{ plan: any }, { plan: any }>({
			query: body => ({ url: 'builder/features/plan', method: 'POST', body }),
		}),
		planFeatureWithAi: builder.mutation<{ plan: any; model: string }, { prompt: string; current?: any }>({
			query: body => ({ url: 'builder/features/ai', method: 'POST', body }),
		}),
		buildFeature: builder.mutation<any, { plan: any }>({
			query: body => ({ url: 'builder/features/build', method: 'POST', body }),
			invalidatesTags: [...LIVE_TAGS, '/sidebar/crm/page', '/sidebar/crm/server', '/sidebar/crm/generic', 'sidebaritems', 'sidebarcategories'],
		}),

		// A new project's starter templates (WO-35): listed, and built like a feature.
		getStarters: builder.query<{ doc: { key: string; title: string; description: string; icon: string; models: string[] }[] }, void>({
			query: () => 'builder/starters',
		}),
		buildStarter: builder.mutation<any, string>({
			query: key => ({ url: `builder/starters/${key}`, method: 'POST' }),
			invalidatesTags: [...LIVE_TAGS, '/sidebar/crm/page', '/sidebar/crm/server', '/sidebar/crm/generic', 'sidebaritems', 'sidebarcategories'],
		}),

		// Keys AI clients connect to /mcp with.
		getApiKeys: builder.query<{ doc: any[] }, void>({
			query: () => 'builder/api-keys',
			providesTags: ['apiKeys'],
		}),
		createApiKey: builder.mutation<{ doc: any; secret: string }, { name: string; scopes: string[]; expiresInDays?: number }>({
			query: body => ({ url: 'builder/api-keys', method: 'POST', body }),
			invalidatesTags: ['apiKeys'],
		}),
		revokeApiKey: builder.mutation<any, string>({
			query: id => ({ url: `builder/api-keys/${id}`, method: 'DELETE' }),
			invalidatesTags: ['apiKeys'],
		}),
	}),
});

export const {
	useGetBuilderRoutesQuery,
	useGetBuilderRouteQuery,
	useGetBuilderVersionsQuery,
	useGetBuilderModelFieldsQuery,
	useLazyGetBuilderModelFieldsQuery,
	useSaveBuilderDraftMutation,
	useDiscardBuilderDraftMutation,
	usePublishBuilderRouteMutation,
	useResetBuilderRouteMutation,
	useRestoreBuilderVersionMutation,
	useGetBuilderStateQuery,
	useGetViewDocumentQuery,
	useGetViewTabQuery,
	useGetBuilderBacklinksQuery,
	useCompareBuilderRouteQuery,
	useSetBuilderStateMutation,
	useSetBuilderSourceMutation,
	useGetBuiltModelsQuery,
	useGetBuiltModelQuery,
	useGetModelBuilderOptionsQuery,
	useCheckModelNameQuery,
	usePreviewBuiltModelMutation,
	useBuildModelWithAiMutation,
	useCreateBuiltModelMutation,
	useUpdateBuiltModelMutation,
	useDeleteBuiltModelMutation,
	useGetFeatureCatalogQuery,
	useGetBuiltFeaturesQuery,
	useCheckFeaturePlanMutation,
	usePlanFeatureWithAiMutation,
	useBuildFeatureMutation,
	useGetStartersQuery,
	useBuildStarterMutation,
	useGetApiKeysQuery,
	useCreateApiKeyMutation,
	useRevokeApiKeyMutation,
} = builderApi;
