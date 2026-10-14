'use client';

import { FC, Fragment, KeyboardEvent, ReactNode, useEffect, useRef, useState } from 'react';
import { Box, Button, Center, Flex, Link, Skeleton, Text, Textarea } from '@chakra-ui/react';
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
 *
 * Replies (WO-53) work like Facebook's: one level under each comment, the
 * last two showing and the rest behind "View earlier replies"; replying to a
 * reply joins the same thread and starts with @their name. Links in a comment
 * open in a new tab. A notification's link (`?comment=<id>`) opens the thread
 * and scrolls to the comment.
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

/** Web addresses in a comment: http(s)://… or www.… */
const URL_RX = /((?:https?:\/\/|www\.)[^\s<>"]+)/gi;

/** A typed address without the punctuation that ends its sentence ("see example.com." / "(at example.com)"). */
const trimUrl = (raw: string) => {
	let url = raw.replace(/[.,;:!?'"]+$/, '');
	while (url.endsWith(')') && (url.match(/\(/g) || []).length < (url.match(/\)/g) || []).length) url = url.slice(0, -1).replace(/[.,;:!?'"]+$/, '');
	return url;
};

/** Plain text with its web addresses as links that open in a new tab. */
const Linked: FC<{ text: string }> = ({ text }) => {
	const parts = text.split(URL_RX);
	if (parts.length === 1) return <>{text}</>;
	return (
		<>
			{parts.map((p, i) => {
				if (i % 2 === 0) return <Fragment key={i}>{p}</Fragment>;
				const url = trimUrl(p);
				return (
					<Fragment key={i}>
						<Link
							href={/^https?:\/\//i.test(url) ? url : `https://${url}`}
							target='_blank'
							rel='noopener noreferrer nofollow'
							display='inline'
							wordBreak='break-all'
							// `[href]` outranks the panel's global `a:not(.chakra-button) { color: inherit }`.
							css={{ '&[href]': { color: 'blue.fg', textDecoration: 'underline', textUnderlineOffset: '2px' } }}>
							{url}
						</Link>
						{p.slice(url.length)}
					</Fragment>
				);
			})}
		</>
	);
};

/** The text with each @mention of the comment highlighted, and its links clickable. */
const Body: FC<{ body: string; mentions: RecordComment['mentions'] }> = ({ body, mentions }) => {
	const names = mentions.map(m => m.name).filter(Boolean).sort((a, b) => b.length - a.length);
	if (!names.length) return <Linked text={body} />;
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
					<Linked
						key={i}
						text={p}
					/>
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
	rows?: number;
	placeholder?: string;
};

/** The writing box, with the @ list. Picked people are kept by name → id; only those still written go up. */
const Composer: FC<ComposerProps> = ({ mentionable, initialBody = '', initialMentions = [], submitLabel, onSubmit, onCancel, autoFocus, rows = 3, placeholder }) => {
	const [body, setBody] = useState(initialBody);
	const [picked, setPicked] = useState<Map<string, string>>(() => new Map(initialMentions.map(m => [m.name, m._id])));
	const [query, setQuery] = useState<{ start: number; text: string } | null>(null);
	const [active, setActive] = useState(0);
	const [error, setError] = useState('');
	const [sending, setSending] = useState(false);
	const ref = useRef<HTMLTextAreaElement>(null);
	// Focused with the caret after what's there (a reply's @name, a comment being edited).
	useEffect(() => {
		if (!autoFocus || !ref.current) return;
		const end = ref.current.value.length;
		ref.current.focus();
		ref.current.setSelectionRange(end, end);
	}, [autoFocus]);

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
					rows={rows}
					maxLength={5000}
					value={body}
					placeholder={placeholder || (nobody ? 'Write a comment' : 'Write a comment — type @ to mention someone')}
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

type RowProps = {
	c: RecordComment;
	mine: boolean;
	canDelete: boolean;
	mentionable?: Mentionable;
	/** A reply: smaller, under its comment. */
	reply?: boolean;
	/** How many replies go with it when it's deleted. */
	replies?: number;
	/** Opens the reply box under this comment's thread; absent while comments are off. */
	onReply?: () => void;
	/** The comment a notification pointed at: scrolled to and lit up. */
	focused?: boolean;
};

const CommentRow: FC<RowProps> = ({ c, mine, canDelete, mentionable, reply, replies = 0, onReply, focused }) => {
	const [editing, setEditing] = useState(false);
	const [confirm, setConfirm] = useState(false);
	const [lit, setLit] = useState(false);
	const ref = useRef<HTMLDivElement>(null);
	const [update] = useUpdateRecordCommentMutation();
	const [remove, removing] = useDeleteRecordCommentMutation();
	useEffect(() => {
		if (!focused) return;
		// After the tab has switched to Comments.
		const t = setTimeout(() => {
			ref.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
			setLit(true);
		}, 250);
		const off = setTimeout(() => setLit(false), 2800);
		return () => (clearTimeout(t), clearTimeout(off));
	}, [focused]);
	return (
		<Flex
			ref={ref}
			gap={reply ? 2.5 : 3}
			py={reply ? 2 : 0}
			px={reply ? 2 : 0}
			mx={reply ? -2 : 0}
			borderRadius='lg'
			bg={lit ? 'yellow.subtle' : undefined}
			transition='background 0.6s'
			id={`comment-${c._id}`}>
			<Center
				boxSize={reply ? '26px' : '32px'}
				flexShrink={0}
				borderRadius='full'
				bg='bg.muted'
				fontSize={reply ? '10.5px' : '12px'}
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
						fontSize={reply ? '13px' : '13.5px'}
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
							rows={reply ? 2 : 3}
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
					<>
						<Text
							mt={reply ? 0.5 : 1}
							fontSize={reply ? '13px' : '13.5px'}
							whiteSpace='pre-wrap'
							wordBreak='break-word'>
							<Body
								body={c.body}
								mentions={c.mentions}
							/>
						</Text>
						{onReply && (
							<Button
								variant='plain'
								size='xs'
								h='auto'
								minW={0}
								p={0}
								mt={1}
								fontSize='12px'
								fontWeight='600'
								color='fg.muted'
								_hover={{ color: 'fg', textDecoration: 'underline' }}
								onClick={onReply}>
								Reply
							</Button>
						)}
					</>
				)}
			</Box>
			<PromptDialog
				open={confirm}
				onClose={() => setConfirm(false)}
				onConfirm={async () => {
					const res = await remove(c._id);
					if ('data' in res) setConfirm(false);
				}}
				title={reply ? 'Delete this reply?' : 'Delete this comment?'}
				description={
					replies
						? `It’s removed for everyone, with its ${replies === 1 ? 'reply' : `${replies} replies`}. This can’t be undone.`
						: 'It’s removed for everyone. This can’t be undone.'
				}
				loading={removing.isLoading}
				confirmLabel='Delete'
			/>
		</Flex>
	);
};

/** Replies showing before "View earlier replies". */
const SHOWN_REPLIES = 2;

type ThreadProps = {
	top: RecordComment;
	replies: RecordComment[];
	selfId?: string;
	canModerate: boolean;
	mentionable?: Mentionable;
	/** Comments are on: replies can be written. */
	open: boolean;
	focusId?: string | null;
	onReply: (body: string, mentions: string[], parent: string) => Promise<any>;
};

/** One comment and its replies, Facebook-style: indented under it, with a reply box at the end when open. */
const Thread: FC<ThreadProps> = ({ top, replies, selfId, canModerate, mentionable, open, focusId, onReply }) => {
	const hidden = Math.max(0, replies.length - SHOWN_REPLIES);
	const [all, setAll] = useState(false);
	// A notification pointing at an earlier reply opens the whole thread.
	useEffect(() => {
		if (focusId && replies.slice(0, hidden).some(r => r._id === focusId)) setAll(true);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [focusId]);
	// Who the reply box answers; a new pick remounts it with their @name.
	const [replyTo, setReplyTo] = useState<{ key: number; name: string; mention?: MentionPerson } | null>(null);
	const shown = all ? replies : replies.slice(hidden);
	const startReply = (c: RecordComment) => {
		// Replying to a reply: start with @their name, when they can be mentioned.
		const person = c._id !== top._id && c.author._id !== selfId ? mentionable?.people.find(p => p._id === c.author._id) : undefined;
		setReplyTo({ key: Date.now(), name: c.author.name, mention: mentionable?.enabled ? person : undefined });
	};
	const row = (c: RecordComment, reply: boolean) => (
		<CommentRow
			key={c._id}
			c={c}
			reply={reply}
			replies={reply ? 0 : replies.length}
			mine={c.author._id === selfId}
			canDelete={c.author._id === selfId || canModerate}
			mentionable={mentionable}
			focused={c._id === focusId}
			onReply={open ? () => startReply(c) : undefined}
		/>
	);
	return (
		<Box
			px={4}
			py={3.5}
			borderTopWidth='1px'
			borderColor='border.muted'
			_first={{ borderTopWidth: 0 }}>
			{row(top, false)}
			{(replies.length > 0 || replyTo) && (
				<Flex
					direction='column'
					gap={1}
					mt={2}
					ml={{ base: 5, md: 11 }}
					pl={{ base: 3, md: 0 }}
					borderLeftWidth={{ base: '2px', md: 0 }}
					borderColor='border.muted'>
					{hidden > 0 && !all && (
						<Button
							variant='plain'
							size='xs'
							h='auto'
							p={0}
							py={1}
							alignSelf='flex-start'
							fontSize='12.5px'
							fontWeight='600'
							color='fg.muted'
							_hover={{ color: 'fg', textDecoration: 'underline' }}
							onClick={() => setAll(true)}>
							View {hidden === 1 ? '1 earlier reply' : `${hidden} earlier replies`}
						</Button>
					)}
					{shown.map(c => row(c, true))}
					{replyTo && (
						<Box mt={1}>
							<Composer
								key={replyTo.key}
								autoFocus
								rows={2}
								mentionable={mentionable}
								initialBody={replyTo.mention ? `@${replyTo.mention.name} ` : ''}
								initialMentions={replyTo.mention ? [{ _id: replyTo.mention._id, name: replyTo.mention.name }] : []}
								placeholder={`Reply to ${replyTo.name}…`}
								submitLabel='Reply'
								onCancel={() => setReplyTo(null)}
								onSubmit={async (body, mentions) => {
									const res = await onReply(body, mentions, top._id);
									if (res && 'data' in res) {
										setReplyTo(null);
										setAll(true);
									}
									return res;
								}}
							/>
						</Box>
					)}
				</Flex>
			)}
		</Box>
	);
};

const RecordComments: FC<{ route: string; record: string }> = ({ route, record }) => {
	const { self } = useWorkspace();
	const { data, isLoading, error } = useGetRecordCommentsQuery({ route, record });
	const on = data?.settings?.comments !== false;
	const { data: mentionable } = useGetMentionableQuery({ route, record }, { skip: !data || !on });
	const [add] = useAddRecordCommentMutation();
	// The comment a notification links to (`?comment=<id>`).
	const [focusId, setFocusId] = useState<string | null>(null);
	useEffect(() => setFocusId(new URLSearchParams(window.location.search).get('comment')), []);

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
	// Threads: top-level comments, oldest first, each with its replies (a reply whose comment is gone stands alone).
	const ids = new Set(comments.map(c => c._id));
	const tops = comments.filter(c => !c.parent || !ids.has(c.parent));
	const repliesOf = (id: string) => comments.filter(c => c.parent === id);
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
					{tops.map(c => (
						<Thread
							key={c._id}
							top={c}
							replies={repliesOf(c._id)}
							selfId={self?._id}
							canModerate={!!data?.canModerate}
							mentionable={mentionable}
							open={on}
							focusId={focusId}
							onReply={(body, mentions, parent) => add({ route, record, body, mentions, parent })}
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
