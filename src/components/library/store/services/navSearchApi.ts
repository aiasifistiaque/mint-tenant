import mainApi from './mainApi';

/**
 * The navbar search's records (backend navSearch.controller.ts, WO-54): pages
 * whose config turns search on, each answering through its own list rules.
 * In the tenant panel it is the current project's `search`.
 */

export type NavSearchHit = {
	_id: string;
	/** The record's name (its display field), or its code / id when it has none. */
	name: string;
	/** The field that matched, when the name doesn't show it. */
	match?: { field: string; label: string; value: string };
};

export type NavSearchGroup = { route: string; title: string; hits: NavSearchHit[]; more: boolean };

export const navSearchApi = mainApi.injectEndpoints({
	overrideExisting: false,
	endpoints: builder => ({
		getNavSearch: builder.query<{ q: string; groups: NavSearchGroup[] }, string>({
			query: q => `search?q=${encodeURIComponent(q)}`,
			keepUnusedDataFor: 30,
		}),
	}),
});

export const { useGetNavSearchQuery } = navSearchApi;
