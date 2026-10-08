'use client';

import { FC } from 'react';
import { Box, Button, Flex, IconButton, Input, Text, Textarea } from '@chakra-ui/react';
import { ArrowDown, ArrowUp, BookOpen, Plus, Trash2 } from 'lucide-react';
import { Panel } from '@/components/library/cl';
import {
	DEFAULT_GUIDELINES_TITLE,
	Guidelines,
	viewLabel,
} from '@/components/library/components/guidelines/Guidelines';
import { ToneTitle } from './areas';
import { DocLink } from './ui';

/**
 * The page's user guidelines (config `route.guidelines`): plain-words rules
 * for the people using it — "A void invoice can't be reversed". Read from the
 * table's ⋯ menu and from the add and edit forms. Words only: the rules the
 * server enforces are the settings' (Locked when, Can be changed later).
 */

const ICON = { size: 14, strokeWidth: 1.75 };

type Props = {
	value?: Guidelines;
	/** Undefined when every guideline is gone — the page then has none. */
	onChange: (g: Guidelines | undefined) => void;
	/** No table page yet: nowhere to read them. */
	disabled?: boolean;
};

const GuidelinesEditor: FC<Props> = ({ value, onChange, disabled }) => {
	const items = value?.items || [];
	const title = value?.title || '';
	const set = (patch: Partial<Guidelines>) => {
		const next: Guidelines = { ...value, ...patch };
		if (!next.title?.trim()) delete next.title;
		onChange(next.items?.length || next.title ? next : undefined);
	};
	const setItem = (i: number, patch: { title?: string; text?: string }) =>
		set({ items: items.map((x, j) => (j === i ? { ...x, ...patch } : x)) });
	const move = (i: number, d: -1 | 1) => {
		const next = [...items];
		[next[i], next[i + d]] = [next[i + d], next[i]];
		set({ items: next });
	};

	return (
		<Panel
			title={
				<ToneTitle
					icon={BookOpen}
					palette='purple'>
					User guidelines
				</ToneTitle>
			}
			subtitle='Rules in plain words for the people using this page — what can’t be undone, when a record locks, what to fill in first. They read them from the table’s ⋯ menu and while adding or editing.'
			actions={<DocLink section='guidelines' />}>
			<Flex
				direction='column'
				gap={4}>
				{disabled && (
					<Text
						fontSize='xs'
						color='fg.muted'>
						This page has no table yet, so there’s nowhere to show guidelines. Create its table on the Table tab
						first.
					</Text>
				)}
				<Box maxW='360px'>
					<Text
						fontSize='xs'
						fontWeight='600'
						mb={1.5}>
						Title
					</Text>
					<Input
						size='sm'
						value={title}
						disabled={disabled}
						placeholder={DEFAULT_GUIDELINES_TITLE}
						onChange={e => set({ title: e.target.value })}
					/>
					<Text
						fontSize='11px'
						color='fg.muted'
						mt={1}>
						The menu reads “{viewLabel(title.trim() || DEFAULT_GUIDELINES_TITLE)}”.
					</Text>
				</Box>

				{items.map((g, i) => (
					<Flex
						key={i}
						gap={3}
						align='flex-start'
						p={3}
						borderWidth='1px'
						borderRadius='md'>
						<Flex
							flexShrink={0}
							align='center'
							justify='center'
							w='22px'
							h='22px'
							mt='5px'
							borderRadius='full'
							bg='bg.muted'
							fontSize='11px'
							fontWeight='700'
							color='fg.muted'>
							{i + 1}
						</Flex>
						<Flex
							direction='column'
							gap={2}
							flex='1'
							minW={0}>
							<Input
								size='sm'
								value={g.title}
								disabled={disabled}
								placeholder='A void invoice can’t be reversed'
								onChange={e => setItem(i, { title: e.target.value })}
							/>
							<Textarea
								size='sm'
								rows={2}
								autoresize
								value={g.text || ''}
								disabled={disabled}
								placeholder='More detail, if it helps — why, and what to do instead (optional)'
								onChange={e => setItem(i, { text: e.target.value || undefined })}
							/>
						</Flex>
						<Flex
							direction='column'
							gap={0.5}
							flexShrink={0}>
							<IconButton
								size='2xs'
								variant='ghost'
								aria-label='Move up'
								title='Move up'
								disabled={disabled || i === 0}
								onClick={() => move(i, -1)}>
								<ArrowUp {...ICON} />
							</IconButton>
							<IconButton
								size='2xs'
								variant='ghost'
								aria-label='Move down'
								title='Move down'
								disabled={disabled || i === items.length - 1}
								onClick={() => move(i, 1)}>
								<ArrowDown {...ICON} />
							</IconButton>
							<IconButton
								size='2xs'
								variant='ghost'
								aria-label='Remove guideline'
								title='Remove'
								disabled={disabled}
								onClick={() => set({ items: items.filter((_, j) => j !== i) })}>
								<Trash2 {...ICON} />
							</IconButton>
						</Flex>
					</Flex>
				))}

				<Flex
					align='center'
					gap={3}
					flexWrap='wrap'>
					<Button
						size='xs'
						variant='outline'
						disabled={disabled}
						onClick={() => set({ items: [...items, { title: '' }] })}>
						<Plus {...ICON} />
						Add a guideline
					</Button>
					{!items.length && (
						<Text
							fontSize='11px'
							color='fg.muted'>
							None yet — the menu shows them once there’s one.
						</Text>
					)}
				</Flex>
			</Flex>
		</Panel>
	);
};

export default GuidelinesEditor;
