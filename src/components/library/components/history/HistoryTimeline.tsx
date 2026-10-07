'use client';

import { FC, Fragment, useState } from 'react';
import { Badge, Box, Button, Flex, Skeleton, Text } from '@chakra-ui/react';
import moment from 'moment';
import { useGetDocumentHistoryQuery } from '../../store';

/** Also used by the view page for the tab's count, so both share one cached request. */
export const HISTORY_PAGE_SIZE = 30;

const ACTION: Record<string, { color: string; verb: string }> = {
	create: { color: 'green', verb: 'created this record' },
	update: { color: 'orange', verb: 'edited' },
	delete: { color: 'red', verb: 'deleted this record' },
};

// The recorder flattens dates to ISO strings (recordHistory.function.ts), which
// read badly in a before/after row. Anything that parses as one is shown as a
// date instead; everything else as stored.
const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

const formatValue = (value: string) => {
	if (!value || value === 'empty') return null;
	if (ISO_DATE.test(value)) {
		const m = moment(value);
		// Midnight UTC is a date-only field; don't invent a time for it.
		return m.utc().format('HH:mm:ss') === '00:00:00' ? m.utc().format('D MMM YYYY') : m.format('D MMM YYYY, h:mm A');
	}
	return value;
};

const dayLabel = (date: string) => {
	const m = moment(date);
	if (m.isSame(moment(), 'day')) return 'Today';
	if (m.isSame(moment().subtract(1, 'day'), 'day')) return 'Yesterday';
	return m.format(m.isSame(moment(), 'year') ? 'dddd, D MMMM' : 'D MMMM YYYY');
};

const initials = (name = '') =>
	name
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map(part => part[0]?.toUpperCase())
		.join('') || '?';

/**
 * Rich-text fields are stored as their HTML. In a before/after row the markup
 * is noise, so show the text it renders to.
 */
