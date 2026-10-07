import mainApi from './mainApi';

/**
 * Signed-in devices (backend library/controllers/sessions): your own in
 * Settings, and everyone's on the super admin's Login sessions page.
 * Signing a session out blacklists its token; that browser's next request
 * gets 401 SESSION_REVOKED and SessionGuard signs it out.
 */

export type AdminSessionView = {
	_id: string;
	current: boolean;
	method: string;
	browser: string;
	os: string;
	deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown';
	ip: string;
	/** Where it is now — "Dhaka, Bangladesh", "Local network", or '' while unknown. */
	location: string;
	countryCode: string | null;
	/** Where it signed in from (differs when the device has moved since). */
	signInIp: string;
	signInLocation: string;
	signedInAt: string;
	lastActiveAt: string;
	online: boolean;
	revokedAt: string | null;
	revokeReason: string | null;
	admin?: { _id: string; name?: string; email?: string; role?: string };
	revokedBy?: { _id: string; name?: string };
};

export type AllSessionsArgs = { status?: 'active' | 'signed-out' | 'all'; admin?: string; search?: string; page?: number; limit?: number };

export const sessionsApi = mainApi.injectEndpoints({
	endpoints: builder => ({
		getMySessions: builder.query<{ doc: AdminSessionView[] }, void>({
			query: () => 'auth/sessions',
			providesTags: ['sessions'],
		}),
		signOutSession: builder.mutation<{ message: string; current: boolean }, string>({
			query: id => ({ url: `auth/sessions/${id}`, method: 'DELETE' }),
			invalidatesTags: ['sessions'],
		}),
		signOutOtherSessions: builder.mutation<{ message: string; count: number }, void>({
			query: () => ({ url: 'auth/sessions/others', method: 'DELETE' }),
			invalidatesTags: ['sessions'],
		}),
		/** Logout: ends this session on the server before the token is dropped. */
		signOutHere: builder.mutation<{ message: string }, void>({
			query: () => ({ url: 'auth/sessions/current', method: 'DELETE' }),
		}),
		getAllSessions: builder.query<
			{ doc: AdminSessionView[]; total: number; page: number; limit: number; summary: { activeSessions: number; adminsOnline: number } },
			AllSessionsArgs
		>({
			query: params => ({ url: 'auth/sessions/all', params }),
			providesTags: ['sessions'],
		}),
		signOutAnySession: builder.mutation<{ message: string; current: boolean }, string>({
			query: id => ({ url: `auth/sessions/all/${id}`, method: 'DELETE' }),
			invalidatesTags: ['sessions'],
		}),
		signOutAdminSessions: builder.mutation<{ message: string; count: number }, string>({
			query: adminId => ({ url: `auth/sessions/all/admin/${adminId}`, method: 'DELETE' }),
			invalidatesTags: ['sessions'],
		}),
	}),
	overrideExisting: false,
});

export const {
	useGetMySessionsQuery,
	useSignOutSessionMutation,
	useSignOutOtherSessionsMutation,
	useSignOutHereMutation,
	useGetAllSessionsQuery,
	useSignOutAnySessionMutation,
	useSignOutAdminSessionsMutation,
} = sessionsApi;
