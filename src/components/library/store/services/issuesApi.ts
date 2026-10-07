import mainApi from './mainApi';

/**
 * The Report issue page (backend controllers/issues/reportIssue). Any
 * signed-in admin can report a problem; it lands on the Issues table as an
 * open bug. "Your reports" lists the caller's own, with their status.
 */

export type ReportedIssue = {
	_id: string;
	code?: string;
	name: string;
	description: string;
	status: string;
	images?: string[];
	createdAt: string;
	updatedAt: string;
};

export type SystemStatus = {
	api: 'operational' | 'down';
	database: 'operational' | 'down';
	databaseMs: number | null;
	apiMs: number;
	uptime: number;
	checkedAt: string;
};

export const issuesApi = mainApi.injectEndpoints({
	endpoints: builder => ({
		getMyReportedIssues: builder.query<{ doc: ReportedIssue[] }, void>({
			query: () => 'issues/report/mine',
			providesTags: ['reported-issues'],
		}),
		reportIssue: builder.mutation<{ _id: string; code?: string; status: string }, { name: string; description: string; images?: string[] }>({
			query: body => ({ url: 'issues/report', method: 'POST', body }),
			invalidatesTags: ['reported-issues', 'issues'],
		}),
		/** Public — the System Status page. */
		getSystemStatus: builder.query<SystemStatus, void>({
			query: () => 'status',
		}),
	}),
});

export const { useGetMyReportedIssuesQuery, useReportIssueMutation, useGetSystemStatusQuery } = issuesApi;
