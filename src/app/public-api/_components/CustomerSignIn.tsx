'use client';

import { FC } from 'react';
import NextLink from 'next/link';
import { Box, Button, Flex, Text } from '@chakra-ui/react';
import { Sparkles, UserRoundCog } from 'lucide-react';
import { Panel } from '@/components/library/cl';
import { projectHref } from '@/components/library/config/lib/constants/panel';
import GuideLink from '@/components/library/tenant/GuideLink';
import type { CustomerAuth, Endpoint } from '@/components/library/store/services/apiBuilderApi';
import { AUTH_ENDPOINTS, withKey } from './api';
import { MethodBadge, apiBase, apiHref, useProjectKey } from './shared';
import Snippet from './Snippet';

/**
 * API → Endpoints → Customer sign-in (backend docs/api-builder AB-12, D15): the
 * /auth/* endpoints every project has — always on, nothing to generate —
 * where customers are kept (Login & account's model, docs/widgets W-24), and
 * how a signed-in customer's token reaches their own data: sign in, send the
 * token, call endpoints for signed-in customers (only their own records).
 */
const CustomerSignIn: FC<{ auth?: CustomerAuth; endpoints: Endpoint[]; onGenerate: () => void }> = ({ auth, endpoints, onGenerate }) => {
	const base = apiBase();
	const apiKey = useProjectKey();
	const theirs = endpoints.filter(e => e.enabled && e.access.who === 'customer');
	const sample = theirs.find(e => e.action === 'list') || theirs[0];
	const kept = !auth?.model
		? 'MINT’s Customers'
		: auth.model.accounts === 'model'
		? `your ${auth.model.title} model (it holds the accounts)`
		: `MINT’s Customers, each with a record in ${auth.model.title}`;

	return (
		<Panel
			title='Customer sign-in'
			subtitle='Built into every project and always on — sign up, sign in, their details, forgotten passwords.'
			actions={
				<>
					<GuideLink section='api-customer-sign-in' />
					<Button
						size='xs'
						variant='outline'
						asChild>
						<NextLink href={projectHref('/widgets?add=login')}>
							<UserRoundCog size={13} />
							Set up sign-in
						</NextLink>
					</Button>
				</>
			}
			flush>
			<Text
				px={4}
				pt={3}
				pb={2}
				fontSize='12.5px'
				color='fg.muted'>
				Customers are kept in {kept}
				{auth ? ` · ${auth.customers} signed up` : ''}. Set up sign-in to choose the model, its customer roles and the
				sign-in box for your site.
			</Text>
			{AUTH_ENDPOINTS.map(e => (
				<NextLink
					key={`${e.method} ${e.path}`}
					href={apiHref('/reference')}>
					<Flex
						align='center'
						gap={3}
						px={4}
						py={2.5}
						borderTopWidth='1px'
						borderColor='border.muted'
						_hover={{ bg: 'bg.subtle' }}>
						<MethodBadge method={e.method} />
						<Box
							flex={1}
							minW={0}>
							<Text
								fontSize='13px'
								fontFamily='mono'
								truncate>
								{e.path}
							</Text>
							<Text
								fontSize='12px'
								color='fg.muted'
								truncate>
								{e.summary}
								{e.customer ? ' · needs their token' : ''}
							</Text>
						</Box>
						<Text
							fontSize='11.5px'
							color='fg.subtle'
							whiteSpace='nowrap'>
							Built in
						</Text>
					</Flex>
				</NextLink>
			))}

			<Box
				id='customer-token'
				px={4}
				py={4}
				borderTopWidth='1px'
				borderColor='border.muted'>
				<Text
					fontSize='13px'
					fontWeight='600'
					mb={1}>
					Their own data, with their token
				</Text>
				<Text
					fontSize='12.5px'
					color='fg.muted'
					mb={3}>
					Sign-in answers with a token. Send it as <code>Authorization: Bearer &lt;token&gt;</code> to endpoints for{' '}
					<em>Signed-in customers</em> — with “Only their own records”, each customer gets just theirs.{' '}
					{theirs.length
						? `${theirs.length} endpoint${theirs.length === 1 ? '' : 's'} take${theirs.length === 1 ? 's' : ''} a token now.`
						: 'No endpoint takes a token yet.'}
				</Text>
				<Snippet
					label='customer token example'
					code={[
						`// 1. Sign in (or sign up: POST /auth/register with name, email, password)`,
						`const res = await fetch('${withKey(`${base}/auth/login`, apiKey)}', {`,
						`  method: 'POST',`,
						`  headers: { 'Content-Type': 'application/json' },`,
						`  body: JSON.stringify({ email, password }),`,
						`});`,
						`const { token, customer } = await res.json();`,
						`localStorage.setItem('customerToken', token); // keep it on their device`,
						``,
						`// 2. Call as them — they get only what the endpoint lets them reach`,
						`const mine = await fetch('${withKey(`${base}${sample?.path || '/<path>'}`, apiKey)}', {`,
						`  headers: { Authorization: \`Bearer \${localStorage.getItem('customerToken')}\` },`,
						`}).then(r => r.json());`,
					].join('\n')}
				/>
				<Flex
					mt={3}
					gap={2}
					align='center'
					wrap='wrap'>
					<Button
						size='xs'
						onClick={onGenerate}>
						<Sparkles size={13} />
						Generate endpoints for customers
					</Button>
					<Text
						fontSize='12px'
						color='fg.muted'>
						Using the Login widget? <code>Mint.auth.fetch('{sample?.path.replace(/^\//, '') || '<path>'}')</code> sends the token for you.
					</Text>
				</Flex>
			</Box>
		</Panel>
	);
};

export default CustomerSignIn;
