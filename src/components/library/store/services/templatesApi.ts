import mainApi from './mainApi';

/**
 * Template Studio (backend docs/templates, /admin/api/templates): project
 * templates the super admin makes — blueprints for app, API and website
 * projects. Saving builds nothing; a preview builds into a throwaway sandbox.
 *
 * Every write answers with the whole template as the editor shows it (draft,
 * what's inside, validation), so the editor's query is updated from the
 * answer rather than refetched.
 */

export type TemplateType = 'app' | 'api' | 'website';
export type TemplatePart =
	| 'overview'
	| 'questions'
	| 'models'
	| 'sidebar'
	| 'dashboard'
	| 'roles'
	| 'endpoints'
	| 'webhooks'
	| 'website'
	| 'sampleData'
	| 'guide';
export type TemplateStatRow = { key: string; name: string; type: string; status: string; version: number; applied: number; previews: number; errors: number; updatedAt: string };
export type TemplateStats = { published: number; drafts: number; archived: number; withProblems: number; mostUsed: TemplateStatRow[]; recent: TemplateStatRow[] };
export type TemplateIssue = { severity: 'error' | 'explain' | 'warning'; part: TemplatePart; path: string; message: string; fix: string };
export type TemplateValidation = {
	ok: boolean;
	canPublish: boolean;
	errors: TemplateIssue[];
	explain: TemplateIssue[];
	warnings: TemplateIssue[];
	models: { name: string; route: string; title: string; kit?: boolean }[];
};

const one = (id: string) => [{ type: 'template' as const, id }, 'templates' as const];

const setDoc = (dispatch: any, id: string, doc: any) =>
	dispatch(templatesApi.util.updateQueryData('getTemplate', id, () => ({ doc })));

/** A write that answers { doc }: the editor's copy is replaced, lists refetch. */
const updatesDoc = {
	async onQueryStarted({ id }: { id: string }, { dispatch, queryFulfilled }: any) {
		try {
			const { data } = await queryFulfilled;
			if (data?.doc) setDoc(dispatch, id, data.doc);
		} catch {
			/* the caller shows the error */
		}
	},
};

