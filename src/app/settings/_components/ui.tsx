'use client';

import { Box, Flex, Grid, Text } from '@chakra-ui/react';
import { Lock } from 'lucide-react';
import { FC, ReactNode } from 'react';

/**
 * One settings card: title and description, the content, and a footer ledge
 * with a note on the left and the card's actions on the right — so every
 * card saves the same way, from the same place.
 */
export const SettingsCard: FC<{
	id: string;
	icon: ReactNode;
	title: string;
	description?: ReactNode;
	note?: ReactNode;
	actions?: ReactNode;
	children?: ReactNode;
	as?: any;
	onSubmit?: (e: any) => void;
}> = ({ id, icon, title, description, note, actions, children, as, onSubmit }) => (
	<Box
		as={as}
		id={id}
		onSubmit={onSubmit}
		scrollMarginTop='80px'
		borderWidth='1px'
		borderColor='border'
		borderRadius='xl'
		bg='bg.panel'
		overflow='hidden'>
		<Flex
			gap={3}
			align='flex-start'
			px={{ base: 4, md: 6 }}
			pt={{ base: 4, md: 5 }}
			pb={children ? 0 : { base: 4, md: 5 }}>
			<Flex
				flexShrink={0}
				w='32px'
				h='32px'
				align='center'
				justify='center'
				borderRadius='lg'
				borderWidth='1px'
				borderColor='border'
				bg='bg.subtle'
				color='fg.muted'>
				{icon}
			</Flex>
			<Box minW={0}>
				<Text
					fontSize='15px'
					fontWeight='600'
					letterSpacing='-0.01em'
					lineHeight='1.4'>
					{title}
				</Text>
				{description && (
					<Text
						mt={0.5}
						fontSize='13px'
						color='fg.muted'
						lineHeight='1.5'>
						{description}
					</Text>
				)}
			</Box>
		</Flex>

		{children && (
			<Box
				px={{ base: 4, md: 6 }}
				pt={5}
				pb={{ base: 4, md: 6 }}>
				{children}
			</Box>
		)}

		{(note || actions) && (
			<Flex
				align='center'
				justify='space-between'
				gap={3}
				flexWrap='wrap'
				px={{ base: 4, md: 6 }}
				py={3}
				borderTopWidth='1px'
				borderColor='border.muted'
				bg='bg.subtle'>
				<Text
					fontSize='12px'
					color='fg.muted'
					minW={0}>
					{note}
				</Text>
				<Flex
					gap={2}
					ml='auto'>
					{actions}
				</Flex>
			</Flex>
		)}
	</Box>
);

/** A label and its value (or its input), one row of a card's list. */
export const Row: FC<{ label: string; hint?: ReactNode; children: ReactNode }> = ({ label, hint, children }) => (
	<Grid
		templateColumns={{ base: '1fr', md: '180px minmax(0, 1fr)' }}
		gap={{ base: 1.5, md: 6 }}
		alignItems='center'
		py={3.5}
		borderTopWidth='1px'
		borderColor='border.muted'
		_first={{ borderTopWidth: 0, pt: 0 }}
		_last={{ pb: 0 }}>
		<Box>
			<Text
				fontSize='13px'
				fontWeight='500'>
				{label}
			</Text>
			{hint && (
				<Text
					fontSize='12px'
					color='fg.muted'>
					{hint}
				</Text>
			)}
		</Box>
		<Box
			minW={0}
			fontSize='13px'>
			{children}
		</Box>
	</Grid>
);

export const Value: FC<{ children?: ReactNode; locked?: boolean }> = ({ children, locked }) => (
	<Flex
		align='center'
		gap={2}
		minH='32px'
		color={children ? 'fg' : 'fg.subtle'}>
		<Text truncate>{children || 'Not set'}</Text>
		{locked && (
			<Box
				as='span'
				color='fg.subtle'
				flexShrink={0}
				title="Can't be changed here">
				<Lock size={12} />
			</Box>
		)}
	</Flex>
);

