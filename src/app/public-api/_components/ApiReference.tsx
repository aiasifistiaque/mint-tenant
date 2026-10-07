'use client';

import { FC, ReactNode, useState } from 'react';
import { Badge, Box, Button, Flex, Text } from '@chakra-ui/react';
import { ChevronDown, ChevronRight, Lock, Play } from 'lucide-react';
import { CopyValue, Panel } from '@/components/library/cl';
import GuideLink from '@/components/library/tenant/GuideLink';
import ExampleRequest from './ExampleRequest';
import {
	AUTH_ENDPOINTS,
	ApiInfo,
	ApiModel,
	DATE_VALUES,
	Endpoint,
	FILTER_OPS,
	LIST_PARAMS,
	METHOD_TONE,
	SITE_ENDPOINTS,
	endpointsOf,
	exampleRecord,
	filtersOf,
	listExamples,
	sendable,
} from './api';

/**
 * Every endpoint of the project's public API, generated from what the API
 * says it offers (so it always matches the switches above): parameters, body
 * fields, an example response, and "Try" to load it into the tester. Above
 * the models, how every list pages, sorts and filters; each list endpoint
 * then shows its own fields' filters and ready-made example requests.
 */

const json = (v: any) => JSON.stringify(v, null, 2);

const Code: FC<{ children: string }> = ({ children }) => (
	<Box
		as='pre'
		m={0}
		p={3}
		fontSize='12px'
		fontFamily='mono'
		bg='bg.subtle'
		borderWidth='1px'
		borderColor='border.muted'
		borderRadius='md'
		overflowX='auto'
		whiteSpace='pre'>
		{children}
	</Box>
);

const Label: FC<{ children: ReactNode }> = ({ children }) => (
	<Text
		fontSize='11.5px'
		fontWeight='600'
		color='fg.muted'
		textTransform='uppercase'
		letterSpacing='0.04em'
		mb={1.5}>
		{children}
	</Text>
);

/**
 * Rows of name · kind · notes (the first column in code type; the last takes
 * the rest of the row). On a phone the last column drops under the others.
 */
const Params: FC<{ rows: ReactNode[][]; widths?: string[]; head?: string[] }> = ({ rows, widths = ['120px', '80px'], head }) => {
	const last = (i: number, n: number) => i === n - 1;
	const width = (i: number, n: number) => (last(i, n) ? { flex: { base: '1 1 100%', md: 1 }, minW: 0 } : { w: widths[i], flexShrink: 0 });
	return (
		<Box
			borderWidth='1px'
			borderColor='border.muted'
			borderRadius='md'
			overflow='hidden'
			fontSize='12.5px'>
			{head && (
				<Flex
					display={{ base: 'none', md: 'flex' }}
					gap={3}
					px={3}
					py={1.5}
					bg='bg.subtle'
					fontSize='11.5px'
					fontWeight='600'
					color='fg.muted'>
					{head.map((h, i) => (
						<Text
							key={h}
							{...width(i, head.length)}>
							{h}
						</Text>
					))}
				</Flex>
			)}
			{rows.map((cells, r) => (
				<Flex
					key={r}
					wrap={{ base: 'wrap', md: 'nowrap' }}
					columnGap={3}
					rowGap={0.5}
					px={3}
					py={1.5}
					borderTopWidth={head || r ? '1px' : 0}
					borderColor='border.muted'>
					{cells.map((cell, i) => (
						<Box
							key={i}
							fontFamily={i === 0 ? 'mono' : undefined}
							color={i === 0 ? undefined : 'fg.muted'}
							wordBreak={i === 0 || last(i, cells.length) ? 'break-word' : undefined}
							{...width(i, cells.length)}>
							{cell}
						</Box>
					))}
				</Flex>
			))}
		</Box>
	);
};

const Mono: FC<{ children: ReactNode }> = ({ children }) => (
	<Box
		as='code'
		fontFamily='mono'
		fontSize='12px'
		color='fg'>
		{children}
	</Box>
);

export const MethodBadge: FC<{ method: Endpoint['method'] }> = ({ method }) => (
	<Badge
		size='sm'
		variant='subtle'
		colorPalette={METHOD_TONE[method]}
		fontFamily='mono'
		minW='54px'
		justifyContent='center'>
		{method}
	</Badge>
);

