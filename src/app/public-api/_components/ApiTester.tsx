'use client';

import { FC, FormEvent, useEffect, useRef, useState } from 'react';
import { Badge, Box, Button, Flex, Input, Text, Textarea } from '@chakra-ui/react';
import { Copy, Send } from 'lucide-react';
import { Dropdown, Panel } from '@/components/library/cl';
import GuideLink from '@/components/library/tenant/GuideLink';
import { Method } from './api';

/**
 * Sends a request to the project's live public API, from this browser, and
 * shows what comes back — status, time and the JSON. A sign-in's token is
 * kept for the customer-only endpoints; a record's _id fills the next :id.
 */

export type Trial = { method: Method; path: string; body?: Record<string, any>; customer?: boolean; nonce: number };

type Result = { status: number; ok: boolean; ms: number; text: string; error?: string };

const METHODS: Method[] = ['GET', 'POST', 'PUT', 'DELETE'];
const hasBody = (m: Method) => m === 'POST' || m === 'PUT';

const pretty = (text: string) => {
	try {
		return JSON.stringify(JSON.parse(text), null, 2);
	} catch {
		return text;
	}
};

const tone = (r: Result) => (r.error ? 'red' : r.status < 300 ? 'green' : r.status < 500 ? 'orange' : 'red');

