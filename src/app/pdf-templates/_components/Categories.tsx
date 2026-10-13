'use client';

import { FC, useEffect, useState } from 'react';
import { Box, Button, Flex, IconButton, Input, Text } from '@chakra-ui/react';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { PdfCategory, useDeletePdfCategoryMutation, useGetPdfCategoriesQuery, useSavePdfCategoryMutation } from '@/components/library';
import { ConfirmAction } from '@/components/library/cl';
import { toaster } from '@/components/ui/toaster';
import Shell from './Shell';
import { DocLink, ICON, errorOf } from './ui';

/**
 * Gallery categories (backend docs/pdf-templates D21): the chips the gallery
 * is browsed by, and the super admin's dialog that keeps them — add, rename,
 * describe, reorder, delete. A template's `kind` is a category's key.
 */

type Countable = { kind?: string };

/** "All · Invoices 4 · Receipts 3 · Quotations 2 · Other 1" — the gallery's filter. Empty categories are left out. */
export const CategoryChips: FC<{ categories: PdfCategory[]; templates: Countable[]; value: string; onChange: (key: string) => void }> = ({ categories, templates, value, onChange }) => {
	const known = new Set(categories.map(c => c.key));
	const count = (key: string) => templates.filter(t => (key === 'other' ? !known.has(t.kind || '') : t.kind === key)).length;
	const chips = [{ key: '', name: 'All', n: templates.length }, ...categories.map(c => ({ key: c.key, name: c.name, n: count(c.key) })), { key: 'other', name: 'Other', n: count('other') }].filter(
		c => !c.key || c.n > 0
	);
	if (chips.length <= 2) return null;
	return (
		<Flex
			gap={1.5}
			flexWrap='wrap'>
			{chips.map(c => (
				<Button
					key={c.key || 'all'}
					size='xs'
					variant={value === c.key ? 'solid' : 'outline'}
					onClick={() => onChange(c.key)}>
					{c.name}
					<Text
						as='span'
						opacity={0.6}>
						{c.n}
					</Text>
				</Button>
			))}
		</Flex>
	);
};

/** Templates in the chosen category ('' = all, 'other' = none of the categories). */
export const inCategory = <T extends Countable>(templates: T[], categories: PdfCategory[], key: string): T[] => {
	if (!key) return templates;
	if (key === 'other') {
		const known = new Set(categories.map(c => c.key));
		return templates.filter(t => !known.has(t.kind || ''));
	}
	return templates.filter(t => t.kind === key);
};

const Row: FC<{ c: PdfCategory; first: boolean; last: boolean; onMove: (by: -1 | 1) => void; onRemove: () => void }> = ({ c, first, last, onMove, onRemove }) => {
	const [save] = useSavePdfCategoryMutation();
	const [name, setName] = useState(c.name);
	const [description, setDescription] = useState(c.description);
	useEffect(() => {
		setName(c.name);
		setDescription(c.description);
	}, [c.name, c.description]);
	const commit = async () => {
		if (name.trim() === c.name && description.trim() === c.description) return;
		if (!name.trim()) return setName(c.name);
		try {
			await save({ key: c.key, name: name.trim(), description: description.trim() }).unwrap();
		} catch (e) {
			toaster.create({ type: 'error', title: 'Not saved', description: errorOf(e) });
		}
	};
	return (
		<Flex
			gap={2}
			align='flex-start'
			py={2}
			borderBottomWidth='1px'
			borderColor='border'>
			<Box
				flex='1'
				minW={0}>
				<Flex
					gap={2}
					align='center'>
					<Input
						size='sm'
						value={name}
						maxLength={60}
						onChange={e => setName(e.target.value)}
						onBlur={commit}
						aria-label='Name'
					/>
					<Text
						fontSize='11px'
						color='fg.subtle'
						fontFamily='mono'
						flexShrink={0}
						title='The key templates use as their kind'>
						{c.key}
					</Text>
				</Flex>
				<Input
					size='xs'
					mt={1.5}
					value={description}
					maxLength={300}
					placeholder='What goes here (optional)'
					onChange={e => setDescription(e.target.value)}
					onBlur={commit}
					aria-label='Description'
				/>
			</Box>
			<IconButton
				size='xs'
				variant='ghost'
				aria-label='Move up'
				disabled={first}
				onClick={() => onMove(-1)}>
				<ArrowUp {...ICON} />
			</IconButton>
			<IconButton
				size='xs'
				variant='ghost'
				aria-label='Move down'
				disabled={last}
				onClick={() => onMove(1)}>
				<ArrowDown {...ICON} />
			</IconButton>
			<IconButton
				size='xs'
				variant='ghost'
				aria-label='Delete'
				color='red.500'
				_dark={{ color: 'red.300' }}
				onClick={onRemove}>
				<Trash2 {...ICON} />
			</IconButton>
		</Flex>
	);
};

