'use client';

import { FC, useEffect, useState } from 'react';
import NextLink from 'next/link';
import { Badge, Box, Button, Checkbox, Flex, Skeleton, Switch, Text } from '@chakra-ui/react';
import { Copy, ExternalLink, Users } from 'lucide-react';
import { Layout, useGetBuiltModelsQuery, useUpdatePublicApiMutation } from '@/components/library';
import { Dropdown, Panel } from '@/components/library/cl';
import { BACKEND, pagePath } from '@/components/library/config/lib/constants/panel';
import { useWorkspace } from '@/components/library/tenant';
import GuideLink from '@/components/library/tenant/GuideLink';
import type { PublicApi } from '@/components/library/store/services/tenantApi';
import ApiReference from './_components/ApiReference';
import ApiTester, { Trial } from './_components/ApiTester';
import ReadOnlyFields from './_components/ReadOnlyFields';
import type { ApiInfo, Endpoint } from './_components/api';

/**
 * The project's public API (tenant panel; backend routes-public): which models
 * the tenant's own site or app can read and write, whether that needs a
 * signed-in customer, which fields only the team sets (read-only), and the snippets — the login widget and, for a website,
 * the analytics tracker. Building permission (`build`) changes them. Below
 * them, the API reference (from what the live API says it offers) and a tester
 * that sends real requests to it.
 */

const ACTIONS: { value: PublicApi['actions'][number]; label: string; method: string }[] = [
	{ value: 'list', label: 'List', method: 'GET /<route>' },
	{ value: 'get', label: 'Read one', method: 'GET /<route>/:id' },
	{ value: 'create', label: 'Create', method: 'POST /<route>' },
	{ value: 'update', label: 'Update', method: 'PUT /<route>/:id' },
	{ value: 'delete', label: 'Delete', method: 'DELETE /<route>/:id' },
];

const OFF: PublicApi = { enabled: false, actions: [], auth: 'none', ownerOnly: false, readOnlyFields: [] };

/** The API's public address: the backend's root, without /tenant/api. */
const publicBase = () => BACKEND.replace(/\/tenant\/api\/?$/, '');

const Snippet: FC<{ code: string; label: string }> = ({ code, label }) => {
	const [copied, setCopied] = useState(false);
	return (
		<Box
			position='relative'
			borderWidth='1px'
			borderColor='border'
			borderRadius='md'
			bg='bg.subtle'>
			<Box
				as='pre'
				m={0}
				p={3}
				pr={12}
				fontSize='12px'
				fontFamily='mono'
				whiteSpace='pre-wrap'
				wordBreak='break-all'
				aria-label={label}>
				{code}
			</Box>
			<Button
				position='absolute'
				top={1.5}
				right={1.5}
				size='xs'
				variant='ghost'
				aria-label={`Copy ${label}`}
				onClick={() => {
					navigator.clipboard?.writeText(code);
					setCopied(true);
					setTimeout(() => setCopied(false), 1500);
				}}>
				{copied ? 'Copied' : <Copy size={14} />}
			</Button>
		</Box>
	);
};

