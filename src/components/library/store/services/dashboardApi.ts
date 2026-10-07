import mainApi, { routeTags } from './mainApi';

/**
 * The dashboard builder's widgets (backend library/controllers/dashboard), and
 * the numbers a widget shows — a route's own /get/stats, read under the
 * viewer's permissions (backend getStats.controller.ts).
 */
export const dashboardApi = mainApi.injectEndpoints({
	overrideExisting: false,
	endpoints: builder => ({
		getDashboard: builder.query<any, void>({
			query: () => 'dashboard',
			providesTags: ['dashboard'],
		}),
		saveDashboard: builder.mutation<any, { widgets: any[] }>({
			query: body => ({ url: 'dashboard', method: 'PUT', body }),
			invalidatesTags: ['dashboard'],
		}),
		resetDashboard: builder.mutation<any, void>({
			query: () => ({ url: 'dashboard', method: 'DELETE' }),
			invalidatesTags: ['dashboard'],
		}),
		// Tagged with the route, like its list: a record added or edited there
		// refreshes the widgets reading it.
		getStats: builder.query<any, { route: string; params: Record<string, any> }>({
			query: ({ route, params }) => ({ url: `${route}/get/stats`, params }),
			providesTags: (result, error, { route }) => routeTags(route),
		}),
	}),
});

export const { useGetDashboardQuery, useSaveDashboardMutation, useResetDashboardMutation, useGetStatsQuery } =
	dashboardApi;
