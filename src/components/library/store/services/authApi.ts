import mainApi, { routeTags } from './mainApi';
import { LoginBodyType, LoginPayloadType } from './types';

export const authApi = mainApi.injectEndpoints({
	endpoints: builder => ({
		lgoin: builder.mutation<LoginPayloadType, LoginBodyType>({
			query: ({ email, password }) => ({
				url: `auth/login`,
				method: 'POST',
				body: {
					email,
					password,
				},
			}),
			invalidatesTags: ['self'],
		}),
		register: builder.mutation<any, any>({
			query: body => ({
				url: `auth/register`,
				method: 'POST',
				body: body,
			}),
			invalidatesTags: ['self'],
		}),
		updatePassword: builder.mutation<any, any>({
			query: body => ({
				url: `auth/change-password`,
				method: 'PUT',
				body,
			}),
			invalidatesTags: ['self'],
		}),
		forgotPassword: builder.mutation<any, { email: string }>({
			query: body => ({
				url: `auth/forgot-password`,
				method: 'POST',
				body,
			}),
		}),
		resetPassword: builder.mutation<any, { token: string; password: string }>({
			query: ({ token, password }) => ({
				url: `auth/reset-password/${token}`,
				method: 'POST',
				body: { password },
			}),
		}),
		getSelf: builder.query<any, any>({
			query: () => `auth/self`,
			providesTags: ['self'],
		}),
		updateSelf: builder.mutation<any, any>({
			query: body => ({
				url: `auth/update/self`,
				method: 'PUT',
				body,
			}),
			invalidatesTags: ['self'],
		}),
		updatePreferences: builder.mutation<any, any>({
			query: ({ field, preferences }) => ({
				url: `auth/update/preferences`,
				method: 'PUT',
				body: { field, preferences },
			}),
			invalidatesTags: (result, error, { field, preferences }) => routeTags(field, 'self'),
		}),
	}),
	overrideExisting: false,
});

export const {
	useLgoinMutation,
	useGetSelfQuery,
	useUpdatePreferencesMutation,
	useRegisterMutation,
	useUpdatePasswordMutation,
	useUpdateSelfMutation,
	useForgotPasswordMutation,
	useResetPasswordMutation,
} = authApi;
export default authApi;
