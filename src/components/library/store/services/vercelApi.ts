import mainApi from './mainApi';

/**
 * Dedicated endpoints rather than the generic `useGetQuery({path})`. That
 * helper derives its cache tag from `path`, so a per-account or per-project URL
 * here would register a brand new tag on every call ("Tag type ... was used,
 * but not specified in `tagTypes`"). Fixed tags mean a write to one account's
 * projects refreshes every open view of it without minting a tag per id.
 *
 * Mirrors `herokuApi.ts`, including its two hard-won rules: fixed tag names,
 * and `keepUnusedDataFor: 0` on anything holding secrets.
 */

/** The team scope rides on every request. Undefined is the personal account,
 *  which is the correct scope rather than a missing value — so it is omitted
 *  rather than sent empty. */
const scoped = (team?: string, extra: Record<string, any> = {}) => ({
	...extra,
	...(team ? { team } : {}),
});

export const vercelApi = mainApi.injectEndpoints({
	overrideExisting: false,
	endpoints: builder => ({
		//Account-level reads
		getVercelAccount: builder.query<any, { id: string; team?: string }>({
			query: ({ id, team }) => ({ url: `vercels/${id}/account`, params: scoped(team) }),
			providesTags: ['vercel-account'],
		}),
		getVercelTeams: builder.query<any, { id: string }>({
			query: ({ id }) => `vercels/${id}/teams`,
			providesTags: ['vercel-teams'],
		}),
		getVercelActivity: builder.query<any, { id: string; project?: string; limit?: number }>({
			query: ({ id, project, limit = 50 }) => ({
				url: `vercels/${id}/activity`,
				params: { ...(project ? { project } : {}), limit },
			}),
			providesTags: ['vercel-activity'],
		}),
		getVercelUsage: builder.query<any, { id: string; days?: number; team?: string }>({
			query: ({ id, days = 30, team }) => ({
				url: `vercels/${id}/usage`,
				params: scoped(team, { days }),
			}),
			providesTags: ['vercel-usage'],
		}),
		getVercelAccountResources: builder.query<any, { id: string; team?: string }>({
			query: ({ id, team }) => ({ url: `vercels/${id}/resources`, params: scoped(team) }),
			providesTags: ['vercel-resources'],
		}),

		//Projects
		getVercelProjects: builder.query<
			any,
			{ id: string; team?: string; search?: string; until?: number }
		>({
			query: ({ id, team, search, until }) => ({
				url: `vercels/${id}/projects`,
				params: scoped(team, {
					...(search ? { search } : {}),
					...(until ? { until } : {}),
				}),
			}),
			providesTags: ['vercel-projects'],
		}),
		getVercelProject: builder.query<any, { id: string; project: string; team?: string }>({
			query: ({ id, project, team }) => ({
				url: `vercels/${id}/projects/${project}`,
				params: scoped(team),
			}),
			providesTags: ['vercel-project'],
		}),
		getVercelProjectResources: builder.query<any, { id: string; project: string; team?: string }>({
			query: ({ id, project, team }) => ({
				url: `vercels/${id}/projects/${project}/resources`,
				params: scoped(team),
			}),
			providesTags: ['vercel-resources'],
		}),

		/**
		 * Environment variables.
		 *
		 * Values do not come back readable — the list endpoint returns encrypted
		 * envelopes however it is asked — so this is metadata plus masked values.
		 * It is still `keepUnusedDataFor: 0`, because the key names alone map a
		 * production system and there is no reason to retain them after the view
		 * unmounts.
		 */
		getVercelEnv: builder.query<any, { id: string; project: string; team?: string }>({
			query: ({ id, project, team }) => ({
				url: `vercels/${id}/projects/${project}/env`,
				params: scoped(team),
			}),
			providesTags: ['vercel-env'],
			keepUnusedDataFor: 0,
		}),
		/**
		 * One plaintext value, fetched only when someone explicitly asks to see
		 * that one. Never cached, and deliberately not tagged: a reveal is not
		 * state the rest of the page should be invalidating or re-fetching.
		 */
		revealVercelEnv: builder.query<
			any,
			{ id: string; project: string; envId: string; team?: string }
		>({
			query: ({ id, project, envId, team }) => ({
				url: `vercels/${id}/projects/${project}/env/${envId}`,
				params: scoped(team),
			}),
			keepUnusedDataFor: 0,
		}),

		//Deployments
		getVercelDeployments: builder.query<
			any,
			{ id: string; project: string; target?: string; state?: string; until?: number; team?: string }
		>({
			query: ({ id, project, target, state, until, team }) => ({
				url: `vercels/${id}/projects/${project}/deployments`,
				params: scoped(team, {
					...(target ? { target } : {}),
					...(state ? { state } : {}),
					...(until ? { until } : {}),
				}),
			}),
			providesTags: ['vercel-deployments'],
		}),
		getVercelDeployment: builder.query<any, { id: string; deployment: string; team?: string }>({
			query: ({ id, deployment, team }) => ({
				url: `vercels/${id}/deployments/${deployment}`,
				params: scoped(team),
			}),
			providesTags: ['vercel-deployments'],
		}),
		/**
		 * Build logs print environment values, tokens and connection strings, so
		 * they are secrets in every sense that matters and are never retained
		 * after the view unmounts.
		 */
		getVercelBuildLogs: builder.query<
			any,
			{ id: string; deployment: string; limit?: number; team?: string }
		>({
			query: ({ id, deployment, limit = 500, team }) => ({
				url: `vercels/${id}/deployments/${deployment}/events`,
				params: scoped(team, { limit }),
			}),
			keepUnusedDataFor: 0,
		}),

		//Domains
		getVercelDomains: builder.query<any, { id: string; project: string; team?: string }>({
			query: ({ id, project, team }) => ({
				url: `vercels/${id}/projects/${project}/domains`,
				params: scoped(team),
			}),
			providesTags: ['vercel-domains'],
		}),

		//Account mutations
		verifyVercelToken: builder.mutation<any, { apiToken: string }>({
			query: body => ({ url: `vercels/verify`, method: 'POST', body }),
		}),
		rotateVercelToken: builder.mutation<
			any,
			{ id: string; apiToken: string; allowAccountChange?: boolean }
		>({
			query: ({ id, ...body }) => ({ url: `vercels/${id}/key`, method: 'PUT', body }),
			invalidatesTags: ['vercels', 'vercel-account', 'vercel-projects', 'vercel-activity'],
		}),

		//Project mutations
		createVercelProject: builder.mutation<any, { id: string; team?: string; [key: string]: any }>({
			query: ({ id, team, ...body }) => ({
				url: `vercels/${id}/projects`,
				method: 'POST',
				params: scoped(team),
				body,
			}),
			invalidatesTags: ['vercel-projects', 'vercel-usage', 'vercel-activity'],
		}),
		updateVercelProject: builder.mutation<
			any,
			{ id: string; project: string; team?: string; [key: string]: any }
		>({
			query: ({ id, project, team, ...body }) => ({
				url: `vercels/${id}/projects/${project}`,
				method: 'PATCH',
				params: scoped(team),
				body,
			}),
			invalidatesTags: ['vercel-project', 'vercel-projects', 'vercel-activity'],
		}),
		deleteVercelProject: builder.mutation<
			any,
			{ id: string; project: string; confirm: string; team?: string }
		>({
			query: ({ id, project, confirm, team }) => ({
				url: `vercels/${id}/projects/${project}`,
				method: 'DELETE',
				params: scoped(team, { confirm }),
			}),
			invalidatesTags: ['vercel-projects', 'vercel-resources', 'vercel-usage', 'vercel-activity'],
		}),

		/**
		 * Commit a staged environment batch.
		 *
		 * Answers 207 with `{ applied, failed, remaining }` when a batch lands
		 * partially — Vercel has no atomic multi-record write. The caller must
		 * render that as its own outcome rather than as success or failure.
		 */
		updateVercelEnv: builder.mutation<
			any,
			{ id: string; project: string; records: any[]; confirm?: string; allowEmpty?: boolean; team?: string }
		>({
			query: ({ id, project, team, ...body }) => ({
				url: `vercels/${id}/projects/${project}/env`,
				method: 'POST',
				params: scoped(team),
				body,
			}),
			// Not `vercel-deployments`: unlike Heroku, saving does not restart or
			// redeploy anything. The running deployment still holds the old values
			// until someone deploys again, and invalidating here would imply
			// otherwise.
			invalidatesTags: ['vercel-env', 'vercel-activity'],
		}),
		downloadVercelEnv: builder.mutation<
			any,
			{ id: string; project: string; projectName: string; format: 'env' | 'json'; target?: string; team?: string }
		>({
			query: ({ id, project, format, target = 'production', team }) => ({
				url: `vercels/${id}/projects/${project}/env/download`,
				method: 'GET',
				params: scoped(team, { format, target }),
				responseHandler: (response: any) => response.blob(),
			}),
			invalidatesTags: ['vercel-activity'],
			onQueryStarted: async ({ projectName, format, target = 'production' }, { queryFulfilled }) => {
				try {
					const result = await queryFulfilled;

					const url = window.URL.createObjectURL(result.data);
					const link = document.createElement('a');
					link.href = url;
					link.setAttribute(
						'download',
						format === 'json' ? `${projectName}.env.json` : `${projectName}.${target}.env`
					);

					document.body.appendChild(link);
					link.click();
					link.remove();

					// The blob is a file of live production secrets; without this it
					// stays resolvable in the tab for as long as the page is open.
					window.URL.revokeObjectURL(url);
				} catch {
					// Caught only to stop RTK reporting an unhandled rejection. The
					// user-facing report is the mutation's own `isError`/`error`, which
					// the page renders through <Toast>. Nothing belongs here.
				}
			},
		}),

		/**
		 * The same file the download produces, returned as text for the clipboard.
		 *
		 * A separate endpoint rather than a flag on `downloadVercelEnv`, because
		 * that one's `onQueryStarted` unconditionally creates a blob and clicks a
		 * link — copy and download are different side effects and sharing one
		 * mutation would mean a copy also writing a file to disk.
		 */
		copyVercelEnv: builder.mutation<
			string,
			{ id: string; project: string; target?: string; team?: string }
		>({
			query: ({ id, project, target = 'production', team }) => ({
				url: `vercels/${id}/projects/${project}/env/download`,
				method: 'GET',
				params: scoped(team, { format: 'env', target }),
				responseHandler: (response: any) => response.text(),
			}),
			invalidatesTags: ['vercel-activity'],
		}),

		//Deployment mutations
		createVercelDeployment: builder.mutation<
			any,
			{
				id: string;
				project: string;
				deploymentId?: string;
				ref?: string;
				target?: string;
				confirm?: string;
				team?: string;
			}
		>({
			query: ({ id, project, team, ...body }) => ({
				url: `vercels/${id}/projects/${project}/deploy`,
				method: 'POST',
				params: scoped(team),
				body,
			}),
			invalidatesTags: ['vercel-deployments', 'vercel-project', 'vercel-usage', 'vercel-activity'],
		}),
		promoteVercelDeployment: builder.mutation<
			any,
			{ id: string; project: string; deployment: string; confirm?: string; team?: string }
		>({
			query: ({ id, project, deployment, team, ...body }) => ({
				url: `vercels/${id}/projects/${project}/promote/${deployment}`,
				method: 'POST',
				params: scoped(team),
				body,
			}),
			invalidatesTags: ['vercel-deployments', 'vercel-project', 'vercel-activity'],
		}),
		cancelVercelDeployment: builder.mutation<any, { id: string; deployment: string; team?: string }>({
			query: ({ id, deployment, team }) => ({
				url: `vercels/${id}/deployments/${deployment}/cancel`,
				method: 'PATCH',
				params: scoped(team),
			}),
			invalidatesTags: ['vercel-deployments', 'vercel-activity'],
		}),
		deleteVercelDeployment: builder.mutation<any, { id: string; deployment: string; team?: string }>({
			query: ({ id, deployment, team }) => ({
				url: `vercels/${id}/deployments/${deployment}`,
				method: 'DELETE',
				params: scoped(team),
			}),
			invalidatesTags: ['vercel-deployments', 'vercel-usage', 'vercel-activity'],
		}),

		//Domain mutations
		addVercelDomain: builder.mutation<any, { id: string; project: string; name: string; team?: string }>({
			query: ({ id, project, team, ...body }) => ({
				url: `vercels/${id}/projects/${project}/domains`,
				method: 'POST',
				params: scoped(team),
				body,
			}),
			invalidatesTags: ['vercel-domains', 'vercel-resources', 'vercel-activity'],
		}),
		verifyVercelDomain: builder.mutation<
			any,
			{ id: string; project: string; domain: string; team?: string }
		>({
			query: ({ id, project, domain, team }) => ({
				url: `vercels/${id}/projects/${project}/domains/${domain}/verify`,
				method: 'POST',
				params: scoped(team),
			}),
			invalidatesTags: ['vercel-domains', 'vercel-activity'],
		}),
		removeVercelDomain: builder.mutation<
			any,
			{ id: string; project: string; domain: string; confirm?: string; team?: string }
		>({
			query: ({ id, project, domain, confirm, team }) => ({
				url: `vercels/${id}/projects/${project}/domains/${domain}`,
				method: 'DELETE',
				params: scoped(team, confirm ? { confirm } : {}),
			}),
			invalidatesTags: ['vercel-domains', 'vercel-resources', 'vercel-activity'],
		}),
	}),
});

export const {
	useGetVercelAccountQuery,
	useGetVercelTeamsQuery,
	useGetVercelActivityQuery,
	useGetVercelUsageQuery,
	useGetVercelAccountResourcesQuery,
	useGetVercelProjectsQuery,
	useGetVercelProjectQuery,
	useGetVercelProjectResourcesQuery,
	useGetVercelEnvQuery,
	useLazyRevealVercelEnvQuery,
	useGetVercelDeploymentsQuery,
	useGetVercelDeploymentQuery,
	useGetVercelBuildLogsQuery,
	useGetVercelDomainsQuery,
	useVerifyVercelTokenMutation,
	useRotateVercelTokenMutation,
	useCreateVercelProjectMutation,
	useUpdateVercelProjectMutation,
	useDeleteVercelProjectMutation,
	useUpdateVercelEnvMutation,
	useDownloadVercelEnvMutation,
	useCopyVercelEnvMutation,
	useCreateVercelDeploymentMutation,
	usePromoteVercelDeploymentMutation,
	useCancelVercelDeploymentMutation,
	useDeleteVercelDeploymentMutation,
	useAddVercelDomainMutation,
	useVerifyVercelDomainMutation,
	useRemoveVercelDomainMutation,
} = vercelApi;