const ModelRow: FC<{ model: any; base: string; editable: boolean }> = ({ model, base, editable }) => {
	const [update, { isLoading, error }] = useUpdatePublicApiMutation();
	const saved: PublicApi = { ...OFF, ...(model.publicApi || {}), actions: model.publicApi?.actions || [], readOnlyFields: model.publicApi?.readOnlyFields || [] };
	const [api, setApi] = useState<PublicApi>(saved);
	useEffect(() => setApi(saved), [JSON.stringify(model.publicApi || {})]);

	const save = (next: PublicApi) => {
		setApi(next);
		// Turning it on with nothing chosen starts with reading.
		const body = next.enabled && !next.actions.length ? { ...next, actions: ['list', 'get'] as PublicApi['actions'] } : next;
		// Refused (a read-only field with no default, say): back to what's saved; the message stays below.
		update({ id: model._id, ...body })
			.unwrap()
			.catch(() => setApi(saved));
	};
	const toggleAction = (a: PublicApi['actions'][number]) =>
		save({ ...api, actions: api.actions.includes(a) ? api.actions.filter(x => x !== a) : [...api.actions, a] });

	return (
		<Box
			px={4}
			py={3.5}
			borderTopWidth='1px'
			borderColor='border.muted'
			_first={{ borderTopWidth: 0 }}>
			<Flex
				align='center'
				gap={3}
				wrap='wrap'>
				<Box
					minW={0}
					flex={1}>
					<Flex
						align='center'
						gap={2}>
						<Text
							fontSize='13.5px'
							fontWeight='600'>
							{model.title}
						</Text>
						{api.enabled && (
							<Badge
								size='sm'
								colorPalette={api.auth === 'customer' ? 'blue' : 'green'}>
								{api.auth === 'customer' ? (api.ownerOnly ? 'Customers · own records' : 'Customers') : 'Open'}
							</Badge>
						)}
					</Flex>
					<Text
						fontSize='12px'
						color='fg.muted'
						fontFamily='mono'
						truncate>
						{api.enabled ? `${base}/${model.route}` : `/${model.route} — not public`}
					</Text>
				</Box>
				<Switch.Root
					size='sm'
					checked={api.enabled}
					disabled={!editable || isLoading}
					onCheckedChange={e => save({ ...api, enabled: !!e.checked })}>
					<Switch.HiddenInput aria-label={`Public API for ${model.title}`} />
					<Switch.Control />
					<Switch.Label fontSize='12.5px'>Public</Switch.Label>
				</Switch.Root>
			</Flex>

			{api.enabled && (
				<Flex
					mt={3}
					gap={4}
					wrap='wrap'
					align='center'>
					<Flex
						gap={3}
						wrap='wrap'>
						{ACTIONS.map(a => (
							<Checkbox.Root
								key={a.value}
								size='sm'
								checked={api.actions.includes(a.value)}
								disabled={!editable || isLoading}
								onCheckedChange={() => toggleAction(a.value)}
								title={a.method}>
								<Checkbox.HiddenInput />
								<Checkbox.Control />
								<Checkbox.Label fontSize='12.5px'>{a.label}</Checkbox.Label>
							</Checkbox.Root>
						))}
					</Flex>
					<Box w='200px'>
						<Dropdown
							size='sm'
							value={api.auth === 'customer' ? (api.ownerOnly ? 'own' : 'customer') : 'none'}
							disabled={!editable || isLoading}
							onChange={v => save({ ...api, auth: v === 'none' ? 'none' : 'customer', ownerOnly: v === 'own' })}
							items={[
								{ value: 'none', label: 'Anyone' },
								{ value: 'customer', label: 'Signed-in customers' },
								{ value: 'own', label: 'Customers — own records only' },
							]}
						/>
					</Box>
				</Flex>
			)}
			{api.enabled && (api.actions.includes('create') || api.actions.includes('update')) && (
				<ReadOnlyFields
					fields={model.fields || []}
					value={api.readOnlyFields || []}
					disabled={!editable || isLoading}
					onChange={readOnlyFields => save({ ...api, readOnlyFields })}
				/>
			)}
			{error && (
				<Text
					mt={2}
					fontSize='12.5px'
					color='red.fg'>
					{(error as any)?.data?.message || 'Couldn’t save — try again.'}
				</Text>
			)}
		</Box>
	);
};

