import mainApi from './mainApi';

// The media manager (admin /images) — see backend routes-admin/file/media.admin.route.ts.
// Every write invalidates the older list tags too, so the image pickers and the
// Images/Files tables refresh after a change made here.
const LEGACY = ['images', 'files', 'folders', 'upload', 'uploads'];
const ALL = ['media', 'media-trash', 'media-usage', ...LEGACY];

export type MediaFolder = {
	_id: string;
	name: string;
	parent?: string | null;
	fileCount?: number;
	folderCount?: number;
	createdAt?: string;
	trashedAt?: string | null;
};

export type MediaFile = {
	_id: string;
	name: string;
	url: string;
	key: string;
	type: string;
	fileType?: 'image' | 'video' | 'document';
	size?: number;
	width?: number;
	height?: number;
	fileFolder?: string | { _id: string; name: string } | null;
	createdAt?: string;
	trashedAt?: string | null;
};

export type MediaBrowse = {
	folders: MediaFolder[];
	files: MediaFile[];
	path: { _id: string; name: string }[];
	page: number;
	limit: number;
	totalFiles: number;
	hasMore: boolean;
};

export type MediaSelection = { files?: string[]; folders?: string[] };

export const mediaApi = mainApi.injectEndpoints({
	overrideExisting: true,
	endpoints: builder => ({
		browseMedia: builder.query<
			MediaBrowse,
			{ folder?: string | null; search?: string; type?: string; sort?: string; page?: number; limit?: number }
		>({
			query: ({ folder, search, type, sort, page, limit }) => ({
				url: 'media/browse',
				params: {
					...(folder && { folder }),
					...(search && { search }),
					...(type && { type }),
					...(sort && { sort }),
					...(page && { page }),
					...(limit && { limit }),
				},
			}),
			providesTags: ['media'],
		}),
		getMediaTree: builder.query<{ folders: MediaFolder[] }, void>({
			query: () => 'media/tree',
			providesTags: ['media'],
		}),
		getMediaUsage: builder.query<
			{
				size: number;
				count: number;
				folders: number;
				byType: { type: string; size: number; count: number }[];
				trash: { size: number; count: number };
			},
			void
		>({
			query: () => 'media/usage',
			providesTags: ['media-usage'],
		}),
		getMediaTrash: builder.query<{ folders: MediaFolder[]; files: MediaFile[]; days: number }, void>({
			query: () => 'media/trash',
			providesTags: ['media-trash'],
		}),
		createMediaFolder: builder.mutation<{ doc: MediaFolder }, { name: string; parent?: string | null }>({
			query: body => ({ url: 'media/folders', method: 'POST', body }),
			invalidatesTags: ['media', 'folders'],
		}),
		ensureMediaPath: builder.mutation<{ folder: string | null }, { parent?: string | null; segments: string[] }>({
			query: body => ({ url: 'media/folders/ensure-path', method: 'POST', body }),
		}),
		renameMediaFolder: builder.mutation<{ doc: MediaFolder }, { id: string; name: string }>({
			query: ({ id, name }) => ({ url: `media/folders/${id}`, method: 'PATCH', body: { name } }),
			invalidatesTags: ['media', 'folders'],
		}),
		renameMediaFile: builder.mutation<{ doc: MediaFile }, { id: string; name: string }>({
			query: ({ id, name }) => ({ url: `media/files/${id}`, method: 'PATCH', body: { name } }),
			invalidatesTags: ['media', 'images', 'files'],
		}),
		moveMedia: builder.mutation<
			{
				message: string;
				renamed: { _id: string; from: string; to: string }[];
				previous: { files: { _id: string; folder: string | null }[]; folders: { _id: string; folder: string | null }[] };
			},
			MediaSelection & { target: string | null }
		>({
			query: body => ({ url: 'media/move', method: 'POST', body }),
			invalidatesTags: ALL,
		}),
		copyMedia: builder.mutation<{ doc: MediaFile[] }, { files: string[] }>({
			query: body => ({ url: 'media/copy', method: 'POST', body }),
			invalidatesTags: ALL,
		}),
		trashMedia: builder.mutation<any, MediaSelection>({
			query: body => ({ url: 'media/trash', method: 'POST', body }),
			invalidatesTags: ALL,
		}),
		restoreMedia: builder.mutation<any, MediaSelection>({
			query: body => ({ url: 'media/restore', method: 'POST', body }),
			invalidatesTags: ALL,
		}),
		purgeMedia: builder.mutation<{ files: number; failed: number }, MediaSelection & { all?: boolean }>({
			query: body => ({ url: 'media/purge', method: 'POST', body }),
			invalidatesTags: ALL,
		}),
		// After the upload queue finishes: its uploads go through XHR (for progress),
		// outside RTK, so this is how the lists find out.
		refreshMedia: builder.mutation<null, void>({
			queryFn: () => ({ data: null }),
			invalidatesTags: ALL,
		}),
	}),
});

export const {
	useBrowseMediaQuery,
	useGetMediaTreeQuery,
	useGetMediaUsageQuery,
	useGetMediaTrashQuery,
	useCreateMediaFolderMutation,
	useEnsureMediaPathMutation,
	useRenameMediaFolderMutation,
	useRenameMediaFileMutation,
	useMoveMediaMutation,
	useCopyMediaMutation,
	useTrashMediaMutation,
	useRestoreMediaMutation,
	usePurgeMediaMutation,
	useRefreshMediaMutation,
} = mediaApi;
