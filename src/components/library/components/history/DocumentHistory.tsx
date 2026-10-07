'use client';

import { FC } from 'react';
import { Box, Flex, Skeleton, Text } from '@chakra-ui/react';
import moment from 'moment';
import { useGetDocumentHistoryQuery } from '../../store';

const ACTION_COLOR: Record<string, string> = {
	create: 'green',
	update: 'orange',
	delete: 'red',
};

type Props = {
	/** The record's own id — `history.document` on every entry about it. */
	id: string;
	/** Skipped entirely when this is the history page itself. */
	path?: string;
	/** Omit the heading when the caller already renders one. */
	heading?: boolean;
};

/**
 * One record's activity, newest first, for the view drawer.
 *
 * Reads `history/g/document/:id` rather than filtering the global list client
 * side, so a record with a long trail doesn't have to pull the whole table
 * down to show its own six entries.
 */
const DocumentHistory: FC<Props> = ({ id, path, heading = true }) => {
	// A history entry has no history of its own.
	const skip = !id || path === 'history';

	const { data, isFetching } = useGetDocumentHistoryQuery({ id }, { skip });

	if (skip) return null;

	const entries: any[] = data?.doc || [];

	return (
		<Box pt={2}>
			{heading && (
				<Text {...headingCss}>History</Text>
			)}

			{isFetching ? (
				<Flex
					flexDir='column'
					gap={2}>
					{[0, 1, 2].map(i => (
						<Skeleton
							key={i}
							h='14px'
							borderRadius='full'
						/>
					))}
				</Flex>
			) : entries.length === 0 ? (
				<Text {...emptyCss}>No recorded activity yet.</Text>
			) : (
				<Flex
					flexDir='column'
					gap={0}>
					{entries.map((entry: any) => (
						<Flex
							key={entry?._id}
							gap={3}
							align='flex-start'
							py={2}>
							{/* The rail: a dot per entry, joined by the border on the
							    column so it reads as one thread rather than a list. */}
							<Flex
								flexShrink={0}
								mt='6px'
								w='7px'
								h='7px'
								borderRadius='full'
								bg={`${ACTION_COLOR[entry?.action] || 'gray'}.solid`}
							/>
							<Box minW={0}>
								<Text {...textCss}>{entry?.text}</Text>
								<Text {...timeCss}>{moment(entry?.createdAt).calendar()}</Text>
							</Box>
						</Flex>
					))}
				</Flex>
			)}
		</Box>
	);
};

const headingCss: any = {
	fontSize: '11px',
	fontWeight: '700',
	letterSpacing: '0.06em',
	textTransform: 'uppercase',
	color: 'fg.muted',
	mb: 2,
};

const textCss: any = {
	fontSize: '13px',
	color: 'text.light',
	_dark: { color: 'text.dark' },
	lineHeight: '1.5',
};

const timeCss: any = { fontSize: '12px', color: 'fg.muted', mt: 0.5 };

const emptyCss: any = { fontSize: '13px', color: 'fg.muted' };

export default DocumentHistory;
