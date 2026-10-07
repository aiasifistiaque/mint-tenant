import { BASE_LIMIT } from '../..';
import mainApi, { routeTags } from './mainApi';

export const userApi = mainApi.injectEndpoints({
	overrideExisting: true,
	endpoints: builder => ({
		getFilters: builder.query<any, string>({
			query: (path: string) => `${path}/get/filters`,
			providesTags: ['filters'],
		}),

		getSchema: builder.query<any, string>({
			query: (path: string) => `${path}/get/schema`,
			providesTags: ['schema'],
		}),

		getRoute: builder.query<any, string>({
			query: (path: string) => `${path}/get/route`,
			providesTags: ['route'],
		}),

		getConfig: builder.query<any, string>({
			query: (path: string) => `${path}/get/config`,
			providesTags: ['config'],
		}),

		getCount: builder.query<any, any>({
			query: ({ path, filters = {} }: { path: string; filters?: any }) => ({
				url: `${path}/get/count`,
				params: { ...filters },
			}),
			providesTags: (result, error, { path }) => routeTags(path),
		}),
		getSum: builder.query<any, any>({
			query: ({ path, field, filters = {} }: { path: string; field: string; filters?: any }) => ({
				url: `${path}/get/sum/${field}`,
				params: { ...filters },
			}),
			providesTags: (result, error, { path }) => routeTags(path),
		}),
		getAll: builder.query<any, any>({
			query: ({
				sort = '-createdAt',
				page = 1,
				limit = BASE_LIMIT,
				search = '',
				isActive,
				filters = {},
				path,
			}) => ({
				url: path,
				params: { sort, page, limit, search, isActive, ...filters },
			}),
			providesTags: (result, error, { path }) => routeTags(path),
		}),

		getSelectData: builder.query<any, string>({
			query: (id: any) => `${id}?limit=1000&sort=name`,
			providesTags: ['filters', 'products', 'brands', 'categories', 'coupons', 'collections'],
		}),
		/**
		 * One record's audit trail.
		 *
		 * Its own endpoint rather than `get` with an interpolated path: `get`
		 * derives its cache tag from `path`, so a per-document URL would register
		 * a brand new tag per record ("Tag type 'history/g/document/<id>' was
		 * used, but not specified in `tagTypes`"). This tags them all as
		 * 'history', so any write to the log refreshes every open timeline.
		 */
		getDocumentHistory: builder.query<any, { id: string; limit?: number; page?: number }>({
			query: ({ id, limit = 50, page = 1 }): any =>
				`history/g/document/${id}?limit=${limit}&page=${page}`,
			providesTags: ['history'],
		}),

		getById: builder.query<any, { path: string; id: any; invalidate?: string[] }>({
			query: ({ path, id, invalidate = [] }): any => `${path}/${id}`,
			providesTags: (result, error, { path, invalidate = [] }: any) => routeTags(path, ...invalidate),
		}),

		get: builder.query<any, { path: string; invalidate?: string[] }>({
			query: ({ path, invalidate = [] }): any => `${path}`,
			providesTags: (result, error, { path, invalidate = [] }: any) => routeTags(path, ...invalidate),
		}),

		getOne: builder.query<any, { path: string; invalidate?: string[] }>({
			query: ({ path, invalidate = [] }): any => `${path}/get/one`,
			providesTags: (result, error, { path, invalidate = [] }: any) => routeTags(path, ...invalidate),
		}),

		getByIdToEdit: builder.query<any, { path: string; id: any; invalidate?: string[] }>({
			query: ({ path, id, invalidate }): any => `${path}/edit/${id}`,
			providesTags: (result, error, { path, invalidate = [] }: any) => routeTags(path, ...invalidate),
		}),
		post: builder.mutation<any, { path: string; body: any; invalidate?: string[]; type?: string }>({
			query: ({ path, body, invalidate }): any => ({
				url: path,
				method: 'POST',
				body: body,
			}),
			invalidatesTags: (result, error, { path, invalidate = [] }: any) =>
				routeTags('filters', path, ...invalidate),
		}),
		export: builder.mutation<any, { path: string; body: any; invalidate?: string; type?: string }>({
			query: ({ path, body, invalidate, type = 'csv' }): any => ({
				url: `${path}/export/${type}`,
				method: 'POST',
				body: { fields: body },
				responseHandler: (response: any) => response.blob(),
			}),
			onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
				try {
					const result = await queryFulfilled;

					const url = window.URL.createObjectURL(result.data);
					const link = document.createElement('a');
					link.href = url;
					const date = new Date();
					const fileExtension = arg.type == 'pdf' ? 'pdf' : 'csv';

					const timestamp = date.toISOString().replace(/[:.]/g, '-');
					const name = arg?.path.toUpperCase().replace('/', '_');
					link.setAttribute('download', `${name}_${timestamp}.${fileExtension}`);

					document.body.appendChild(link);
					link.click();
					link.remove();
				} catch (e: any) {
					//throw new Error(e.message);
				}
			},
		}),

		exportMany: builder.mutation<
			any,
			{ path: string; body: any; invalidate?: string; type?: string }
		>({
			query: ({ path, body, invalidate, type = 'csv' }): any => ({
				url: `${path}/export/${type}`,
				method: 'POST',
				body: { fields: body?.fields, ids: body?.ids },
				responseHandler: (response: any) => response.blob(),
			}),
			onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
				try {
					const result = await queryFulfilled;

					const url = window.URL.createObjectURL(result.data);
					const link = document.createElement('a');
					link.href = url;
					const date = new Date();
					const timestamp = date.toISOString().replace(/[:.]/g, '-');
					link.setAttribute('download', `data_${timestamp}.csv`);

					document.body.appendChild(link);
					link.click();
					link.remove();
				} catch (e: any) {
					//throw new Error(e.message);
				}
			},
		}),
		updateById: builder.mutation<
			any,
			{ path: string; id: string; body: any; invalidate?: string[] }
		>({
			query: ({ path, id, body, invalidate }): any => ({
				url: `${path}/${id}`,
				method: 'PUT',
				body: body,
			}),
			invalidatesTags: (result, error, { path, id, invalidate = [] }: any) => routeTags(path, ...invalidate),
		}),
		deleteById: builder.mutation<any, { path: string; id: string; invalidate?: string[] }>({
			query: ({ path, id, invalidate }): any => ({
				url: `${path}/${id}`,
				method: 'DELETE',
			}),
			invalidatesTags: (result, error, { path, id, invalidate = [] }: any) => routeTags(path, ...invalidate),
		}),
		updateMany: builder.mutation<any, { path: string; body: any; invalidate?: any }>({
			query: ({ path, body }): any => ({
				url: `${path}/update/many`,
				method: 'PUT',
				body: body,
			}),
			// `invalidate` is optional here; routeTags drops it when missing.
			invalidatesTags: (result, error, { path, invalidate }) => routeTags(path, invalidate),
		}),
		copyItem: builder.mutation<any, { path: string; body: any; invalidate?: string[] }>({
			query: ({ path, body, invalidate }): any => ({
				url: `${path}/copy/${body.id}`,
				method: 'PUT',
				body: body,
			}),
			invalidatesTags: (result, error, { path, invalidate = [] }) => routeTags(path, ...invalidate),
		}),
		deleteProductlistByKeyId: builder.mutation<
			any,
			{ path: string; id: string; key: string; invalidate?: string[] }
		>({
			query: ({ path, id, key, invalidate }): any => ({
				url: `${path}/${id}?key=${key}`,
				method: 'DELETE',
			}),
			invalidatesTags: (result, error, { path, id, invalidate = [] }: any) => routeTags(path, ...invalidate),
		}),
	}),
});

export const {
	useGetFiltersQuery,
	useGetSelectDataQuery,
	useGetByIdQuery,
	useGetDocumentHistoryQuery,
	useUpdateByIdMutation,
	useGetAllQuery,
	useDeleteByIdMutation,
	usePostMutation,
	useGetCountQuery,
	useExportMutation,
	useUpdateManyMutation,
	useCopyItemMutation,
	useGetByIdToEditQuery,
	useLazyGetByIdToEditQuery,
	useExportManyMutation,
	useGetSumQuery,
	useGetOneQuery,
	useLazyGetAllQuery,
	useLazyGetByIdQuery,
	useLazyGetQuery,
	useGetQuery,
	useDeleteProductlistByKeyIdMutation,
	useGetSchemaQuery,
	useGetConfigQuery,
	useGetRouteQuery,
} = userApi;
