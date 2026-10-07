import mainApi from './mainApi';

/**
 * The signed-in admin's notifications (backend library/controllers/notifications):
 * the navbar bell's unread count, the /notifications page, and marking read.
 */
export const notificationsApi = mainApi.injectEndpoints({
	overrideExisting: false,
	endpoints: builder => ({
		getNotifications: builder.query<any, { page?: number; limit?: number; unread?: boolean }>({
			query: ({ page = 1, limit = 20, unread } = {}) =>
				`notifications?page=${page}&limit=${limit}${unread ? '&unread=true' : ''}`,
			providesTags: ['notifications'],
		}),
		getUnreadNotificationCount: builder.query<{ unread: number }, void>({
			query: () => 'notifications/count',
			providesTags: ['notifications'],
		}),
		markNotificationRead: builder.mutation<any, { id: string; read?: boolean }>({
			query: ({ id, read = true }) => ({ url: `notifications/${id}/read`, method: 'PUT', body: { read } }),
			invalidatesTags: ['notifications'],
		}),
		markAllNotificationsRead: builder.mutation<any, void>({
			query: () => ({ url: 'notifications/read-all', method: 'PUT' }),
			invalidatesTags: ['notifications'],
		}),
		deleteNotification: builder.mutation<any, string>({
			query: id => ({ url: `notifications/${id}`, method: 'DELETE' }),
			invalidatesTags: ['notifications'],
		}),
	}),
});

export const {
	useGetNotificationsQuery,
	useGetUnreadNotificationCountQuery,
	useMarkNotificationReadMutation,
	useMarkAllNotificationsReadMutation,
	useDeleteNotificationMutation,
} = notificationsApi;
