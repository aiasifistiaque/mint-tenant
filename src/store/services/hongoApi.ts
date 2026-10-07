// import { BASE_LIMIT } from '../constants';
import mainApi from './mainApi';

export const contentApi = mainApi.injectEndpoints({
	overrideExisting: true,
	endpoints: builder => ({
		getContent: builder.query({
			query: () => ({
				url: `/contents/hongo`,
			}),
			providesTags: ['content'],
		}),
		updateContent: builder.mutation({
			query: ({ body, path = 'content' }): any => ({
				url: `/contents/hongo`,
				params: { type: path },
				method: 'PUT',
				body: body,
			}),
			invalidatesTags: ['content'],
		}),
		addHomeCategory: builder.mutation({
			query: ({ body }): any => ({
				url: `/contents/product/hongo`,
				method: 'POST',
				body: body,
			}),
			invalidatesTags: ['content', 'products', 'product'],
		}),
		deleteHomeCategory: builder.mutation({
			query: ({ id }): any => ({
				url: `/contents/product/hongo/${id}`,
				method: 'DELETE',
			}),
			invalidatesTags: ['content', 'products', 'product'],
		}),
		updateHomeCategory: builder.mutation({
			query: ({ id, body }): any => ({
				url: `/contents/product/hongo/${id}`,
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
