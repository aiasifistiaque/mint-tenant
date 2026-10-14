'use client';

import { FC, Fragment, KeyboardEvent, ReactNode, useMemo, useRef, useState } from 'react';
import { Box, Button, Center, Flex, Skeleton, Text, Textarea } from '@chakra-ui/react';
import { AtSign, Lock, MessageSquare, Pencil, Trash2 } from 'lucide-react';
import { PromptDialog } from '../modals';
import { EmptyState, when } from '../cl';
import { ago } from '../modals/CreateModal/CreateModal';
import {
	MentionPerson,
	Mentionable,
	RecordComment,
	useAddRecordCommentMutation,
	useDeleteRecordCommentMutation,
	useGetMentionableQuery,
	useGetRecordCommentsQuery,
	useUpdateRecordCommentMutation,
} from '../store/services/tenantApi';
import { useWorkspace } from './useWorkspace';

/**
 * A record's Comments tab (tenant panel, docs/multi-tenancy WO-49): the
 * thread, oldest first, and a box to write in. Typing @ lists the people who
 * can be mentioned on this record — everyone on the page; for a private
 * record only its owner and the people it's shared with (the rest show, greyed
 * out, with why); for an Only me record no one. The server checks the same
 * and answers with the reason, which shows under the box.
 */

const errorText = (e: any) => e?.data?.message || 'Something went wrong — try again.';

const initials = (name = '') =>
	name
		.trim()
		.split(/\s+/)
		.slice(0, 2)
		.map(p => p[0])
		.join('')
		.toUpperCase();

const BLOCKED_WHY: Record<string, string> = {
	private: 'No access to this private record',
	everyone: 'Can’t see this page',
};

/** Why nobody can be mentioned right now, or null when someone can. */
const nobodyReason = (m?: Mentionable): string | null => {
	if (!m) return null;
	if (!m.enabled) return 'Mentions are turned off for this page — its Fields & rules tab (Build → Pages) turns them on.';
	if (m.mode === 'none') return 'This record is Only me — no one else can see it, so no one can be mentioned.';
	return null;
};

const escapeRx = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** The text with each @mention of the comment highlighted. */
const Body: FC<{ body: string; mentions: RecordComment['mentions'] }> = ({ body, mentions }) => {
	const names = mentions.map(m => m.name).filter(Boolean).sort((a, b) => b.length - a.length);
	if (!names.length) return <>{body}</>;
	const parts = body.split(new RegExp(`(@(?:${names.map(escapeRx).join('|')}))`, 'g'));
	return (
		<>
			{parts.map((p, i) =>
				p.startsWith('@') && names.includes(p.slice(1)) ? (
					<Text
						key={i}
						as='span'
						fontWeight='600'
						color='blue.fg'
						bg='blue.subtle'
						borderRadius='sm'
						px='3px'>
						{p}
					</Text>
				) : (
					<Fragment key={i}>{p}</Fragment>
				)
			)}
		</>
	);
};

type ComposerProps = {
	mentionable?: Mentionable;
	initialBody?: string;
	initialMentions?: RecordComment['mentions'];
	submitLabel: string;
	onSubmit: (body: string, mentions: string[]) => Promise<any>;
	onCancel?: () => void;
	autoFocus?: boolean;
};