/** The super admin's categories: what the gallery is browsed by, for every project. */
export const CategoriesDialog: FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
	const { data } = useGetPdfCategoriesQuery(undefined, { skip: !open });
	const [save, { isLoading: adding }] = useSavePdfCategoryMutation();
	const [remove, { isLoading: removing }] = useDeletePdfCategoryMutation();
	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [deleting, setDeleting] = useState<PdfCategory | null>(null);
	const list = data?.categories || [];

	const add = async () => {
		if (!name.trim()) return;
		try {
			await save({ name: name.trim(), description: description.trim() }).unwrap();
			setName('');
			setDescription('');
		} catch (e) {
			toaster.create({ type: 'error', title: 'Not added', description: errorOf(e) });
		}
	};
	// Moving swaps the two orders; the rest keep theirs.
	const move = async (i: number, by: -1 | 1) => {
		const a = list[i];
		const b = list[i + by];
		if (!a || !b) return;
		try {
			await save({ key: a.key, order: i + by }).unwrap();
			await save({ key: b.key, order: i }).unwrap();
			// Settle everyone else into 0…n so later moves stay simple.
			for (const [j, c] of list.entries()) if (j !== i && j !== i + by && c.order !== j) await save({ key: c.key, order: j }).unwrap();
		} catch (e) {
			toaster.create({ type: 'error', title: 'Not moved', description: errorOf(e) });
		}
	};

	return (
		<>
			<Shell
				open={open}
				onClose={onClose}
				maxW='560px'
				title='Gallery categories'
				description='What the gallery is browsed by — for every project. A template’s category is set in its designer (Document → Category).'
				footer={
					<>
						<DocLink section='gallery' />
						<Button
							size='sm'
							ml='auto'
							onClick={onClose}>
							Done
						</Button>
					</>
				}>
				<Box>
					{list.map((c, i) => (
						<Row
							key={c.key}
							c={c}
							first={i === 0}
							last={i === list.length - 1}
							onMove={by => move(i, by)}
							onRemove={() => setDeleting(c)}
						/>
					))}
					<Flex
						gap={2}
						mt={3}
						align='flex-start'>
						<Box flex='1'>
							<Input
								size='sm'
								value={name}
								maxLength={60}
								placeholder='New category — Delivery notes'
								onChange={e => setName(e.target.value)}
								onKeyDown={e => e.key === 'Enter' && add()}
							/>
							<Input
								size='xs'
								mt={1.5}
								value={description}
								maxLength={300}
								placeholder='What goes here (optional)'
								onChange={e => setDescription(e.target.value)}
								onKeyDown={e => e.key === 'Enter' && add()}
							/>
						</Box>
						<Button
							size='sm'
							variant='outline'
							loading={adding}
							disabled={!name.trim()}
							onClick={add}>
							<Plus {...ICON} />
							Add
						</Button>
					</Flex>
				</Box>
			</Shell>
			<ConfirmAction
				isOpen={!!deleting}
				onClose={() => setDeleting(null)}
				title={`Delete “${deleting?.name}”?`}
				consequence='Its templates stay in the gallery, shown under Other until you give them another category.'
				confirmLabel='Delete'
				destructive
				isLoading={removing}
				onConfirm={async () => {
					try {
						await remove(deleting!.key).unwrap();
						setDeleting(null);
					} catch (e) {
						toaster.create({ type: 'error', title: 'Not deleted', description: errorOf(e) });
					}
				}}
			/>
		</>
	);
};
