import mainApi from './mainApi';

/**
 * A website's contents, typed and by page (backend docs/cms D1, CMS-06):
 * routes-tenant/siteContents.router.ts at /p/:project/site-contents. One
 * record per piece of a page — a Hero, Cards, Questions, a List — its type
 * chosen first, its words the type's fields, and any more blocks added
 * under it (`more`: a Text, then a Gallery…).
 */

const TAG = 'site-contents';

export type ContentTypeField = { key: string; label: string; kind: string; required?: boolean; helper?: string; options?: { value: string; label: string }[]; fields?: ContentTypeField[] };
export type ContentType = { uid: string; name: string; title: string; icon: string; description: string; fields: ContentTypeField[]; dataModel: any[]; /** The types that go well with it, most likely first. */ suggest?: string[] };
export type ContentListModel = { model: string; title: string; list: boolean; problem: string | null; fields: { key: string; label: string; kind: string; ref?: string; options?: string[] }[] };
export type ContentBlock = Record<string, any> & { __component: string; _key?: string };
export type ContentStatus = 'draft' | 'published' | 'modified';

export type SiteContent = {
	_id: string;
	name: string;
	slug: string;
	page: string | null;
	order: number;
	type: string | null;
	typeTitle: string | null;
	icon: string;
	data: Record<string, any> | null;
	/** The blocks added under its own, in order: `{ __component, _key, …fields }`. */
	more: ContentBlock[];
	preview: string;
	/** One word per record, from before typed contents: changed in the table. */
	legacy: boolean;
	category: string | null;
	status?: ContentStatus;
	publishedAt?: string | null;
	updatedAt: string;
};

export type SiteContentsPage = { _id: string; name: string; path: string; status: string | null; count: number };
export type SiteContentsList = { drafts: boolean; site: number; pages: SiteContentsPage[]; page: string; doc: SiteContent[] };
export type ContentListPreview = { items: { _id: string; title: string; description: string; image: string; url: string }[]; total: number; problem?: string };

/** The content manager's home (CMS-07, backend routes-tenant/content.router.ts). */
export type ContentModelSummary = {
	route: string;
	title: string;
	description: string;
	drafts: boolean;
	canPublish: boolean;
	total: number;
	draft: number;
	modified: number;
	waiting: number;
	last: { _id: string; name: string; updatedAt: string; status: ContentStatus } | null;
};
export type ContentSingleSummary = { route: string; title: string; description: string; drafts: boolean; canPublish: boolean; exists: boolean; status: ContentStatus | 'live' | null; updatedAt: string | null };
/** A waiting publish or take-off (CMS-11), soonest first. */
export type ContentScheduled = { route: string; title: string; record: string; name: string; action: 'publish' | 'unpublish'; at: string; byName: string };
export type ContentOverview = { website: ContentModelSummary | null; singles: ContentSingleSummary[]; collections: ContentModelSummary[]; scheduled: ContentScheduled[] };

export const siteContentsApi = mainApi.enhanceEndpoints({ addTagTypes: [TAG] }).injectEndpoints({
	endpoints: builder => ({
		getContentOverview: builder.query<ContentOverview, void>({
			query: () => 'content',
			providesTags: [TAG],
		}),
		getSiteContentTypes: builder.query<{ types: ContentType[]; start?: { page: string[]; site: string[] }; models: ContentListModel[] }, void>({
			query: () => 'site-contents/types',
			providesTags: [TAG],
		}),
		getSiteContents: builder.query<SiteContentsList, string>({
			query: page => ({ url: 'site-contents', params: { page } }),
			providesTags: [TAG],
		}),
		createSiteContent: builder.mutation<SiteContent, { page: string | null; type: string; name?: string; slug?: string; data: Record<string, any>; more?: ContentBlock[] }>({
			query: body => ({ url: 'site-contents', method: 'POST', body }),
			invalidatesTags: [TAG],
		}),
		updateSiteContent: builder.mutation<SiteContent, { id: string; name?: string; slug?: string; page?: string | null; data?: Record<string, any>; more?: ContentBlock[] }>({
			query: ({ id, ...body }) => ({ url: `site-contents/${id}`, method: 'PUT', body }),
			invalidatesTags: [TAG],
		}),
		removeSiteContent: builder.mutation<{ ok: boolean }, string>({
			query: id => ({ url: `site-contents/${id}`, method: 'DELETE' }),
			invalidatesTags: [TAG],
		}),
		orderSiteContents: builder.mutation<{ ok: boolean }, { ids: string[] }>({
			query: body => ({ url: 'site-contents/order', method: 'POST', body }),
			invalidatesTags: [TAG],
		}),
		publishSiteContents: builder.mutation<{ message: string; published: number }, { page?: string; ids?: string[] }>({
			query: body => ({ url: 'site-contents/publish', method: 'POST', body }),
			invalidatesTags: [TAG],
		}),
		previewSiteContentList: builder.mutation<ContentListPreview, { data: Record<string, any> }>({
			query: body => ({ url: 'site-contents/list-preview', method: 'POST', body }),
		}),
	}),
});

export const {
	useGetContentOverviewQuery,
	useGetSiteContentTypesQuery,
	useGetSiteContentsQuery,
	useCreateSiteContentMutation,
	useUpdateSiteContentMutation,
	useRemoveSiteContentMutation,
	useOrderSiteContentsMutation,
	usePreviewSiteContentListMutation,
	usePublishSiteContentsMutation,
} = siteContentsApi;
