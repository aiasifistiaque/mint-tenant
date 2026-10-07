import mainApi from './mainApi';

/**
 * Dedicated endpoints rather than the generic `useGetQuery({path})`. That
 * helper derives its cache tag from `path`, so a per-account or per-app URL
 * here would register a brand new tag on every call ("Tag type ... was used,
 * but not specified in `tagTypes`") — the same trap `getDocumentHistory` in
 * commonApi.ts documents. Fixed tags mean a write to one account's apps
 * refreshes every open view of it, without minting a tag per id.
 */
export const herokuApi = mainApi.injectEndpoints({
	overrideExisting: false,
	endpoints: builder => ({
		getHerokuAccount: builder.query<any, { id: string }>({
			query: ({ id }) => `herokus/${id}/account`,
			providesTags: ['heroku-account'],
		}),
		getHerokuApps: builder.query<any, { id: string }>({
			query: ({ id }) => `herokus/${id}/apps`,
			providesTags: ['heroku-apps'],
		}),
		getHerokuApp: builder.query<any, { id: string; app: string }>({
			query: ({ id, app }) => `herokus/${id}/apps/${app}`,
			providesTags: ['heroku-apps'],
		}),
		// Live secrets: `keepUnusedDataFor: 0` keeps them out of the RTK cache
		// once the page holding them unmounts.
		getHerokuConfigVars: builder.query<any, { id: string; app: string }>({
			query: ({ id, app }) => `herokus/${id}/apps/${app}/config-vars`,
			providesTags: ['heroku-config'],
			keepUnusedDataFor: 0,
		}),
		// Account-level reads
		getHerokuBilling: builder.query<any, { id: string; team?: string }>({
			query: ({ id, team }) => ({ url: `herokus/${id}/billing`, params: team ? { team } : {} }),
			providesTags: ['heroku-billing'],
		}),
		getHerokuUsage: builder.query<any, { id: string; start?: string; end?: string }>({
			query: ({ id, start, end }) => ({ url: `herokus/${id}/usage`, params: { start, end } }),
			providesTags: ['heroku-usage'],
		}),
		getHerokuActivity: builder.query<any, { id: string; app?: string; limit?: number }>({
			query: ({ id, app, limit = 50 }) => ({
				url: `herokus/${id}/activity`,
				params: { ...(app ? { app } : {}), limit },
			}),
			providesTags: ['heroku-activity'],
		}),

		// Deploys
		getHerokuCurrentRelease: builder.query<any, { id: string; app: string }>({
			query: ({ id, app }) => `herokus/${id}/apps/${app}/current-release`,
			providesTags: ['heroku-releases'],
		}),
		getHerokuReleases: builder.query<any, { id: string; app: string; cursor?: string }>({
			query: ({ id, app, cursor }) => ({
				url: `herokus/${id}/apps/${app}/releases`,
				params: cursor ? { cursor } : {},
			}),
			providesTags: ['heroku-releases'],
		}),
		getHerokuBuilds: builder.query<any, { id: string; app: string; cursor?: string }>({
			query: ({ id, app, cursor }) => ({
				url: `herokus/${id}/apps/${app}/builds`,
				params: cursor ? { cursor } : {},
			}),
			providesTags: ['heroku-releases'],
		}),

		// Dynos
		getHerokuDynos: builder.query<any, { id: string; app: string }>({
			query: ({ id, app }) => `herokus/${id}/apps/${app}/dynos`,
			providesTags: ['heroku-dynos'],
		}),

		// Add-ons, domains, collaborators
		getHerokuAppResources: builder.query<any, { id: string; app: string }>({
			query: ({ id, app }) => `herokus/${id}/apps/${app}/resources`,
			providesTags: ['heroku-resources'],
		}),

		// Logs are secrets too (apps print tokens to stdout), so they are never
		// retained after the view unmounts.
		getHerokuLogs: builder.query<
			any,
			{ id: string; app: string; lines?: number; source?: string; dyno?: string }
		>({
			query: ({ id, app, lines = 100, source = '', dyno = '' }) => ({
				url: `herokus/${id}/apps/${app}/logs`,
				params: { lines, ...(source ? { source } : {}), ...(dyno ? { dyno } : {}) },
			}),
			keepUnusedDataFor: 0,
		}),

		verifyHerokuKey: builder.mutation<any, { apiKey: string }>({
			query: body => ({
				url: `herokus/verify`,
				method: 'POST',
				body,
			}),
		}),

		// Mutations. Each invalidates only what its action actually moves —
		// a config var write restarts dynos, so it touches dynos too.
		updateHerokuConfigVars: builder.mutation<any, { id: string; app: string; vars: any }>({
			query: ({ id, app, vars }) => ({
				url: `herokus/${id}/apps/${app}/config-vars`,
				method: 'PATCH',
				body: { vars },
			}),
			invalidatesTags: ['heroku-config', 'heroku-dynos', 'heroku-releases', 'heroku-activity'],
		}),
		redeployHerokuApp: builder.mutation<any, { id: string; app: string }>({
			query: ({ id, app }) => ({ url: `herokus/${id}/apps/${app}/redeploy`, method: 'POST' }),
			invalidatesTags: ['heroku-releases', 'heroku-dynos', 'heroku-activity'],
		}),
		rollbackHerokuRelease: builder.mutation<any, { id: string; app: string; version: number }>({
			query: ({ id, app, version }) => ({
				url: `herokus/${id}/apps/${app}/releases/${version}/rollback`,
				method: 'POST',
			}),
			invalidatesTags: ['heroku-releases', 'heroku-dynos', 'heroku-activity'],
		}),
		createHerokuBuild: builder.mutation<
			any,
			{ id: string; app: string; sourceUrl: string; version?: string }
		>({
			query: ({ id, app, sourceUrl, version }) => ({
				url: `herokus/${id}/apps/${app}/builds`,
				method: 'POST',
				body: { sourceUrl, version },
			}),
			invalidatesTags: ['heroku-releases', 'heroku-activity'],
		}),
		restartHerokuApp: builder.mutation<any, { id: string; app: string }>({
			query: ({ id, app }) => ({ url: `herokus/${id}/apps/${app}/restart`, method: 'POST' }),
			invalidatesTags: ['heroku-dynos', 'heroku-activity'],
		}),
		restartHerokuDyno: builder.mutation<any, { id: string; app: string; dyno: string }>({
			query: ({ id, app, dyno }) => ({
				url: `herokus/${id}/apps/${app}/dynos/${dyno}/restart`,
				method: 'POST',
			}),
			invalidatesTags: ['heroku-dynos', 'heroku-activity'],
		}),
		updateHerokuFormation: builder.mutation<any, { id: string; app: string; updates: any[] }>({
			query: ({ id, app, updates }) => ({
				url: `herokus/${id}/apps/${app}/formation`,
				method: 'PATCH',
				body: { updates },
			}),
			invalidatesTags: ['heroku-dynos', 'heroku-activity'],
		}),
		setHerokuMaintenance: builder.mutation<any, { id: string; app: string; enabled: boolean }>({
			query: ({ id, app, enabled }) => ({
				url: `herokus/${id}/apps/${app}/maintenance`,
				method: 'PATCH',
				body: { enabled },
			}),
			invalidatesTags: ['heroku-apps', 'heroku-activity'],
		}),
		renameHerokuApp: builder.mutation<any, { id: string; app: string; name: string }>({
			query: ({ id, app, name }) => ({
				url: `herokus/${id}/apps/${app}/rename`,
				method: 'PATCH',
				body: { name },
			}),
			invalidatesTags: ['heroku-apps', 'heroku-activity'],
		}),
		// `confirm` must be the app's exact name. The backend enforces that too —
		// a UI-only guard is one stray fetch away from being bypassed.
		destroyHerokuApp: builder.mutation<any, { id: string; app: string; confirm: string }>({
			query: ({ id, app, confirm }) => ({
				url: `herokus/${id}/apps/${app}`,
				method: 'DELETE',
				body: { confirm },
			}),
			invalidatesTags: ['heroku-apps', 'herokus', 'heroku-activity'],
		}),
		// `apiKey` is `edit: false` on the model, so the generic PUT rejects it —
		// this is the only route that can rotate a stored key.
		rotateHerokuKey: builder.mutation<any, { id: string; apiKey: string }>({
			query: ({ id, apiKey }) => ({
				url: `herokus/${id}/key`,
				method: 'PUT',
				body: { apiKey },
			}),
			invalidatesTags: ['herokus', 'heroku-account', 'heroku-apps'],
		}),
		// A mutation, not a query: a plain `<a href>` would not carry the auth
		// header, and a query would fire the download on mount.
		/**
		 * The same .env the download produces, returned as text for the clipboard.
		 *
		 * A separate endpoint rather than a flag on the download, because that
		 * one's `onQueryStarted` unconditionally creates a blob and clicks a link
		 * — copy and download are different side effects, and sharing one
		 * mutation would mean a copy also writing a file to disk.
		 */
		copyHerokuConfigVars: builder.mutation<string, { id: string; app: string }>({
			query: ({ id, app }) => ({
				url: `herokus/${id}/apps/${app}/config-vars/download?format=env`,
				method: 'GET',
				responseHandler: (response: any) => response.text(),
			}),
			invalidatesTags: ['heroku-activity'],
		}),
		downloadHerokuConfigVars: builder.mutation<
			any,
			{ id: string; app: string; format: 'env' | 'json' }
		>({
			query: ({ id, app, format }) => ({
				url: `herokus/${id}/apps/${app}/config-vars/download?format=${format}`,
				method: 'GET',
				responseHandler: (response: any) => response.blob(),
			}),
			onQueryStarted: async ({ app, format }, { queryFulfilled }) => {
				try {
					const result = await queryFulfilled;

					const url = window.URL.createObjectURL(result.data);
					const link = document.createElement('a');
					link.href = url;
					link.setAttribute('download', format === 'json' ? `${app}.config.json` : `${app}.env`);

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
	}),
});

export const {
	useGetHerokuAccountQuery,
	useGetHerokuAppsQuery,
	useGetHerokuAppQuery,
	useGetHerokuConfigVarsQuery,
	useGetHerokuBillingQuery,
	useGetHerokuUsageQuery,
	useGetHerokuActivityQuery,
	useGetHerokuCurrentReleaseQuery,
	useGetHerokuReleasesQuery,
	useGetHerokuBuildsQuery,
	useGetHerokuDynosQuery,
	useGetHerokuAppResourcesQuery,
	useGetHerokuLogsQuery,
	useLazyGetHerokuLogsQuery,
	useVerifyHerokuKeyMutation,
	useRotateHerokuKeyMutation,
	useUpdateHerokuConfigVarsMutation,
	useRedeployHerokuAppMutation,
	useRollbackHerokuReleaseMutation,
	useCreateHerokuBuildMutation,
	useRestartHerokuAppMutation,
	useRestartHerokuDynoMutation,
	useUpdateHerokuFormationMutation,
	useSetHerokuMaintenanceMutation,
	useRenameHerokuAppMutation,
	useDestroyHerokuAppMutation,
	useDownloadHerokuConfigVarsMutation,
	useCopyHerokuConfigVarsMutation,
} = herokuApi;

export default herokuApi;
