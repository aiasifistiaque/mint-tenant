import mainApi from './mainApi';
import { ListType } from '../store.types';

const BASE_LIMIT = 16;

export const uploadApi = mainApi.injectEndpoints({
	overrideExisting: true,
	endpoints: builder => ({
		getAllUploads: builder.query<ListType<any>, any>({
			query: ({
				sort = '-createdAt',
				page = 1,
				limit = BASE_LIMIT,
				search = '',
				isActive,
				type,
				filters = {},
			}) => ({
				url: 'upload',
				params: { sort, page, limit, type, search, isActive, ...filters },
			}),
			providesTags: ['uploads'],
		}),
		addUpload: builder.mutation<any, any>({
			query: body => ({
				url: `upload`,
				method: 'POST',
				body,
				formData: true,
			}),
			invalidatesTags: ['uploads', 'upload'],
		}),
		addFile: builder.mutation<any, any>({
			query: body => ({
				url: `upload/file`,
				method: 'POST',
				body,
				formData: true,
			}),
			invalidatesTags: ['uploads', 'upload'],
		}),
		addVideo: builder.mutation<any, any>({
			query: ({ body, type }) => ({
				url: type == 'video' ? 'upload/video' : 'upload',
				method: 'POST',
				body,
				formData: true,
			}),
			invalidatesTags: ['uploads', 'upload'],
		}),
	}),
});

export const {
	useGetAllUploadsQuery,
	useAddUploadMutation,
	useAddFileMutation,
	useAddVideoMutation,
} = uploadApi;
