import mainApi from './mainApi';

export const adminInvitationApi = mainApi.injectEndpoints({
	endpoints: builder => ({
		inviteAdmin: builder.mutation<any, { email: string; role: string }>({
			query: body => ({
				url: `admin-invitations/invite`,
				method: 'POST',
				body,
			}),
			invalidatesTags: ['admins'],
		}),
		getInvitationInfo: builder.query<{ email: string }, string>({
			query: token => `admin-invitations/${token}`,
		}),
		acceptInvitation: builder.mutation<
			any,
			{ token: string; name: string; phone?: string; password: string }
		>({
			query: ({ token, ...body }) => ({
				url: `admin-invitations/${token}/accept`,
				method: 'POST',
				body,
			}),
		}),
	}),
	overrideExisting: false,
});

export const { useInviteAdminMutation, useGetInvitationInfoQuery, useAcceptInvitationMutation } =
	adminInvitationApi;
export default adminInvitationApi;