/** What an endpoint takes and returns. */
const details = (e: Endpoint, model: ApiModel | undefined, onTry: (e: Endpoint) => void, base: string): ReactNode => {
	const parts: ReactNode[] = [
		<Box key='example'>
			<Label>Example request</Label>
			<ExampleRequest
				base={base}
				e={e}
			/>
		</Box>,
	];
	if (model && e.method === 'GET' && !e.path.endsWith(':id')) {
		const filters = filtersOf(model);
		const label = (key: string) => model.fields.find(f => f.key === key)?.label || { createdAt: 'Created', updatedAt: 'Last changed' }[key] || key;
		const options = (key: string) => model.fields.find(f => f.key === key)?.options;
		parts.push(
			<Box key='q'>
				<Label>Paging, sorting and search</Label>
				<Params
					rows={[
						['page', 'number', 'Which page, from 1 (default 1)'],
						['limit', 'number', '1–100 per page (default 20)'],
						[
							'sort',
							'fields',
							<>
								Up to three, comma-separated, <Mono>-</Mono> for descending. Default <Mono>-createdAt</Mono>. Sortable:{' '}
								<Mono>{(model.sort || [...model.fields.map(f => f.key), 'createdAt', 'updatedAt']).join(', ')}</Mono>
							</>,
						],
						...(model.search?.length
							? [['search', 'text', <>Any of <Mono>{model.search.join(', ')}</Mono> contains the words, any case</>]]
							: []),
						['fields', 'fields', <>Only these in each record, plus <Mono>_id</Mono>: <Mono>fields={model.fields.slice(0, 2).map(f => f.key).join(',') || 'name'}</Mono></>],
					]}
				/>
			</Box>,
			<Box key='f'>
				<Label>Filters</Label>
				<Params
					head={['Parameter', 'Kind', 'Works as']}
					widths={['150px', '80px']}
					rows={filters.map(f => [
						f.key,
						f.kind,
						<>
							<Mono>
								{f.ops.map(o => (o === 'eq' ? f.key : `${f.key}_${o}`)).join(' · ')}
							</Mono>
							<Text
								as='span'
								display='block'
								fontSize='12px'
								color='fg.muted'
								mt={0.5}>
								{label(f.key)}
								{options(f.key)?.length ? ` — one of: ${options(f.key)!.join(', ')}` : ''}
								{f.kind === 'reference' || f.kind === 'references' ? ' — the linked record’s _id' : ''}
								{f.kind === 'date' ? ' — a day, a moment, or today, week, month, year, days_30' : ''}
								{f.kind === 'boolean' ? ' — true or false' : ''}
							</Text>
						</>,
					])}
				/>
				<Text
					fontSize='12px'
					color='fg.muted'
					mt={1.5}>
					Every filter you add must match. Names the API doesn’t know are ignored; a value it can’t read answers 400 with the
					reason.
				</Text>
			</Box>,
			<Box key='x'>
				<Label>Examples</Label>
				<Box
					borderWidth='1px'
					borderColor='border.muted'
					borderRadius='md'
					overflow='hidden'>
					{listExamples(model).map(x => (
						<Flex
							key={x.path}
							align='center'
							gap={3}
							px={3}
							py={1.5}
							borderTopWidth='1px'
							borderColor='border.muted'
							_first={{ borderTopWidth: 0 }}
							wrap={{ base: 'wrap', md: 'nowrap' }}>
							<Text
								fontFamily='mono'
								fontSize='12px'
								wordBreak='break-all'
								flex={{ base: '1 1 100%', md: '0 1 auto' }}>
								GET {x.path}
							</Text>
							<Text
								fontSize='12px'
								color='fg.muted'
								flex={1}>
								{x.note}
							</Text>
							<Button
								size='2xs'
								variant='ghost'
								onClick={() => onTry({ method: 'GET', path: x.path, summary: x.note, customer: e.customer })}>
								<Play size={11} />
								Try
							</Button>
						</Flex>
					))}
				</Box>
			</Box>
		);
	}
	if (model && (e.method === 'POST' || e.method === 'PUT')) {
		const readOnly = model.fields.filter(f => !sendable(f) && f.kind !== 'formula');
		parts.push(
			<Box key='b'>
				<Label>Body (JSON)</Label>
				<Params
					rows={model.fields
						.filter(sendable)
						.map(f => [
							f.key,
							f.kind,
							[e.method === 'POST' && f.required ? 'Required' : '', f.options?.length ? `One of: ${f.options.join(', ')}` : '', f.kind === 'reference' ? 'The linked record’s _id' : '']
								.filter(Boolean)
								.join(' · ') || f.label,
						])}
				/>
				<Text
					fontSize='12px'
					color='fg.muted'
					mt={1.5}>
					Other keys are ignored. Calculated fields are worked out by the server.
					{readOnly.length > 0 && (
						<>
							{' '}
							Read-only — set by the business, never by the API (sent, they’re ignored{e.method === 'POST' ? '; a new record gets their default' : ''}):{' '}
							<Mono>{readOnly.map(f => f.key).join(', ')}</Mono>.
						</>
					)}
				</Text>
			</Box>
		);
	}
	if (!model && e.body)
		parts.push(
			<Box key='b'>
				<Label>Body (JSON)</Label>
				<Code>{json(e.body)}</Code>
			</Box>
		);
	let response: any = null;
	if (model) {
		const record = exampleRecord(model);
		response =
			e.method === 'DELETE'
				? { message: 'Deleted' }
				: e.method === 'GET' && !e.path.endsWith(':id')
				? { doc: [record], total: 1, page: 1, limit: 20, totalPages: 1 }
				: record;
	} else if (e.path.startsWith('/auth/')) {
		const customer = { _id: '66f0c1d2e3a4b5c6d7e8f902', name: 'Ada Lovelace', email: 'ada@example.com', phone: '', createdAt: '2026-10-02T09:30:00.000Z' };
		response = e.path === '/auth/logout-everywhere' ? { message: 'Signed out everywhere' } : e.method === 'POST' ? { token: '<customer token>', customer } : customer;
	}
	if (response)
		parts.push(
			<Box key='r'>
				<Label>{e.method === 'POST' && model ? 'Response · 201' : 'Response · 200'}</Label>
				<Code>{json(response)}</Code>
				{model && e.method === 'GET' && !e.path.endsWith(':id') && (
					<Text
						fontSize='12px'
						color='fg.muted'
						mt={1.5}>
						<Mono>doc</Mono> is this page’s records, <Mono>total</Mono> how many match the filters on every page,{' '}
						<Mono>totalPages</Mono> how many pages there are at this <Mono>limit</Mono> — there’s another page while{' '}
						<Mono>page &lt; totalPages</Mono>.
					</Text>
				)}
			</Box>
		);
	return parts;
};

