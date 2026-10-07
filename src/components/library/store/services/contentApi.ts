// import { BASE_LIMIT } from '../constants';
import mainApi from './mainApi';

export const contentApi = mainApi.injectEndpoints({
	overrideExisting: true,
	endpoints: builder => ({
		getContent: builder.query({
			query: ({ path = 'nexa' }: { path: string }) => ({
				url: `/contents/${path}`,
			}),
			providesTags: ['content'],
		}),
		updateContent: builder.mutation({
			query: ({
				body,
				path = 'nexa',
				type = 'content',
			}: {
				body: any;
				path: string;
				type: string;
			}) => ({
				url: `/contents/${path}`,
				params: { type: type },
				method: 'PUT',
				body: body,
			}),
			invalidatesTags: ['content'],
		}),
		addHomeCategory: builder.mutation({
			query: ({ body, path }): any => ({
				url: `/contents/product/${path}`,
				method: 'POST',
				body: body,
			}),
			invalidatesTags: ['content', 'products', 'product'],
		}),
		deleteHomeCategory: builder.mutation({
			query: ({ id, path }): any => ({
				url: `/contents/product/${path}/${id}`,
				method: 'DELETE',
			}),
			invalidatesTags: ['content', 'products', 'product'],
		}),
		updateHomeCategory: builder.mutation({
			query: ({ id, body, path }): any => ({
				url: `/contents/product/${path}/${id}`,
				method: 'PUT',
				body: body,
			}),
			invalidatesTags: ['content', 'products', 'product'],
		}),
	}),
});

export const {
	useGetContentQuery,
	useUpdateContentMutation,
	useAddHomeCategoryMutation,
	useDeleteHomeCategoryMutation,
	useUpdateHomeCategoryMutation,
} = contentApi;