// Endpoint names are global across every injected service: `importTemplate` is
// bulkApi's (the bulk-upload sheet), so the file import here is importTemplateFile.
export const templatesApi = mainApi.injectEndpoints({
	overrideExisting: false,
	endpoints: builder => ({
		getTemplateMeta: builder.query<any, void>({
			query: () => 'templates/meta',
		}),
		getTemplates: builder.query<{ doc: any[] }, { type?: string; status?: string; category?: string; search?: string } | void>({
			query: params => ({ url: 'templates', params: params || {} }),
			providesTags: ['templates'],
		}),
		getTemplate: builder.query<{ doc: any }, string>({
			query: id => `templates/${id}`,
			providesTags: (_r, _e, id) => [{ type: 'template', id }],
		}),
		createTemplate: builder.mutation<{ doc: any }, { type: TemplateType; name: string; summary?: string; category?: string }>({
			query: body => ({ url: 'templates', method: 'POST', body }),
			invalidatesTags: ['templates'],
		}),
		saveTemplatePart: builder.mutation<{ doc: any }, { id: string; part: TemplatePart; value: any }>({
			query: ({ id, part, value }) => ({ url: `templates/${id}/draft`, method: 'PUT', body: { part, value } }),
			invalidatesTags: ['templates'],
			...updatesDoc,
		}),
		validateTemplate: builder.mutation<{ validation: TemplateValidation }, { id: string }>({
			query: ({ id }) => ({ url: `templates/${id}/validate`, method: 'POST' }),
			invalidatesTags: ['templates'],
		}),
		saveTemplateSettings: builder.mutation<{ doc: any }, { id: string; key?: string; visibility?: string; organizations?: string[]; archived?: boolean }>({
			query: ({ id, ...body }) => ({ url: `templates/${id}/settings`, method: 'PUT', body }),
			invalidatesTags: ['templates'],
			...updatesDoc,
		}),
		publishTemplate: builder.mutation<{ doc: any }, { id: string; notes: string }>({
			query: ({ id, notes }) => ({ url: `templates/${id}/publish`, method: 'POST', body: { notes } }),
			invalidatesTags: ['templates'],
			...updatesDoc,
		}),
		getTemplateVersion: builder.query<{ doc: any }, { id: string; version: number }>({
			query: ({ id, version }) => `templates/${id}/versions/${version}`,
		}),
		restoreTemplateVersion: builder.mutation<{ doc: any }, { id: string; version: number }>({
			query: ({ id, version }) => ({ url: `templates/${id}/versions/${version}/restore`, method: 'POST' }),
			invalidatesTags: ['templates'],
			...updatesDoc,
		}),
		duplicateTemplate: builder.mutation<{ doc: any }, { id: string; name?: string }>({
			query: ({ id, name }) => ({ url: `templates/${id}/duplicate`, method: 'POST', body: { name } }),
			invalidatesTags: ['templates'],
		}),
		exportTemplate: builder.mutation<any, { id: string }>({
			query: ({ id }) => ({ url: `templates/${id}/export` }),
		}),
		importTemplateFile: builder.mutation<{ doc: any }, any>({
			query: body => ({ url: 'templates/import', method: 'POST', body }),
			invalidatesTags: ['templates'],
		}),
		captureTemplate: builder.mutation<{ doc: any }, { project: string; name?: string; sampleData?: boolean }>({
			query: body => ({ url: 'templates/capture', method: 'POST', body }),
			invalidatesTags: ['templates'],
		}),
		deleteTemplate: builder.mutation<{ archived: boolean }, { id: string }>({
			query: ({ id }) => ({ url: `templates/${id}`, method: 'DELETE' }),
			invalidatesTags: (_r, _e, { id }) => one(id),
		}),
		previewTemplate: builder.mutation<any, { id: string; from?: 'draft' | 'published'; answers?: Record<string, any>; sampleData?: boolean }>({
			query: ({ id, ...body }) => ({ url: `templates/${id}/preview`, method: 'POST', body }),
			invalidatesTags: ['template-previews', 'templates'],
		}),
		getTemplatePreviews: builder.query<{ doc: any[] }, string>({
			query: id => `templates/${id}/previews`,
			providesTags: ['template-previews'],
		}),
		openTemplatePreview: builder.mutation<any, { projectId: string }>({
			query: ({ projectId }) => ({ url: `templates/previews/${projectId}/open`, method: 'POST' }),
		}),
		deleteTemplatePreview: builder.mutation<any, { projectId: string }>({
			query: ({ projectId }) => ({ url: `templates/previews/${projectId}`, method: 'DELETE' }),
			invalidatesTags: ['template-previews'],
		}),
		generateTemplateSampleData: builder.mutation<{ records: any[]; model: string }, { id: string; model: string; count?: number; note?: string }>({
			query: ({ id, ...body }) => ({ url: `templates/${id}/ai/sample-data`, method: 'POST', body }),
		}),
		getTemplateKeys: builder.query<{ doc: any[] }, void>({
			query: () => 'templates/keys',
			providesTags: ['template-keys'],
		}),
		createTemplateKey: builder.mutation<{ doc: any; secret: string }, { name: string; scopes: string[]; expiresInDays?: number }>({
			query: body => ({ url: 'templates/keys', method: 'POST', body }),
			invalidatesTags: ['template-keys'],
		}),
		revokeTemplateKey: builder.mutation<any, { id: string }>({
			query: ({ id }) => ({ url: `templates/keys/${id}`, method: 'DELETE' }),
			invalidatesTags: ['template-keys'],
		}),
		/** The Templates dashboard widget (T-11). */
		getTemplateStats: builder.query<TemplateStats, void>({
			query: () => 'templates/stats',
			providesTags: ['templates'],
		}),
	}),
});

export const {
	useGetTemplateMetaQuery,
	useGetTemplatesQuery,
	useGetTemplateQuery,
	useCreateTemplateMutation,
	useSaveTemplatePartMutation,
	useValidateTemplateMutation,
	useSaveTemplateSettingsMutation,
	usePublishTemplateMutation,
	useLazyGetTemplateVersionQuery,
	useRestoreTemplateVersionMutation,
	useDuplicateTemplateMutation,
	useExportTemplateMutation,
	useImportTemplateFileMutation,
	useCaptureTemplateMutation,
	useDeleteTemplateMutation,
	usePreviewTemplateMutation,
	useGetTemplatePreviewsQuery,
	useOpenTemplatePreviewMutation,
	useDeleteTemplatePreviewMutation,
	useGenerateTemplateSampleDataMutation,
	useGetTemplateKeysQuery,
	useCreateTemplateKeyMutation,
	useRevokeTemplateKeyMutation,
	useGetTemplateStatsQuery,
} = templatesApi;