/** The writing box, with the @ list. Picked people are kept by name → id; only those still written go up. */
const Composer: FC<ComposerProps> = ({ mentionable, initialBody = '', initialMentions = [], submitLabel, onSubmit, onCancel, autoFocus }) => {
	const [body, setBody] = useState(initialBody);
	const [picked, setPicked] = useState<Map<string, string>>(() => new Map(initialMentions.map(m => [m.name, m._id])));
	const [query, setQuery] = useState<{ start: number; text: string } | null>(null);
	const [active, setActive] = useState(0);
	const [error, setError] = useState('');
	const [sending, setSending] = useState(false);
	const ref = useRef<HTMLTextAreaElement>(null);

	const nobody = nobodyReason(mentionable);
	const matches = (list: MentionPerson[] = []) => {
		const q = (query?.text || '').toLowerCase();
		return list.filter(p => !q || p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q)).slice(0, 8);
	};
	const people = matches(mentionable?.people);
	const blocked = matches(mentionable?.blocked).slice(0, 4);

	/** An @ being typed right before the caret: up to 30 characters, no line break, at most two spaces. */
	const findQuery = (value: string, caret: number) => {
		const before = value.slice(0, caret);
		const at = before.lastIndexOf('@');
		if (at < 0 || (at > 0 && /\S/.test(before[at - 1]))) return null;
		const text = before.slice(at + 1);
		if (text.length > 30 || /\n/.test(text) || (text.match(/ /g) || []).length > 2) return null;
		return { start: at, text };
	};

	const change = (value: string) => {
		setBody(value);
		setError('');
		const caret = ref.current?.selectionStart ?? value.length;
		setQuery(findQuery(value, caret));
		setActive(0);
	};

	const pick = (p: MentionPerson) => {
		if (!query) return;
		const caret = ref.current?.selectionStart ?? body.length;
		const next = `${body.slice(0, query.start)}@${p.name} ${body.slice(caret)}`;
		setBody(next);
		setPicked(m => new Map(m).set(p.name, p._id));
		setQuery(null);
		requestAnimationFrame(() => {
			const pos = query.start + p.name.length + 2;
			ref.current?.focus();
			ref.current?.setSelectionRange(pos, pos);
		});
	};

	const refuse = (p: MentionPerson) => {
		setQuery(null);
		setError(
			mentionable?.mode === 'private'
				? `${p.name} can’t be mentioned — this record is private and they don’t have access to it.`
				: `${p.name} can’t be mentioned — they can’t see this page.`
		);
	};

	const submit = async () => {
		const text = body.trim();
		if (!text || sending) return;
		// Someone written as @Name by hand who can't be mentioned: say so before sending.
		const typedBlocked = (mentionable?.blocked || []).find(p => new RegExp(`@${escapeRx(p.name)}\\b`, 'i').test(text) && !picked.has(p.name));
		if (typedBlocked) return refuse(typedBlocked);
		const ids = [...picked].filter(([name]) => text.includes(`@${name}`)).map(([, id]) => id);
		setSending(true);
		const res = await onSubmit(text, ids);
		setSending(false);
		if (res && 'error' in res) return setError(errorText(res.error));
		setBody('');
		setPicked(new Map());
	};

	const keys = (e: KeyboardEvent<HTMLTextAreaElement>) => {
		if (query && people.length) {
			if (e.key === 'ArrowDown') return (e.preventDefault(), setActive(i => (i + 1) % people.length));
			if (e.key === 'ArrowUp') return (e.preventDefault(), setActive(i => (i - 1 + people.length) % people.length));
			if (e.key === 'Enter' || e.key === 'Tab') return (e.preventDefault(), pick(people[active]));
		}
		if (query && e.key === 'Escape') return (e.preventDefault(), setQuery(null));
		if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) return (e.preventDefault(), submit());
	};

	const row = (key: string, children: ReactNode, props: any = {}) => (
		<Flex
			key={key}
			align='center'
			gap={2.5}
			px={3}
			py={2}
			fontSize='13px'
			{...props}>
			{children}
		</Flex>
	);

	return (
		<Box>
			<Box position='relative'>
				<Textarea
					ref={ref}
					size='sm'
					rows={3}
					autoFocus={autoFocus}
					maxLength={5000}
					value={body}
					placeholder={nobody ? 'Write a comment' : 'Write a comment — type @ to mention someone'}
					onChange={e => change(e.target.value)}
					onKeyDown={keys}
					onBlur={() => setTimeout(() => setQuery(null), 150)}
				/>
				{query && (
					<Box
						role='listbox'
						aria-label='People to mention'
						position='absolute'
						left={0}
						top='100%'
						mt={1}
						zIndex={20}
						w={{ base: '100%', md: '340px' }}
						bg='bg.panel'
						borderWidth='1px'
						borderColor='border'
						borderRadius='lg'
						boxShadow='lg'
						overflow='hidden'>
						{nobody
							? row(
									'nobody',
									<>
										<Lock size={14} />
										<Text color='fg.muted'>{nobody}</Text>
									</>
							  )
							: !people.length && !blocked.length
							? row('none', <Text color='fg.muted'>No one called “{query.text}” works on this page</Text>)
							: null}
						{!nobody &&
							people.map((p, i) =>
								row(
									p._id,
									<>
										<Center
											boxSize='24px'
											flexShrink={0}
											borderRadius='full'
											bg='bg.muted'
											fontSize='10px'
											fontWeight='600'>
											{initials(p.name)}
										</Center>
										<Box minW={0}>
											<Text
												fontWeight='600'
												truncate>
												{p.name}
											</Text>
											<Text
												fontSize='12px'
												color='fg.muted'
												truncate>
												{p.email}
											</Text>
										</Box>
									</>,
									{
										role: 'option',
										'aria-selected': i === active,
										cursor: 'pointer',
										bg: i === active ? 'bg.muted' : undefined,
										onMouseEnter: () => setActive(i),
										onMouseDown: (e: any) => (e.preventDefault(), pick(p)),
									}
								)
							)}
						{!nobody &&
							blocked.map(p =>
								row(
									`b-${p._id}`,
									<>
										<Center
											boxSize='24px'
											flexShrink={0}
											borderRadius='full'
											bg='bg.muted'
											color='fg.subtle'>
											<Lock size={12} />
										</Center>
										<Box minW={0}>
											<Text
												color='fg.subtle'
												truncate>
												{p.name}
											</Text>
											<Text
												fontSize='12px'
												color='fg.subtle'>
												{BLOCKED_WHY[mentionable?.mode || 'everyone']}
											</Text>
										</Box>
									</>,
									{
										role: 'option',
										'aria-disabled': true,
										cursor: 'not-allowed',
										opacity: 0.8,
										onMouseDown: (e: any) => (e.preventDefault(), refuse(p)),
									}
								)
							)}
					</Box>
				)}
			</Box>
			<Flex
				mt={2}
				align='center'
				gap={3}
				wrap='wrap'>
				<Text
					fontSize='12px'
					color='fg.muted'
					flex={1}
					minW='200px'>
					{nobody ? (
						nobody
					) : (
						<>
							<AtSign
								size={12}
								style={{ display: 'inline', verticalAlign: '-2px' }}
							/>{' '}
							{mentionable?.mode === 'private' ? 'Private record — only its owner and the people it’s shared with can be mentioned.' : 'Mention anyone who works on this page.'}{' '}
							⌘/Ctrl + Enter sends.
						</>
					)}
				</Text>
				{onCancel && (
					<Button
						size='xs'
						variant='ghost'
						onClick={onCancel}>
						Cancel
					</Button>
				)}
				<Button
					size='xs'
					loading={sending}
					disabled={!body.trim()}
					onClick={submit}>
					{submitLabel}
				</Button>
			</Flex>
			{error && (
				<Text
					role='alert'
					mt={2}
					fontSize='13px'
					color='red.fg'>
					{error}
				</Text>
			)}
		</Box>
	);
};

