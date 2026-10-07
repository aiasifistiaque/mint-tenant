import mainApi, { routeTags } from './mainApi';

/**
 * Bulk actions on a table's ticked rows — backend bulkActions.controller.ts —
 * and its file exports (exportRows / exportRecordsPdf). Every write
 * invalidates the route's tag, so the list refreshes.
 */

export type StatusSkip = { id: string; name: string; from: string; why: string };
export type MergeLink = { model: string; path: string; count: number };
export type DownloadResult = { name: string; rows: number | null };

/** Bulk upload (backend importRows.controller.ts). */
export type ImportFormat = 'xlsx' | 'csv' | 'json';
export type ImportColumn = { key: string; label: string; type: string; required: boolean; ref?: string; options?: string[]; list?: boolean };
export type ImportProblem = { row: number; field?: string; message: string };
export type ImportResult = {
	message?: string;
	stage?: 'read' | 'check' | 'save';
	total: number;
	valid: number;
	invalidRows: number;
	problems: ImportProblem[];
	moreProblems: number;
	columns: { key: string; label: string }[];
	ignored: string[];
	preview: Record<string, any>[];
	created?: number;
};

/** The file name from a Content-Disposition header. */
const fileNameOf = (header: string | null, fallback: string) => /filename="?([^";]+)"?/i.exec(header || '')?.[1] || fallback;

export const bulkApi = mainApi.injectEndpoints({
	overrideExisting: false,
	endpoints: builder => ({
		bulkDelete: builder.mutation<{ batch: string; deleted: number; skipped: number }, { path: string; ids: string[] }>({
			query: ({ path, ids }) => ({ url: `${path}/bulk/delete`, method: 'POST', body: { ids } }),
			invalidatesTags: (r, e, { path }) => routeTags(path, 'history'),
		}),
		bulkRestore: builder.mutation<{ restored: number }, { path: string; batch: string }>({
			query: ({ path, batch }) => ({ url: `${path}/bulk/restore`, method: 'POST', body: { batch } }),
			invalidatesTags: (r, e, { path }) => routeTags(path, 'history'),
		}),
		bulkDuplicate: builder.mutation<
			{ created: string[]; failed: { id: string; name: string; message: string }[]; skipped: number },
			{ path: string; ids: string[]; overrides?: Record<string, any> }
		>({
			query: ({ path, ids, overrides }) => ({ url: `${path}/bulk/duplicate`, method: 'POST', body: { ids, overrides } }),
			invalidatesTags: (r, e, { path }) => routeTags(path, 'history'),
		}),
		bulkArchive: builder.mutation<{ changed: number; skipped: number }, { path: string; ids: string[]; archived: boolean }>({
			query: ({ path, ids, archived }) => ({ url: `${path}/bulk/archive`, method: 'POST', body: { ids, archived } }),
			invalidatesTags: (r, e, { path }) => routeTags(path, 'history'),
		}),
		bulkStatus: builder.mutation<
			{ changed: number; skipped: StatusSkip[] },
			{ path: string; ids: string[]; to: string; reason?: string }
		>({
			query: ({ path, ...body }) => ({ url: `${path}/bulk/status`, method: 'POST', body }),
			invalidatesTags: (r, e, { path }) => routeTags(path, 'history'),
		}),
		mergePreview: builder.query<
			{ links: MergeLink[]; total: number; editable: string[] },
			{ path: string; keep: string; merge: string[] }
		>({
			query: ({ path, keep, merge }) => ({ url: `${path}/bulk/merge/preview`, method: 'POST', body: { keep, merge } }),
			keepUnusedDataFor: 0,
		}),
		merge: builder.mutation<
			{ kept: string; merged: number; linksMoved: number },
			{ path: string; keep: string; merge: string[]; values: Record<string, string> }
		>({
			query: ({ path, ...body }) => ({ url: `${path}/bulk/merge`, method: 'POST', body }),
			// Links moved, so any list may have changed.
			invalidatesTags: (r, e, { path }) => routeTags(path, 'history'),
		}),
		importTemplate: builder.query<{ columns: ImportColumn[]; maxRows: number }, string>({
			query: path => `${path}/bulk/import/template`,
		}),
		/** Checks every row (dryRun) or saves them all; nothing is saved unless every row passes. */
		importRows: builder.mutation<ImportResult, { path: string; format: ImportFormat; content: string; dryRun: boolean }>({
			query: ({ path, ...body }) => ({ url: `${path}/bulk/import`, method: 'POST', body }),
			invalidatesTags: (r, e, { path, dryRun }) => (dryRun || !r?.created ? [] : routeTags(path, 'history')),
		}),
		/** A file from the server (export/rows, export/records), saved as it arrives. */
		download: builder.mutation<DownloadResult, { url: string; body: any; params?: Record<string, any>; fallbackName: string }>({
			query: ({ url, body, params, fallbackName }) => ({
				url,
				method: 'POST',
				body,
				params,
				// The file goes straight to the browser; only its name and row count
				// reach the store (a Blob isn't serializable).
				responseHandler: async (response: Response) => {
					if (!response.ok) return response.json().catch(() => ({ message: 'Could not download' }));
					const rows = response.headers.get('X-Row-Count');
					const name = fileNameOf(response.headers.get('Content-Disposition'), fallbackName);
					saveFile({ blob: await response.blob(), name });
					return { name, rows: rows === null ? null : Number(rows) };
				},
			}),
		}),
	}),
});

export const {
	useBulkDeleteMutation,
	useBulkRestoreMutation,
	useBulkDuplicateMutation,
	useBulkArchiveMutation,
	useBulkStatusMutation,
	useMergePreviewQuery,
	useMergeMutation,
	useDownloadMutation,
	useImportTemplateQuery,
	useImportRowsMutation,
} = bulkApi;

/** Hands a downloaded file to the browser. */
export const saveFile = ({ blob, name }: { blob: Blob; name: string }) => {
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = name;
	document.body.appendChild(a);
	a.click();
	a.remove();
	setTimeout(() => URL.revokeObjectURL(url), 1000);
};