const ApiTester: FC<{ base: string; trial: Trial | null }> = ({ base, trial }) => {
	const [method, setMethod] = useState<Method>('GET');
	const [path, setPath] = useState('/');
	const [body, setBody] = useState('');
	const [token, setToken] = useState('');
	const [tokenNote, setTokenNote] = useState('');
	const [problem, setProblem] = useState('');
	const [sending, setSending] = useState(false);
	const [result, setResult] = useState<Result | null>(null);
	const [copied, setCopied] = useState(false);
	const lastId = useRef('');
	const panel = useRef<HTMLDivElement>(null);

	// "Try" on the reference: load that endpoint, filling :id with the last record seen.
	useEffect(() => {
		if (!trial) return;
		setMethod(trial.method);
		setPath(lastId.current ? trial.path.replace(':id', lastId.current) : trial.path);
		setBody(trial.body ? JSON.stringify(trial.body, null, 2) : '');
		setProblem('');
		setResult(null);
		panel.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}, [trial?.nonce]);

	const url = `${base}${path.startsWith('/') ? path : `/${path}`}`;

	const send = async (e?: FormEvent) => {
		e?.preventDefault();
		setProblem('');
		if (path.includes(':id')) return setProblem('Put a record’s _id in place of :id — list the model first to see some.');
		let payload: string | undefined;
		if (hasBody(method) && body.trim()) {
			try {
				payload = JSON.stringify(JSON.parse(body));
			} catch {
				return setProblem('The body isn’t valid JSON.');
			}
		}
		setSending(true);
		const started = performance.now();
		try {
			const res = await fetch(url, {
				method,
				headers: { ...(payload && { 'content-type': 'application/json' }), ...(token.trim() && { authorization: `Bearer ${token.trim()}` }) },
				body: payload,
			});
			const text = await res.text();
			setResult({ status: res.status, ok: res.ok, ms: Math.round(performance.now() - started), text });
			try {
				const data = JSON.parse(text);
				if (typeof data?.token === 'string') {
					setToken(data.token);
					setTokenNote('Kept from this sign-in — customer-only endpoints now send it.');
				}
				const id = data?._id || data?.doc?.[0]?._id;
				if (typeof id === 'string') lastId.current = id;
			} catch {
				/* not JSON: shown as text */
			}
		} catch (err: any) {
			setResult({ status: 0, ok: false, ms: Math.round(performance.now() - started), text: '', error: err?.message || 'The request didn’t reach the API' });
		} finally {
			setSending(false);
		}
	};

	const asFetch = () =>
		`await fetch('${url}', {\n  method: '${method}',\n  headers: { ${[hasBody(method) && body.trim() ? `'Content-Type': 'application/json'` : '', token.trim() ? `Authorization: 'Bearer <token>'` : ''].filter(Boolean).join(', ')} },${hasBody(method) && body.trim() ? `\n  body: JSON.stringify(${body.trim()}),` : ''}\n}).then(r => r.json());`;

	return (
		<Box ref={panel}>
			<Panel
				title='Try it'
				subtitle='Send a request to your live API and see what comes back.'
				actions={<GuideLink section='tester' />}>
				<Flex
					as='form'
					direction='column'
					gap={3}
					onSubmit={send}>
					<Flex
						gap={2}
						wrap={{ base: 'wrap', md: 'nowrap' }}>
						<Box w='112px'>
							<Dropdown
								size='sm'
								value={method}
								onChange={v => setMethod(v as Method)}
								items={METHODS.map(m => ({ value: m, label: m }))}
							/>
						</Box>
						<Flex
							flex={1}
							minW='240px'
							align='center'
							borderWidth='1px'
							borderColor='border'
							borderRadius='md'
							overflow='hidden'>
							<Text
								px={2.5}
								fontSize='12px'
								fontFamily='mono'
								color='fg.muted'
								bg='bg.subtle'
								alignSelf='stretch'
								display={{ base: 'none', lg: 'flex' }}
								alignItems='center'
								flexShrink={0}
								maxW='60%'
								whiteSpace='nowrap'>
								{base}
							</Text>
							<Input
								size='sm'
								border='none'
								fontFamily='mono'
								fontSize='12.5px'
								value={path}
								onChange={e => setPath(e.target.value)}
								aria-label='Path'
								placeholder='/products?limit=5'
							/>
						</Flex>
						<Button
							type='submit'
							size='sm'
							loading={sending}>
							<Send size={14} />
							Send
						</Button>
					</Flex>

					<Box>
						<Text
							fontSize='12px'
							fontWeight='500'
							mb={1}>
							Customer token <Text as='span' color='fg.muted' fontWeight='400'>— for endpoints marked Customer; sign in below to get one</Text>
						</Text>
						<Input
							size='sm'
							fontFamily='mono'
							fontSize='12px'
							value={token}
							onChange={e => {
								setToken(e.target.value);
								setTokenNote('');
							}}
							placeholder='Paste a token, or call /auth/login'
						/>
						{tokenNote && (
							<Text
								mt={1}
								fontSize='12px'
								color='green.fg'>
								{tokenNote}
							</Text>
						)}
					</Box>

					{hasBody(method) && (
						<Box>
							<Text
								fontSize='12px'
								fontWeight='500'
								mb={1}>
								Body (JSON)
							</Text>
							<Textarea
								size='sm'
								rows={8}
								fontFamily='mono'
								fontSize='12px'
								value={body}
								onChange={e => setBody(e.target.value)}
								placeholder='{ "name": "…" }'
							/>
						</Box>
					)}

					<Text
						fontSize='12px'
						color='fg.muted'>
						Requests are real: creating, changing or deleting changes this project’s records.
					</Text>
					{problem && (
						<Text
							fontSize='12.5px'
							color='red.fg'>
							{problem}
						</Text>
					)}
				</Flex>

				{result && (
					<Box
						mt={4}
						pt={4}
						borderTopWidth='1px'
						borderColor='border.muted'>
						<Flex
							align='center'
							gap={2}
							mb={2}
							wrap='wrap'>
							<Badge
								size='sm'
								colorPalette={tone(result)}>
								{result.error ? 'Failed' : result.status}
							</Badge>
							<Text
								fontSize='12px'
								color='fg.muted'>
								{result.ms} ms{result.text ? ` · ${result.text.length.toLocaleString()} bytes` : ''}
							</Text>
							<Button
								ml='auto'
								size='2xs'
								variant='ghost'
								onClick={() => {
									navigator.clipboard?.writeText(asFetch());
									setCopied(true);
									setTimeout(() => setCopied(false), 1500);
								}}>
								<Copy size={12} />
								{copied ? 'Copied' : 'Copy as fetch'}
							</Button>
						</Flex>
						<Box
							as='pre'
							m={0}
							p={3}
							maxH='420px'
							overflow='auto'
							fontSize='12px'
							fontFamily='mono'
							bg='bg.subtle'
							borderWidth='1px'
							borderColor='border.muted'
							borderRadius='md'
							whiteSpace='pre-wrap'
							wordBreak='break-word'>
							{result.error || pretty(result.text) || '(empty)'}
						</Box>
					</Box>
				)}
			</Panel>
		</Box>
	);
};

export default ApiTester;
