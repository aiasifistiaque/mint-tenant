import mainApi, { routeTags } from './mainApi';
import { ListType } from '../store.types';
import { BASE_LIMIT } from '../..';

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
		uploadSignature: builder.mutation<any, FormData>({
			query: body => ({
				url: 'upload/signature',
				method: 'POST',
				body,
				formData: true,
			}),
		}),
		uploadMultipleImages: builder.mutation<
			{ message: string; uploaded: number; failed: number; results: any[] },
			{ files: File[]; folder?: string; path?: string }
		>({
			query: ({ files, folder }) => {
				const body = new FormData();
				files.forEach(file => body.append('images', file));
				if (folder) body.append('folder', folder);
				return { url: 'upload/multiple', method: 'POST', body, formData: true };
			},
			invalidatesTags: (result, error, { path }) => routeTags('uploads', 'upload', path || 'images'),
		}),
	}),
});

export const {
	useGetAllUploadsQuery,
	useAddUploadMutation,
	useAddFileMutation,
	useAddVideoMutation,
	useUploadSignatureMutation,
	useUploadMultipleImagesMutation,
} = uploadApi;