const EndpointRow: FC<{ e: Endpoint; base: string; model?: ApiModel; onTry: (e: Endpoint) => void }> = ({ e, base, model, onTry }) => {
	const [open, setOpen] = useState(false);
	const body = details(e, model, onTry, base);
	const hasDetails = Array.isArray(body) && body.length > 0;
	return (
		<Box
			borderTopWidth='1px'
			borderColor='border.muted'>
			<Flex
				align='center'
				gap={3}
				px={4}
				py={2}
				cursor={hasDetails ? 'pointer' : 'default'}
				_hover={{ bg: 'bg.subtle' }}
				onClick={() => hasDetails && setOpen(o => !o)}>
				<Box
					color='fg.muted'
					w='14px'>
					{hasDetails && (open ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
				</Box>
				<MethodBadge method={e.method} />
				<Text
					fontFamily='mono'
					fontSize='12.5px'
					truncate>
					{e.path}
				</Text>
				<Text
					fontSize='12.5px'
					color='fg.muted'
					flex={1}
					truncate
					display={{ base: 'none', md: 'block' }}>
					{e.summary}
				</Text>
				{e.customer && (
					<Flex
						align='center'
						gap={1}
						fontSize='11.5px'
						color='fg.muted'
						title='Needs a signed-in customer: Authorization: Bearer <token>'>
						<Lock size={12} />
						<Text display={{ base: 'none', sm: 'block' }}>Customer</Text>
					</Flex>
				)}
				<Button
					size='2xs'
					variant='outline'
					onClick={ev => {
						ev.stopPropagation();
						onTry(e);
					}}>
					<Play size={11} />
					Try
				</Button>
			</Flex>
			{open && (
				<Flex
					direction='column'
					gap={3}
					px={4}
					pb={4}
					pl={{ base: 4, md: '52px' }}>
					{body}
				</Flex>
			)}
		</Box>
	);
};

const Group: FC<{ title: string; note?: ReactNode; children: ReactNode }> = ({ title, note, children }) => (
	<Box
		borderTopWidth='1px'
		borderColor='border'>
		<Flex
			align='baseline'
			gap={2}
			px={4}
			pt={3.5}
			pb={2}
			wrap='wrap'>
			<Text
				fontSize='13.5px'
				fontWeight='600'>
				{title}
			</Text>
			{note && (
				<Text
					fontSize='12px'
					color='fg.muted'>
					{note}
				</Text>
			)}
		</Flex>
		{children}
	</Box>
);

/** How every list pages, sorts and filters — the same for each model; each list endpoint shows its own fields. */
const ListsGuide: FC = () => {
	const [open, setOpen] = useState(true);
	return (
		<Box
			borderTopWidth='1px'
			borderColor='border'>
			<Flex
				align='center'
				gap={2}
				px={4}
				pt={3.5}
				pb={open ? 2 : 3.5}
				cursor='pointer'
				onClick={() => setOpen(o => !o)}
				wrap='wrap'>
				<Box color='fg.muted'>{open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</Box>
				<Text
					fontSize='13.5px'
					fontWeight='600'>
					Lists: paging, sorting and filters
				</Text>
				<Text
					fontSize='12px'
					color='fg.muted'
					flex={{ base: '1 1 100%', md: 1 }}
					order={{ base: 3, md: 0 }}
					pl={{ base: '22px', md: 0 }}>
					The same on every model’s list — open a list endpoint below for its own fields and examples
				</Text>
				<Box onClick={ev => ev.stopPropagation()}>
					<GuideLink
						section='filters'
						label='Filters guide'
					/>
				</Box>
			</Flex>
			{open && (
				<Flex
					direction='column'
					gap={3}
					px={4}
					pb={4}>
					<Box>
						<Label>Query parameters</Label>
						<Params
							widths={['120px', '60px']}
							rows={LIST_PARAMS}
						/>
					</Box>
					<Box>
						<Label>Operators — add to a field’s name</Label>
						<Params
							head={['Operator', 'Example', 'Does']}
							widths={['100px', '210px']}
							rows={FILTER_OPS.map(o => [
								o.op,
								<Mono key='x'>{o.example}</Mono>,
								<>
									{o.does}
									<Text
										as='span'
										display='block'
										fontSize='11.5px'
										color='fg.subtle'>
										On: {o.on}
									</Text>
								</>,
							])}
						/>
					</Box>
					<Text
						fontSize='12.5px'
						color='fg.muted'
						lineHeight='1.6'>
						<strong>Dates</strong> take {DATE_VALUES}. Every list also filters by <Mono>createdAt</Mono> and{' '}
						<Mono>updatedAt</Mono>. Several filters all have to match; to match any of several values, use <Mono>_in</Mono> or
						repeat the name. Encode values in the address (<Mono>encodeURIComponent</Mono> or <Mono>URLSearchParams</Mono>).
					</Text>
				</Flex>
			)}
		</Box>
	);
};

const ApiReference: FC<{ base: string; info: ApiInfo | null; error?: string; onTry: (e: Endpoint) => void }> = ({ base, info, error, onTry }) => {
	const models = info?.models || [];
	const customers = models.some(m => m.auth === 'customer');
	return (
		<Panel
			title='API reference'
			subtitle='Every endpoint your site or app can call — it follows the switches above.'
			actions={<GuideLink section='reference' />}
			flush>
			<Flex
				direction='column'
				gap={3}
				p={4}>
				<Box>
					<Label>Base address</Label>
					<CopyValue value={base} />
				</Box>
				<Text
					fontSize='12.5px'
					color='fg.muted'
					lineHeight='1.6'>
					Requests and responses are JSON. An error answers with a status and <code>{'{ "message": "…" }'}</code>: 400 a value
					isn’t valid, 401 the endpoint needs a signed-in customer, 404 not found (or not public), 429 too many requests — wait a
					moment. Endpoints marked <em>Customer</em> need <code>Authorization: Bearer &lt;token&gt;</code>, the token from sign-in.
					{models.some(m => m.ownerOnly) && ' On “own records” models each customer only reaches the records they created.'}
					{models.some(m => m.fields.some(f => f.readOnly && f.kind !== 'formula')) &&
						' Read-only fields (an order’s status, a payment reference) are set by your team, never by a request: sent, they’re ignored.'}
				</Text>
			</Flex>

			{error && (
				<Text
					px={4}
					pb={4}
					fontSize='12.5px'
					color='red.fg'>
					{error}
				</Text>
			)}

			{models.some(m => m.actions.includes('list')) && <ListsGuide />}

			{models.map(m => (
				<Group
					key={m.route}
					title={m.title}
					note={`${m.auth === 'customer' ? (m.ownerOnly ? 'Signed-in customers · own records' : 'Signed-in customers') : 'Open to anyone'}${m.note ? ` — ${m.note}` : ''}`}>
					{endpointsOf(m).map(e => (
						<EndpointRow
							key={`${e.method} ${e.path}`}
							e={e}
							base={base}
							model={m}
							onTry={onTry}
						/>
					))}
				</Group>
			))}

			{info && !models.length && (
				<Text
					px={4}
					pb={4}
					fontSize='13px'
					color='fg.muted'>
					No public models yet — switch one on above and its endpoints show here.
				</Text>
			)}

			<Group
				title='Customer sign-in'
				note={customers ? 'For the models marked Customer' : 'For models open to signed-in customers'}>
				{AUTH_ENDPOINTS.map(e => (
					<EndpointRow
						key={`${e.method} ${e.path}`}
						e={e}
						base={base}
						onTry={onTry}
					/>
				))}
			</Group>

			{info?.type === 'website' && (
				<Group
					title='Website'
					note='Settings, menu and published pages'>
					{SITE_ENDPOINTS.map(e => (
						<EndpointRow
							key={`${e.method} ${e.path}`}
							e={e}
							base={base}
							onTry={onTry}
						/>
					))}
				</Group>
			)}
		</Panel>
	);
};

export default ApiReference;
