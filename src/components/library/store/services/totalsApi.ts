import mainApi, { routeTags } from './mainApi';

export type TotalOp = 'sum' | 'avg' | 'min' | 'max' | 'count';
export type TotalItem = { field?: string; op: TotalOp };
export type TotalsResult = {
	records: number;
	results: { field: string | null; op: TotalOp; value: number | null }[];
	/** Every number field of the route that can be totalled. */
	fields: string[];
};

/**
 * Totals of the rows ticked in a table — backend getTotals.controller.ts.
 * A POST (the ids can be many) but a query, so the same selection and
 * calculations are asked once. Tagged with the route, like its list, so an
 * edit there refreshes an open dialog.
 */
export const totalsApi = mainApi.injectEndpoints({
	overrideExisting: false,
	endpoints: builder => ({
		getTotals: builder.query<TotalsResult, { path: string; ids: string[]; items: TotalItem[] }>({
			query: ({ path, ids, items }) => ({ url: `${path}/get/totals`, method: 'POST', body: { ids, items } }),
			providesTags: (result, error, { path }) => routeTags(path),
		}),
	}),
});

export const { useGetTotalsQuery } = totalsApi;
