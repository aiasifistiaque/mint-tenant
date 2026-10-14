'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Flex } from '@chakra-ui/react';
import { Layout } from '@/components/library';
import { EmptyState, PageHeader } from '@/components/library/cl';
import { HOME, IS_TENANT_PANEL } from '@/components/library/config/lib/constants/panel';
import { useWorkspace } from '@/components/library/tenant';
import GuideLink from '@/components/library/tenant/GuideLink';
import type { ApiLogPeriod } from '@/components/library/store/services/apiBuilderApi';
import { ApiTabs, apiHref } from '../_components/shared';
import { ApiLogs } from '../_components/logs';

/**
 * API → Logs (backend docs/api-builder AB-06): every call to the project's
 * API, kept 7 days — the numbers and a chart, the commonest errors, and the
 * calls, each opening to who called, the endpoint, the error and a curl.
 * Filters come from the address (?status=errors&endpoint=…) and stay in it.
 */
function LogsView() {
	const { can, project, isLoading } = useWorkspace();
	const allowed = IS_TENANT_PANEL && can('build');
	const params = useSearchParams();
	const hours = Number(params.get('hours'));
	return (
		<Layout
			title='Logs'
			path='public-api-logs'>
			<Flex
				direction='column'
				gap={5}>
				<PageHeader
					breadcrumbs={[
						{ href: HOME, title: 'Home' },
						{ href: apiHref(), title: 'API' },
						{ href: '#', title: 'Logs' },
					]}
					title='Logs'
					meta='Every call to your API in the last 7 days — who called, what they got, and why it failed.'
					actions={allowed && <GuideLink section='api-logs' />}
				/>
				<ApiTabs />
				{!isLoading && !allowed ? (
					<EmptyState
						title='For people who build'
						description='Roles with Build read the API’s logs.'
					/>
				) : (
					project && (
						<ApiLogs
							syncUrl
							initial={{
								...([1, 24, 168].includes(hours) && { hours: hours as ApiLogPeriod }),
								status: params.get('status') || '',
								endpoint: params.get('endpoint') || '',
								who: params.get('who') || '',
								q: params.get('q') || '',
							}}
						/>
					)
				)}
			</Flex>
		</Layout>
	);
}

// useSearchParams needs a Suspense boundary for the static build.
export default function ApiLogsPage() {
	return (
		<Suspense>
			<LogsView />
		</Suspense>
	);
}