const CommentRow: FC<{ c: RecordComment; mine: boolean; canDelete: boolean; mentionable?: Mentionable }> = ({ c, mine, canDelete, mentionable }) => {
	const [editing, setEditing] = useState(false);
	const [confirm, setConfirm] = useState(false);
	const [update] = useUpdateRecordCommentMutation();
	const [remove, removing] = useDeleteRecordCommentMutation();
	return (
		<Flex
			gap={3}
			px={4}
			py={3.5}
			borderTopWidth='1px'
			borderColor='border.muted'
			_first={{ borderTopWidth: 0 }}
			id={`comment-${c._id}`}>
			<Center
				boxSize='32px'
				flexShrink={0}
				borderRadius='full'
				bg='bg.muted'
				fontSize='12px'
				fontWeight='600'
				color='fg.muted'>
				{initials(c.author.name)}
			</Center>
			<Box
				flex={1}
				minW={0}>
				<Flex
					align='baseline'
					gap={2}
					wrap='wrap'>
					<Text
						fontSize='13.5px'
						fontWeight='600'>
						{c.author.name}
					</Text>
					<Text
						fontSize='12px'
						color='fg.muted'
						title={when(c.createdAt)}>
						{ago(c.createdAt)}
						{c.editedAt ? ' · edited' : ''}
					</Text>
					<Box flex={1} />
					{!editing && mine && (
						<Button
							size='2xs'
							variant='ghost'
							color='fg.muted'
							aria-label='Edit comment'
							onClick={() => setEditing(true)}>
							<Pencil size={13} />
						</Button>
					)}
					{!editing && canDelete && (
						<Button
							size='2xs'
							variant='ghost'
							color='fg.muted'
							aria-label='Delete comment'
							onClick={() => setConfirm(true)}>
							<Trash2 size={13} />
						</Button>
					)}
				</Flex>
				{editing ? (
					<Box mt={2}>
						<Composer
							autoFocus
							mentionable={mentionable}
							initialBody={c.body}
							initialMentions={c.mentions}
							submitLabel='Save'
							onCancel={() => setEditing(false)}
							onSubmit={async (body, mentions) => {
								const res = await update({ id: c._id, body, mentions });
								if ('data' in res) setEditing(false);
								return res;
							}}
						/>
					</Box>
				) : (
					<Text
						mt={1}
						fontSize='13.5px'
						whiteSpace='pre-wrap'
						wordBreak='break-word'>
						<Body
							body={c.body}
							mentions={c.mentions}
						/>
					</Text>
				)}
			</Box>
			<PromptDialog
				open={confirm}
				onClose={() => setConfirm(false)}
				onConfirm={async () => {
					const res = await remove(c._id);
					if ('data' in res) setConfirm(false);
				}}
				title='Delete this comment?'
				description='It’s removed for everyone. This can’t be undone.'
				loading={removing.isLoading}
				confirmLabel='Delete'
			/>
		</Flex>
	);
};

