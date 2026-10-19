'use client';

import { FC, ReactNode, useState } from 'react';
import { Box, Button, Flex, Text } from '@chakra-ui/react';
import { Copy } from 'lucide-react';
import { Panel } from '@/components/library/cl';
import GuideLink from '@/components/library/tenant/GuideLink';
import type { ApiModel as BuilderModel, Endpoint } from '@/components/library/store/services/apiBuilderApi';
import { ApiModel, exampleOf, exampleRecord, withKey } from './api';
import { useProjectKey } from './shared';

/**
 * One endpoint's reference (its page's Reference tab): what a call sends —
 * address, headers, body — and what it answers, as JSON, worked out from the
 * endpoint as drafted (its fields out, the fields it writes, its page size).
 * The samples follow the backend's answers (routes-public/public.router.ts:
 * list, getOne, create, update, remove, and TenancyError's `{ message, code }`).
 */

const NO_FIELDS = new Set(['section', 'sectionlist']);
const ID = '66f0c1d2e3a4b5c6d7e8f901';
const json = (v: any) => JSON.stringify(v, null, 2);

type Draft = Pick<Endpoint, 'access' | 'fields' | 'list'>;

/** A titled block of JSON with a copy button. */
const JsonBlock: FC<{ label: ReactNode; value: any }> = ({ label, value }) => {
	const [copied, setCopied] = useState(false);
	const text = typeof value === 'string' ? value : json(value);
	return (
		<Box
			borderWidth='1px'
			borderColor='border'
			borderRadius='md'
			bg='bg.subtle'
			overflow='hidden'>
			<Flex
				align='center'
				gap={2}
				px={3}
				py={1}
				borderBottomWidth='1px'
				borderColor='border.muted'>
				<Text
					fontSize='11.5px'
					fontWeight='600'
					color='fg.muted'
					textTransform='uppercase'
					letterSpacing='0.04em'>
					{label}
				</Text>
				<Box flex={1} />
				<Button
					size='2xs'
					variant='ghost'
					aria-label='Copy the JSON'
					onClick={() => {
						navigator.clipboard?.writeText(text);
						setCopied(true);
						setTimeout(() => setCopied(false), 1500);
					}}>
					{copied ? 'Copied' : <Copy size={12} />}
				</Button>
			</Flex>
			<Box
				as='pre'
				m={0}
				p={3}
				fontSize='12px'
				fontFamily='mono'
				overflowX='auto'
				whiteSpace='pre'>
				{text}
			</Box>
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

const Note: FC<{ children: ReactNode }> = ({ children }) => (
	<Text
		fontSize='12px'
		color='fg.muted'
		mt={1.5}>
		{children}
	</Text>
);

const EndpointReference: FC<{ endpoint: Endpoint; draft: Draft; model: BuilderModel; base: string; dirty?: boolean }> = ({
	endpoint,
	draft,
	model,
	base,
	dirty,
}) => {
	const { action, method } = endpoint;
	const path = endpoint.path;
	const writes = action === 'create' || action === 'update';
	const who = draft.access.who;
	const fields = model.fields.filter(f => !NO_FIELDS.has(f.kind));
	const readOnly = new Set(draft.fields.readOnly);
	const written = (key: string) => !readOnly.has(key) && (!draft.fields.write || draft.fields.write.includes(key));

	// The endpoint as the shared example helpers read a model: options as values, what goes out, what it writes.
	const asModel: ApiModel = {
		route: model.route,
		title: model.title,
		actions: [action],
		auth: who === 'customer' ? 'customer' : 'none',
		ownerOnly: false,
		fields: fields.map(f => ({
			key: f.key,
			label: f.label,
			kind: f.kind,
			required: f.required,
			options: f.options?.map(o => o.value),
			out: !draft.fields.out || draft.fields.out.includes(f.key),
			readOnly: writes ? !written(f.key) : undefined,
		})),
		...(model.drafts && { drafts: { param: 'status' as const } }),
		...(model.single && { single: true }),
	};

	const sendable = asModel.fields.filter(f => f.kind !== 'formula' && !f.readOnly);
	const body = writes ? Object.fromEntries(sendable.map(f => [f.key, exampleOf(f)])) : null;
	const required = action === 'create' ? sendable.filter(f => f.required) : [];
	const ignored = writes ? asModel.fields.filter(f => f.readOnly && f.kind !== 'formula') : [];

	const headers: Record<string, string> = {
		...(writes && { 'Content-Type': 'application/json' }),
		...(who === 'customer' && { Authorization: 'Bearer <customer token>' }),
		...(who === 'key' && { Authorization: 'Bearer <server key>' }),
	};
	// Every call carries the project key (backend docs/api-builder D14).
	const apiKey = useProjectKey();
	const url = withKey(`${base}${path.replace(':id', ID)}${action === 'list' && !model.single ? `?page=1&limit=${draft.list.limit}` : ''}`, apiKey);

	const record = exampleRecord(asModel);
	const list = action === 'list' && !model.single;
	const response =
		action === 'delete' ? { message: 'Deleted' } : list ? { doc: [record], total: 1, page: 1, limit: draft.list.limit, totalPages: 1 } : record;
	const status = action === 'create' ? '201 Created' : '200 OK';

	// What this endpoint can answer instead, with the backend's own words.
	const errors: [string, any][] = [
		...(writes
			? [
					[
						'400 Bad request',
						{
							message: required.length
								? `${required[0].label} is required`
								: sendable.length
								? `${sendable[0].key} isn’t valid`
								: 'A record with that value already exists',
						},
					] as [string, any],
			  ]
			: []),
		['401 No project key', { message: 'The apiKey is missing — add ?apiKey=<your project key>. It’s on API → Keys in your project.', code: 'api_key_missing' }],
		['401 Wrong project key', { message: 'That apiKey isn’t valid — it may have been regenerated. Copy the project key from API → Keys.', code: 'api_key_invalid' }],
		...(who === 'customer' ? [['401 Unauthorized', { message: 'Sign in first.', code: 'customer_required' }] as [string, any]] : []),
		...(who === 'key' ? [['401 Unauthorized', { message: 'This endpoint needs a server key.', code: 'key_required' }] as [string, any]] : []),
		...(action === 'create' && draft.access.when.length
			? [['403 Forbidden', { message: 'This endpoint only creates records where …', code: 'rule_failed' }] as [string, any]]
			: []),
		...(action !== 'create' && (action !== 'list' || model.single) ? [['404 Not found', { message: 'Not found' }] as [string, any]] : []),
		['429 Too many requests', { message: 'Too many attempts — wait a little and try again.', code: 'rate_limited' }],
	];

	return (
		<Flex
			direction='column'
			gap={4}>
			{dirty && (
				<Text
					fontSize='12.5px'
					color='orange.fg'>
					This shows your unsaved changes — the live API answers as saved until you Save.
				</Text>
			)}
			<Panel
				title='Request'
				subtitle={writes ? 'What a call sends.' : 'What a call sends — no body.'}
				actions={<GuideLink section='api-reference' />}>
				<Flex
					direction='column'
					gap={3}>
					<Text
						fontFamily='mono'
						fontSize='12.5px'
						wordBreak='break-all'>
						<Text
							as='span'
							fontWeight='600'
							fontSize='inherit'>
							{method}
						</Text>{' '}
						{url}
					</Text>
					{path.includes(':id') && (
						<Text
							fontSize='12.5px'
							color='fg.muted'>
							<Mono>:id</Mono> is the record’s <Mono>_id</Mono>.
						</Text>
					)}
					{list && (
						<Text
							fontSize='12.5px'
							color='fg.muted'>
							Every query parameter is optional — <Mono>page</Mono>, <Mono>limit</Mono> (up to {draft.list.maxLimit}), <Mono>fields</Mono>
							{draft.list.callerFilters ? (
								<>
									, <Mono>sort</Mono>, <Mono>search</Mono> and filters such as <Mono>{asModel.fields[0]?.key || 'name'}=…</Mono>
								</>
							) : null}
							. The full list is in the API reference.
						</Text>
					)}
					{Object.keys(headers).length > 0 && (
						<JsonBlock
							label='Headers'
							value={headers}
						/>
					)}
					{body &&
						(Object.keys(body).length ? (
							<Box>
								<JsonBlock
									label='Body · JSON'
									value={body}
								/>
								<Note>
									{action === 'update' ? 'Send only what changes — any of these. ' : ''}
									{required.length > 0 && (
										<>
											Required: <Mono>{required.map(f => f.key).join(', ')}</Mono>.{' '}
										</>
									)}
									Other keys are ignored; calculated fields are worked out by the server.
									{ignored.length > 0 && (
										<>
											{' '}
											Not written by calls (sent, they’re ignored): <Mono>{ignored.map(f => f.key).join(', ')}</Mono>.
										</>
									)}
								</Note>
							</Box>
						) : (
							<Text
								fontSize='12.5px'
								color='orange.fg'>
								No field is written by calls — tick some under Fields → Written.
							</Text>
						))}
				</Flex>
			</Panel>

			<Panel
				title='Response'
				subtitle={`${status} — JSON.`}>
				<JsonBlock
					label={status}
					value={response}
				/>
				{list && (
					<Note>
						<Mono>doc</Mono> is this page’s records, <Mono>total</Mono> how many match on every page, <Mono>totalPages</Mono> how many pages there are at
						this <Mono>limit</Mono>.
					</Note>
				)}
				{action !== 'delete' && (
					<Note>
						Values are examples by kind. <Mono>_id</Mono> always comes back{draft.fields.out ? '; the other fields are the ones ticked “Sent back”' : ''}
						{(action === 'list' || action === 'get') && model.populate?.length ? '; links are ids unless the call asks ?populate=' : ''}.
					</Note>
				)}
			</Panel>

			<Panel
				title='Errors'
				subtitle='Any other answer is a status and a JSON message.'>
				<Flex
					direction='column'
					gap={3}>
					{errors.map(([s, v]) => (
						<JsonBlock
							key={s}
							label={s}
							value={v}
						/>
					))}
				</Flex>
			</Panel>
		</Flex>
	);
};

export default EndpointReference;
