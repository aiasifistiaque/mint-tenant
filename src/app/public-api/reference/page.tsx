'use client';

import { useEffect, useMemo, useState } from 'react';
import { Flex, Skeleton } from '@chakra-ui/react';
import { Layout } from '@/components/library';
import { EmptyState, PageHeader } from '@/components/library/cl';
import { HOME, IS_TENANT_PANEL } from '@/components/library/config/lib/constants/panel';
import { useWorkspace } from '@/components/library/tenant';
import GuideLink from '@/components/library/tenant/GuideLink';
import { useGetApiEndpointsQuery } from '@/components/library/store/services/apiBuilderApi';
import ApiReference from '../_components/ApiReference';
import ApiTester, { Trial } from '../_components/ApiTester';
import type { ApiInfo, Endpoint } from '../_components/api';
import { ApiTabs, apiBase, apiHref } from '../_components/shared';

/**
 * API → Reference (backend docs/api-builder D11): every endpoint as the live
 * API describes it (GET /public/api/<project>/) — what to send, what comes
 * back, examples — and the tester below it. "Open" goes to the endpoint's own
 * page; "Try" loads it into the tester.
 */
export default function ApiReferencePage() {
	const { project, can, isLoading: loadingSelf } = useWorkspace();
	const allowed = IS_TENANT_PANEL && can('build');
	const base = apiBase(project?.publicSlug);
	const { data } = useGetApiEndpointsQuery(undefined, { skip: !allowed || !project });

	// What the live API offers — fetched again whenever the endpoints change.
	const [info, setInfo] = useState<ApiInfo | null>(null);
	const [infoError, setInfoError] = useState('');
	const stamp = useMemo(() => JSON.stringify((data?.doc || []).map(e => [e._id, e.updatedAt, e.enabled])), [data]);
	useEffect(() => {
		if (!base || !allowed) return;
		let live = true;
		fetch(`${base}/`)
			.then(r => (r.ok ? r.json() : Promise.reject(new Error(`The API answered ${r.status}`))))
			.then(d => live && (setInfo(d), setInfoError('')))
			.catch(e => live && setInfoError(e?.message || 'Couldn’t reach the API'));
		return () => {
			live = false;
		};
	}, [base, allowed, stamp]);

	const links = useMemo(() => Object.fromEntries((data?.doc || []).map(e => [`${e.method} ${e.path}`, apiHref(`/endpoints/${e._id}`)])), [data]);
	const [trial, setTrial] = useState<Trial | null>(null);
	const tryIt = (e: Endpoint) => setTrial({ method: e.method, path: e.path, body: e.body, customer: e.customer, nonce: Date.now() });

	return (
		<Layout
			title='API reference'
			path='public-api-reference'>
			<Flex
				direction='column'
				gap={5}>
				<PageHeader
					breadcrumbs={[
						{ href: HOME, title: 'Home' },
						{ href: apiHref(), title: 'API' },
						{ href: '#', title: 'Reference' },
					]}
					title='Reference'
					meta='Every endpoint, what to send and what comes back — for whoever builds your site or app. Try any of them below.'
					actions={allowed && <GuideLink section='api-reference' />}
				/>
				<ApiTabs />
				{!loadingSelf && !allowed ? (
					<EmptyState
						title='For people who build'
						description='Roles with Build make and change the project’s API.'
					/>
				) : !project ? (
					<Skeleton h='240px' />
				) : (
					<>
						<ApiReference
							base={base}
							info={info}
							error={infoError}
							onTry={tryIt}
							links={links}
						/>
						<ApiTester
							base={base}
							trial={trial}
						/>
					</>
				)}
			</Flex>
		</Layout>
	);
}
