import mainApi, { routeTags } from './mainApi';

/**
 * PDF templates (backend docs/pdf-templates): the templates of this panel /
 * project, the business details they read, the gallery, the field picker,
 * and files drawn by the server — previews come back as object URLs (a Blob
 * can't sit in the store), downloads go straight to the browser.
 */

const TAG = 'pdf-templates';

/** A PDF answer as an object URL for an iframe; an error answer as its JSON. */
const asObjectUrl = async (response: Response) => {
	if (!response.ok) return response.json().catch(() => ({ message: 'Could not make the PDF' }));
	return { url: URL.createObjectURL(await response.blob()) };
};

export const pdfTemplatesApi = mainApi.injectEndpoints({
	overrideExisting: false,
	endpoints: builder => ({
		getPdfTemplates: builder.query<{ templates: any[] }, { route?: string } | void>({
			query: arg => ({ url: 'pdf-templates', params: arg && arg.route ? { route: arg.route } : undefined }),
			providesTags: routeTags(TAG),
		}),
		getPdfTemplate: builder.query<any, string>({
			query: id => `pdf-templates/${id}`,
			providesTags: routeTags(TAG),
		}),
		createPdfTemplate: builder.mutation<any, any>({
			query: body => ({ url: 'pdf-templates', method: 'POST', body }),
			invalidatesTags: routeTags(TAG),
		}),
		updatePdfTemplate: builder.mutation<any, { id: string; body: any }>({
			query: ({ id, body }) => ({ url: `pdf-templates/${id}`, method: 'PUT', body }),
			invalidatesTags: routeTags(TAG),
		}),
		deletePdfTemplate: builder.mutation<any, string>({
			query: id => ({ url: `pdf-templates/${id}`, method: 'DELETE' }),
			invalidatesTags: routeTags(TAG),
		}),
		setDefaultPdfTemplate: builder.mutation<any, string>({
			query: id => ({ url: `pdf-templates/${id}/default`, method: 'POST' }),
			invalidatesTags: routeTags(TAG),
		}),
		duplicatePdfTemplate: builder.mutation<any, string>({
			query: id => ({ url: `pdf-templates/${id}/duplicate`, method: 'POST' }),
			invalidatesTags: routeTags(TAG),
		}),
		getPdfSettings: builder.query<any, void>({
			query: () => 'pdf-templates/settings',
			providesTags: routeTags(`${TAG}-settings`),
		}),
		savePdfSettings: builder.mutation<any, any>({
			query: body => ({ url: 'pdf-templates/settings', method: 'PUT', body }),
			invalidatesTags: routeTags(`${TAG}-settings`),
		}),
		getPdfGallery: builder.query<{ templates: any[]; builtIn: boolean }, void>({
			query: () => 'pdf-templates/gallery',
			providesTags: routeTags(TAG),
		}),
		addPdfStarters: builder.mutation<{ added: number }, void>({
			query: () => ({ url: 'pdf-templates/gallery/starters', method: 'POST' }),
			invalidatesTags: routeTags(TAG),
		}),
		getPdfFields: builder.query<any, string>({
			query: route => `pdf-templates/fields/${route}`,
		}),
		guessPdfMapping: builder.mutation<any, { from: string; route: string }>({
			query: body => ({ url: 'pdf-templates/guess', method: 'POST', body }),
		}),
		usePdfTemplate: builder.mutation<any, { from: string; route: string; mapping?: any; name?: string }>({
			query: body => ({ url: 'pdf-templates/use', method: 'POST', body }),
			invalidatesTags: routeTags(TAG),
		}),
		/** A template drawn by the server with sample data — `{ url }` to show, revoke when done. */
		renderPdfSample: builder.mutation<{ url: string }, { template: any; data?: any; tz?: string }>({
			query: body => ({ url: 'pdf-templates/render', method: 'POST', body, responseHandler: asObjectUrl }),
		}),
		/** A page's records drawn with a template — `{ url }` to show. */
		renderPdfRecords: builder.mutation<{ url: string }, { route: string; ids: string[]; template?: any; tz?: string }>({
			query: ({ route, ...body }) => ({ url: `${route}/export/template`, method: 'POST', body, responseHandler: asObjectUrl }),
		}),
		/** What a template reads from one record, for the designer's drawing. */
		getPdfRecordData: builder.query<{ roots: any; settings: any; tz: string }, { route: string; id: string; template: any; tz?: string }>({
			query: ({ route, id, template, tz }) => ({ url: `${route}/export/template`, method: 'POST', body: { ids: [id], template, tz, as: 'data' } }),
		}),
	}),
});

export const {
	useGetPdfTemplatesQuery,
	useGetPdfTemplateQuery,
	useCreatePdfTemplateMutation,
	useUpdatePdfTemplateMutation,
	useDeletePdfTemplateMutation,
	useSetDefaultPdfTemplateMutation,
	useDuplicatePdfTemplateMutation,
	useGetPdfSettingsQuery,
	useSavePdfSettingsMutation,
	useGetPdfGalleryQuery,
	useAddPdfStartersMutation,
	useGetPdfFieldsQuery,
	useGuessPdfMappingMutation,
	useUsePdfTemplateMutation,
	useRenderPdfSampleMutation,
	useRenderPdfRecordsMutation,
	useGetPdfRecordDataQuery,
} = pdfTemplatesApi;

/** The viewer's time zone, so dates print as they read them. */
export const viewerZone = () => {
	try {
		return Intl.DateTimeFormat().resolvedOptions().timeZone;
	} catch {
		return 'UTC';
	}
};
