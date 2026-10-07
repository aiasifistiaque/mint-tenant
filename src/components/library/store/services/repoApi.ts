import mainApi from './mainApi';

/**
 * The repo's hosting link.
 *
 * A dedicated endpoint rather than the generic update: clearing a link needs
 * `$unset` on the server, which the generic PUT cannot express — see the note
 * on `setRepoHosting.controller.ts`.
 */
export const repoApi = mainApi.injectEndpoints({
	overrideExisting: false,
	endpoints: builder => ({
		setRepoHosting: builder.mutation<
			any,
			{
				id: string;
				hostedPlatform?: string;
				hostingAccount?: string;
				hostedProjectId?: string;
				hostedProjectName?: string;
			}
		>({
			query: ({ id, ...body }) => ({
				url: `repos/${id}/hosting`,
				method: 'PUT',
				body,
			}),
			invalidatesTags: ['repos'],
		}),
	}),
});

export const { useSetRepoHostingMutation } = repoApi;
