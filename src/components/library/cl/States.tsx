'use client';

import { FC, ReactNode } from 'react';
import { Box, Button, Flex, Skeleton, Text } from '@chakra-ui/react';

/**
 * The four states every async surface here needs.
 *
 * Kept together because the failure mode is forgetting one, not writing one
 * badly — a page that handles loading and success and then renders an empty
 * table for both "no results" and "request failed" is the usual outcome.
 */

type EmptyStateProps = {
	title: string;
	description?: string;
	action?: ReactNode;
};

export const EmptyState: FC<EmptyStateProps> = ({ title, description, action }) => (
	<Flex
		direction='column'
		align='center'
		justify='center'
		gap={2}
		py={10}
		px={4}
		textAlign='center'>
		<Text
			fontSize='sm'
			fontWeight='600'>
			{title}
		</Text>
		{description && (
			<Text
				fontSize='xs'
				color='fg.muted'
				maxW='380px'>
				{description}
			</Text>
		)}
		{action && <Box mt={2}>{action}</Box>}
	</Flex>
);

type ErrorStateProps = {
	error?: any;
	onRetry?: () => void;
	/** Overrides the message derived from `error`. */
	message?: string;
};

/**
 * A 403 here is almost always the config/logs permission split rather than a
 * real problem, so it gets its own wording — "Could not load" would send
 * someone debugging a working system.
 */
export const ErrorState: FC<ErrorStateProps> = ({ error, onRetry, message }) => {
	const status = error?.status;
	const serverMessage = error?.data?.message;

	const text =
		message ||
		(status === 403
			? serverMessage ||
				'You do not have permission to view this. It needs the Heroku config permission, which is separate from general Heroku access.'
			: status === 429
				? 'Heroku’s rate limit for this API key has been reached. It resets hourly — try again shortly.'
				: serverMessage || 'Something went wrong loading this.');

	return (
		<Flex
			direction='column'
			align='center'
			justify='center'
			gap={3}
			py={10}
			px={4}
			textAlign='center'>
			<Text
				fontSize='sm'
				color='fg.error'
				maxW='460px'>
				{text}
			</Text>
			{onRetry && status !== 403 && (
				<Button
					size='xs'
					variant='outline'
					onClick={onRetry}>
					Retry
				</Button>
			)}
		</Flex>
	);
};

/**
 * Shaped like the table it replaces, not a centred spinner: the layout should
 * not jump when the data lands.
 */
export const TableSkeleton: FC<{ rows?: number; cols?: number }> = ({ rows = 5, cols = 4 }) => (
	<Box p={4}>
		<Flex
			direction='column'
			gap={3}>
			{Array.from({ length: rows }).map((_, rowIndex) => (
				<Flex
					key={rowIndex}
					gap={4}
					align='center'>
					{Array.from({ length: cols }).map((__, colIndex) => (
						<Skeleton
							key={colIndex}
							h='14px'
							flex={colIndex === 0 ? 2 : 1}
						/>
					))}
				</Flex>
			))}
		</Flex>
	</Box>
);

export const DetailSkeleton: FC<{ rows?: number }> = ({ rows = 6 }) => (
	<Flex
		direction='column'
		gap={4}>
		{Array.from({ length: rows }).map((_, index) => (
			<Flex
				key={index}
				gap={6}>
				<Skeleton
					h='12px'
					w='120px'
				/>
				<Skeleton
					h='12px'
					flex={1}
					maxW='320px'
				/>
			</Flex>
		))}
	</Flex>
);
