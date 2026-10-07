'use client';

import { FC } from 'react';
import { Box, Button, Flex, IconButton, Menu, Portal, Tooltip } from '@chakra-ui/react';
import { ArrowDown, ArrowUp, Check } from 'lucide-react';
import { sizes } from '../../config';

export const SORT_FIELDS = [
	{ key: 'name', label: 'Name', asc: 'A to Z', desc: 'Z to A' },
	{ key: 'createdAt', label: 'Date added', asc: 'Oldest first', desc: 'Newest first' },
	{ key: 'size', label: 'Size', asc: 'Smallest first', desc: 'Largest first' },
	{ key: 'type', label: 'Type', asc: 'A to Z', desc: 'Z to A' },
] as const;

export const SORT_VALUES = SORT_FIELDS.flatMap(f => [f.key, `-${f.key}`]);

/** Drive's menu look: small grey section headings, a check beside the current choice. */
const GroupLabel: FC<{ children: string }> = ({ children }) => (
	<Menu.ItemGroupLabel
		px={3}
		pt={2}
		pb={1}
		fontSize='xs'
		fontWeight='500'
		color='fg.muted'>
		{children}
	</Menu.ItemGroupLabel>
);

const Option: FC<{ value: string; label: string }> = ({ value, label }) => (
	<Menu.RadioItem
		value={value}
		px={3}
		py={2}
		gap={3}
		fontSize='sm'
		cursor='pointer'>
		{/* The check sits in a fixed slot so labels line up whether or not they're checked. */}
		<Box
			w='16px'
			display='flex'
			justifyContent='center'>
			<Menu.ItemIndicator>
				<Check size={16} />
			</Menu.ItemIndicator>
		</Box>
		<Menu.ItemText>{label}</Menu.ItemText>
	</Menu.RadioItem>
);

/**
 * The media page's sort, laid out like Google Drive's: the sort field as a
 * text button ("Name") that opens a dropdown with "Sort by" and "Sort
 * direction" sections, and an arrow beside it that flips the direction in one
 * click. Folders always stay above files.
 */
const SortModal: FC<{ value: string; onChange: (value: string) => void }> = ({ value, onChange }) => {
	const activeKey = value.replace(/^-/, '');
	const desc = value.startsWith('-');
	const active = SORT_FIELDS.find(f => f.key === activeKey) || SORT_FIELDS[0];

	const pickField = (key: string) => {
		if (key === activeKey) return;
		// Dates and sizes are most useful newest/biggest first, like Drive's "Last modified".
		onChange(key === 'createdAt' || key === 'size' ? `-${key}` : key);
	};

	return (
		<Flex
			align='center'
			gap={0.5}>
			<Menu.Root positioning={{ placement: 'bottom-end' }}>
				<Menu.Trigger asChild>
					<Button
						size='sm'
						variant='ghost'
						h={sizes.SEARCH_BAR_HEIGHT}
						px={3}
						borderRadius='full'
						fontWeight='500'
						color='fg'
						aria-label={`Sort by ${active.label}`}>
						{active.label}
					</Button>
				</Menu.Trigger>
				<Portal>
					<Menu.Positioner>
						<Menu.Content
							minW='220px'
							py={1.5}>
							<Menu.ItemGroup>
								<GroupLabel>Sort by</GroupLabel>
								<Menu.RadioItemGroup
									value={activeKey}
									onValueChange={e => pickField(e.value)}>
									{SORT_FIELDS.map(f => (
										<Option
											key={f.key}
											value={f.key}
											label={f.label}
										/>
									))}
								</Menu.RadioItemGroup>
							</Menu.ItemGroup>
							<Menu.Separator my={1.5} />
							<Menu.ItemGroup>
								<GroupLabel>Sort direction</GroupLabel>
								<Menu.RadioItemGroup
									value={desc ? 'desc' : 'asc'}
									onValueChange={e => onChange(e.value === 'desc' ? `-${activeKey}` : activeKey)}>
									<Option
										value='asc'
										label={active.asc}
									/>
									<Option
										value='desc'
										label={active.desc}
									/>
								</Menu.RadioItemGroup>
							</Menu.ItemGroup>
						</Menu.Content>
					</Menu.Positioner>
				</Portal>
			</Menu.Root>

			<Tooltip.Root
				lazyMount
				positioning={{ placement: 'bottom' }}>
				<Tooltip.Trigger asChild>
					<IconButton
						aria-label='Reverse sort direction'
						size='sm'
						variant='ghost'
						h={sizes.SEARCH_BAR_HEIGHT}
						w={sizes.SEARCH_BAR_HEIGHT}
						minW={sizes.SEARCH_BAR_HEIGHT}
						borderRadius='full'
						color='fg'
						onClick={() => onChange(desc ? activeKey : `-${activeKey}`)}>
						{desc ? <ArrowDown size={18} /> : <ArrowUp size={18} />}
					</IconButton>
				</Tooltip.Trigger>
				<Tooltip.Positioner>
					<Tooltip.Content>
						{desc ? active.desc : active.asc} · Reverse sort direction
					</Tooltip.Content>
				</Tooltip.Positioner>
			</Tooltip.Root>
		</Flex>
	);
};

export default SortModal;