const RecordComments: FC<{ route: string; record: string }> = ({ route, record }) => {
	const { self } = useWorkspace();
	const { data, isLoading, error } = useGetRecordCommentsQuery({ route, record });
	const on = data?.settings?.comments !== false;
	const { data: mentionable } = useGetMentionableQuery({ route, record }, { skip: !data || !on });
	const [add] = useAddRecordCommentMutation();

	if (isLoading)
		return (
			<Box pt={2}>
				{[0, 1].map(i => (
					<Skeleton
						key={i}
						h='56px'
						mb={2}
					/>
				))}
			</Box>
		);
	if (error)
		return (
			<EmptyState
				title='Comments can’t be shown'
				description={errorText(error)}
			/>
		);

	const comments = data?.doc || [];
	return (
		<Flex
			direction='column'
			gap={4}
			pt={2}
			maxW='820px'>
			{comments.length ? (
				<Box
					borderWidth='1px'
					borderColor='border'
					borderRadius='xl'
					bg='bg.panel'>
					{comments.map(c => (
						<CommentRow
							key={c._id}
							c={c}
							mine={c.author._id === self?._id}
							canDelete={c.author._id === self?._id || !!data?.canModerate}
							mentionable={mentionable}
						/>
					))}
				</Box>
			) : (
				<Flex
					align='center'
					gap={2.5}
					color='fg.muted'
					fontSize='13px'>
					<MessageSquare size={16} />
					{on ? 'No comments yet — start the conversation about this record.' : 'No comments on this record.'}
				</Flex>
			)}
			{on ? (
				<Box
					borderWidth='1px'
					borderColor='border'
					borderRadius='xl'
					bg='bg.panel'
					p={4}>
					<Composer
						mentionable={mentionable}
						submitLabel='Comment'
						onSubmit={(body, mentions) => add({ route, record, body, mentions })}
					/>
				</Box>
			) : (
				<Text
					fontSize='13px'
					color='fg.muted'>
					Comments are turned off for this page — someone who builds the project turns them on in its Fields & rules tab (Build → Pages).
				</Text>
			)}
		</Flex>
	);
};

export default RecordComments;