const toPlainText = (value: string) =>
	/<\/?[a-z][^>]*>/i.test(value)
		? value
				.replace(/<br\s*\/?>|<\/p>|<\/div>|<\/li>/gi, '\n')
				.replace(/<[^>]+>/g, '')
				.replace(/&nbsp;/g, ' ')
				.replace(/&amp;/g, '&')
				.replace(/&lt;/g, '<')
				.replace(/&gt;/g, '>')
				.replace(/&quot;/g, '"')
				.replace(/&#39;/g, "'")
				.replace(/\n{2,}/g, '\n')
				.trim()
		: value;

// Past this a value is clamped to a few lines with a toggle, so one long note
// doesn't push the rest of the log off the screen.
const LONG_VALUE = 160;

/** One side of a change: the value, or a muted "empty". */
const Value: FC<{ value: string; was?: boolean }> = ({ value, was }) => {
	const [expanded, setExpanded] = useState(false);
	const formatted = formatValue(value);
	const shown = formatted === null ? null : toPlainText(formatted) || null;
	const long = !!shown && shown.length > LONG_VALUE;

	return (
		<Box
			as='span'
			display='block'
			minW={0}>
			<Text
				as='span'
				display='block'
				fontSize='12.5px'
				whiteSpace='pre-line'
				wordBreak='break-word'
				color={!shown || was ? 'fg.muted' : 'fg'}
				fontStyle={shown ? undefined : 'italic'}
				textDecoration={was && shown ? 'line-through' : undefined}
				textDecorationColor='fg.subtle'
				lineClamp={long && !expanded ? 3 : undefined}>
				{shown ?? 'empty'}
			</Text>
			{long && (
				<Button
					variant='plain'
					size='xs'
					h='auto'
					p={0}
					mt={0.5}
					fontSize='12px'
					color='fg.muted'
					_hover={{ color: 'fg' }}
					onClick={() => setExpanded(e => !e)}>
					{expanded ? 'Show less' : 'Show more'}
				</Button>
			)}
		</Box>
	);
};

type Props = {
	/** The record's id — `history.document` on every entry about it. */
	id: string;
};

/**
 * A record's complete activity log, for the view page's History tab: who
 * created it, every edit with each changed field's before and after, and
 * deletion, newest first and grouped by day.
 *
 * The compact `DocumentHistory` is the drawer's version of the same data.
 */
const HistoryTimeline: FC<Props> = ({ id }) => {
	const [limit, setLimit] = useState(HISTORY_PAGE_SIZE);
	const { data, isLoading, isFetching, isError, refetch } = useGetDocumentHistoryQuery({ id, limit }, { skip: !id });

	const entries: any[] = data?.doc || [];
	const total: number = data?.totalDocs ?? entries.length;
	const hasMore = entries.length < total;

	if (isLoading) {
		return (
			<Flex
				direction='column'
				gap={5}
				maxW='760px'>
				{[0, 1, 2].map(i => (
					<Flex
						key={i}
						gap={3}>
						<Skeleton
							boxSize='28px'
							borderRadius='full'
						/>
						<Flex
							direction='column'
							gap={2}
							flex={1}>
							<Skeleton
								h='12px'
								w='40%'
							/>
							<Skeleton
								h='12px'
								w='70%'
							/>
						</Flex>
					</Flex>
				))}
			</Flex>
		);
	}

	// Without this a failed request fell through to the empty state, which
	// claims the record has no history when it simply couldn't be loaded.
	if (isError && entries.length === 0) {
		return (
			<Box
				py={10}
				textAlign='center'
				borderWidth='1px'
				borderStyle='dashed'
				borderColor='border'
				borderRadius='lg'
				maxW='760px'>
				<Text
					fontSize='14px'
					fontWeight='500'>
					Couldn&apos;t load the history
				</Text>
				<Button
					mt={3}
					size='xs'
					variant='outline'
					loading={isFetching}
					onClick={() => refetch()}>
					Try again
				</Button>
			</Box>
		);
	}

	if (entries.length === 0) {
		return (
			<Box
				py={10}
				textAlign='center'
				borderWidth='1px'
				borderStyle='dashed'
				borderColor='border'
				borderRadius='lg'
				maxW='760px'>
				<Text
					fontSize='14px'
					fontWeight='500'>
					No recorded activity yet
				</Text>
				<Text
					fontSize='13px'
					color='fg.muted'
					mt={1}>
					Edits made from now on will show up here.
				</Text>
			</Box>
		);
	}

	// The log only starts when history recording was switched on; older
	// records have edits but no "created" entry. Say so rather than letting the
	// oldest edit look like the beginning.
	const oldest = entries[entries.length - 1];
	const startsMidway = !hasMore && oldest?.action !== 'create';

	return (
		<Box maxW='760px'>
			<Text
				fontSize='12px'
				color='fg.muted'
				mb={4}>
				{total.toLocaleString()} {total === 1 ? 'entry' : 'entries'}
			</Text>

			{entries.map((entry, i) => {
				const action = ACTION[entry?.action] || { color: 'gray', verb: entry?.action };
				const name = entry?.user?.name || entry?.userName || 'Someone';
				const changes: any[] = entry?.changes || [];
				const newDay = i === 0 || !moment(entry.createdAt).isSame(entries[i - 1].createdAt, 'day');
				const isLast = i === entries.length - 1;

				return (
					<Fragment key={entry?._id}>
						{newDay && (
							<Text
								fontSize='11px'
								fontWeight='600'
								letterSpacing='0.06em'
								textTransform='uppercase'
								color='fg.muted'
								mt={i === 0 ? 0 : 5}
								mb={3}>
								{dayLabel(entry.createdAt)}
							</Text>
						)}

						<Flex gap={3}>
							{/* The rail: an avatar per entry and a line down to the next,
							    so the log reads as one thread. */}
							<Flex
								direction='column'
								align='center'
								flexShrink={0}>
								<Flex
									boxSize='28px'
									borderRadius='full'
									align='center'
									justify='center'
									fontSize='11px'
									fontWeight='600'
									bg='bg.muted'
									color='fg'
									borderWidth='2px'
									borderColor={`${action.color}.solid`}>
									{initials(name)}
								</Flex>
								{!isLast && (
									<Box
										flex={1}
										w='1px'
										bg='border'
										my={1}
									/>
								)}
							</Flex>

							<Box
								flex={1}
								minW={0}
								pb={isLast ? 0 : 5}>
								<Flex
									align='baseline'
									gap={2}
									wrap='wrap'>
									<Text
										fontSize='13px'
										lineHeight='28px'>
										<Text
											as='span'
											fontWeight='600'>
											{name}
										</Text>{' '}
										<Text
											as='span'
											color='fg.muted'>
											{entry?.action === 'update'
												? `${action.verb} ${changes.length} ${changes.length === 1 ? 'field' : 'fields'}`
												: action.verb}
										</Text>
									</Text>
									<Badge
										size='xs'
										variant='subtle'
										colorPalette={action.color}
										textTransform='capitalize'>
										{entry?.action}
									</Badge>
									<Text
										ml='auto'
										fontSize='12px'
										color='fg.muted'
										title={moment(entry.createdAt).format('D MMM YYYY, h:mm:ss A')}>
										{moment(entry.createdAt).format('h:mm A')}
									</Text>
								</Flex>

								{changes.length > 0 && (
									<Box
										mt={2}
										borderWidth='1px'
										borderColor='border.muted'
										borderRadius='md'
										overflow='hidden'>
										{changes.map((change, c) => (
											<Flex
												key={`${change.field}-${c}`}
												px={3}
												py={2}
												gap={3}
												direction={{ base: 'column', md: 'row' }}
												borderTopWidth={c === 0 ? 0 : '1px'}
												borderColor='border.muted'>
												<Text
													fontSize='12.5px'
													fontWeight='500'
													w={{ md: '160px' }}
													flexShrink={0}>
													{change.label || change.field}
												</Text>
												<Flex
													gap={2}
													align='baseline'
													// Short values read as "a → b" on one line; long ones stack,
													// or the arrow ends up floating between two walls of text.
													direction={
														(change.from?.length || 0) + (change.to?.length || 0) > LONG_VALUE
															? 'column'
															: 'row'
													}
													wrap='wrap'
													flex={1}
													minW={0}>
													<Value
														value={change.from}
														was
													/>
													<Text
														as='span'
														fontSize='12px'
														color='fg.subtle'>
														→
													</Text>
													<Value value={change.to} />
												</Flex>
											</Flex>
										))}
									</Box>
								)}
							</Box>
						</Flex>
					</Fragment>
				);
			})}

			{hasMore && (
				<Button
					mt={5}
					size='sm'
					variant='outline'
					loading={isFetching}
					onClick={() => setLimit(l => l + HISTORY_PAGE_SIZE)}>
					Show older ({(total - entries.length).toLocaleString()} more)
				</Button>
			)}

			{startsMidway && (
				<Text
					mt={5}
					fontSize='12px'
					color='fg.muted'>
					Nothing earlier was recorded — this record predates the history log.
				</Text>
			)}
		</Box>
	);
};

export default HistoryTimeline;