export default function PublicApiPage() {
	const { project, can } = useWorkspace();
	const { data, isLoading } = useGetBuiltModelsQuery();
	const models: any[] = data?.doc || data || [];
	const editable = can('build');
	const origin = publicBase();
	const base = project ? `${origin}/public/api/${project.publicSlug}` : '';

	// What the live API offers — fetched again whenever a model's switches change.
	const [info, setInfo] = useState<ApiInfo | null>(null);
	const [infoError, setInfoError] = useState('');
	const offered = JSON.stringify(models.map(m => [m.route, m.publicApi || null]));
	useEffect(() => {
		if (!base) return;
		let live = true;
		fetch(`${base}/`)
			.then(r => (r.ok ? r.json() : Promise.reject(new Error(`The API answered ${r.status}`))))
			.then(data => live && (setInfo(data), setInfoError('')))
			.catch(e => live && setInfoError(e?.message || 'Couldn’t reach the API'));
		return () => {
			live = false;
		};
	}, [base, offered]);

	const [trial, setTrial] = useState<Trial | null>(null);
	const tryIt = (e: Endpoint) => setTrial({ method: e.method, path: e.path, body: e.body, customer: e.customer, nonce: Date.now() });

	return (
		<Layout
			title='Public API'
			path='public-api'>
			<Flex
				direction='column'
				gap={4}
				pt={2}>
				<Panel
					title='Models'
					subtitle='What your site or app can read and write. Only a model’s own fields go in and out.'
					actions={<GuideLink section='public-api' />}
					flush>
					{isLoading ? (
						<Box p={4}>
							<Skeleton h='120px' />
						</Box>
					) : models.length ? (
						models.map(m => (
							<ModelRow
								key={m._id}
								model={m}
								base={base}
								editable={editable}
							/>
						))
					) : (
						<Text
							p={4}
							fontSize='13px'
							color='fg.muted'>
							No models yet — build one, then choose what’s public here.
						</Text>
					)}
				</Panel>

				{project && (
					<ApiReference
						base={base}
						info={info}
						error={infoError}
						onTry={tryIt}
					/>
				)}
				{project && (
					<ApiTester
						base={base}
						trial={trial}
					/>
				)}

				{project && (
					<Panel
						title='Use it'
						subtitle='From any site or app — no key needed for open models.'
						actions={
							<Button
								size='xs'
								variant='ghost'
								asChild>
								<NextLink href={pagePath('customers')}>
									<Users size={14} />
									Customers
								</NextLink>
							</Button>
						}>
						<Flex
							direction='column'
							gap={4}>
							<Box>
								<Text {...hCss}>Read a model</Text>
								<Snippet
									label='fetch example'
									code={`const res = await fetch('${base}/${models.find(m => m.publicApi?.enabled)?.route || '<route>'}?limit=20');\nconst { doc, total } = await res.json();`}
								/>
							</Box>
							<Box>
								<Text {...hCss}>Sign-in for your customers</Text>
								<Text {...pCss}>
									Drop this where the sign-in should show. Afterwards <code>MintAuth.fetch('&lt;route&gt;')</code> calls the API as the signed-in
									customer.
								</Text>
								<Snippet
									label='login widget snippet'
									code={`<script src="${origin}/public/widget.js" data-project="${project.publicSlug}" async></script>\n<div data-mint-login></div>`}
								/>
							</Box>
							{project.type === 'website' && (
								<Box>
									<Text {...hCss}>Analytics</Text>
									<Text {...pCss}>
										Add to every page. Visits from {project.domains?.length ? project.domains.join(', ') : 'any site (add your domains to the project)'} are counted.
									</Text>
									<Snippet
										label='analytics snippet'
										code={`<script src="${origin}/public/track.js" data-project="${project.publicSlug}" defer></script>`}
									/>
								</Box>
							)}
							{project.type === 'website' && (
								<Box>
									<Text {...hCss}>Render a page</Text>
									<Snippet
										label='site API example'
										code={`// settings + menu\nawait fetch('${base}/site').then(r => r.json());\n// a published page, its SEO and its contents\nawait fetch('${base}/pages/by-path?path=/about').then(r => r.json());`}
									/>
								</Box>
							)}
							<Button
								alignSelf='flex-start'
								size='xs'
								variant='ghost'
								color='fg.muted'
								asChild>
								<a
									href={`${base}/`}
									target='_blank'
									rel='noreferrer'>
									What the API offers
									<ExternalLink size={12} />
								</a>
							</Button>
						</Flex>
					</Panel>
				)}
			</Flex>
		</Layout>
	);
}

const hCss: any = { fontSize: '13px', fontWeight: '600', mb: 1.5 };
const pCss: any = { fontSize: '12.5px', color: 'fg.muted', mb: 2 };
