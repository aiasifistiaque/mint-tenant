'use client';

import { FC, useRef, useState } from 'react';
import { Box, Button, Flex, Grid, IconButton, Menu, Portal, Text } from '@chakra-ui/react';
import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, Copy, Plus, Puzzle, Trash2 } from 'lucide-react';
import FormInput from '../../../create-page/inputs/form-input/FormInput';
import getOnChangeHandler from '../../../functions/getOnChangeHandler';
import { HelperText } from '../../..';

/**
 * Content blocks (backend docs/cms D4): a list of components in any order —
 * a page's hero, text, gallery, questions. "Add" offers the components the
 * field takes; each item opens to its own fields (the component's, as the
 * backend generated them) and can move up or down, be copied or removed.
 * Stored as `[{ _key, __component, …its fields }]`; the `_key` stays with an
 * item however it moves (the site and the builder bind to it).
 */

type BlockType = { uid: string; title: string; description?: string; dataModel: any[] };
type Item = Record<string, any> & { _key?: string; __component: string };

type Props = {
	name: string;
	label?: string;
	value: any;
	onChange: (e: any) => void;
	isRequired?: boolean;
	helper?: string;
	blocks?: BlockType[];
	/** The most items it takes. */
	limit?: number;
	isDisabled?: boolean;
};

const newKey = () => Math.random().toString(36).slice(2, 10);

/** What an item is about at a glance: its first filled-in text. */
const previewOf = (item: Item, type?: BlockType) => {
	for (const f of type?.dataModel || []) {
		const v = item?.[f.name];
		if (typeof v === 'string' && v.trim()) return v.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);
	}
	return '';
};

export const BlockFields: FC<{ item: Item; type?: BlockType; onChange: (next: Item) => void; disabled?: boolean }> = ({ item, type, onChange, disabled }) => {
	// The latest item, so two changes in one tick both land.
	const latest = useRef<Item>(item);
	latest.current = item;
	const setFormData = (u: any) => {
		const next = typeof u === 'function' ? u(latest.current) : u;
		latest.current = next;
		onChange(next);
	};
	const setChangedData = () => {};
	if (!type)
		return (
			<Text
				fontSize='13px'
				color='fg.muted'>
				This block’s component (“{item.__component}”) isn’t one this field takes any more — remove it, or add the component back to the field.
			</Text>
		);
	return (
		<Grid
			templateColumns={{ base: '1fr', md: 'repeat(2, minmax(0, 1fr))' }}
			gap={3}>
			{type.dataModel.map((f: any) => (
				<Box
					key={f.name}
					gridColumn={['textarea', 'editor', 'image', 'image-array', 'file', 'file-array', 'section-data-array', 'section-object'].includes(f.type) ? { md: 'span 2' } : undefined}>
					<FormInput
						formData={latest.current}
						setFormData={setFormData}
						setChangedData={setChangedData}
						isRequired={f.isRequired || false}
						name={f.name}
						label={f.label}
						type={disabled ? 'read-only' : f.type}
						value={latest.current?.[f.name] ?? (f.type === 'checkbox' ? false : '')}
						onChange={getOnChangeHandler({ type: f.type, key: f.name, formData: latest.current, setFormData, setChangedData })}
						options={f.options}
						// A link to records inside a component (backend docs/cms CMS-03b): the model it picks from.
						model={f.model}
						item={f}
					/>
				</Box>
			))}
		</Grid>
	);
};

const VBlocks: FC<Props> = ({ name, label, value, onChange, isRequired, helper, blocks = [], limit, isDisabled }) => {
	const items: Item[] = Array.isArray(value) ? value : [];
	const [open, setOpen] = useState<Set<string>>(() => new Set(items.length === 1 && items[0]?._key ? [items[0]._key] : []));
	const typeOf = (uid: string) => blocks.find(b => b.uid === uid);
	const set = (next: Item[]) => onChange({ target: { name, value: next } });
	const toggle = (key: string) =>
		setOpen(o => {
			const n = new Set(o);
			if (n.has(key)) n.delete(key);
			else n.add(key);
			return n;
		});
	const add = (uid: string) => {
		const _key = newKey();
		set([...items, { __component: uid, _key }]);
		setOpen(o => new Set(o).add(_key));
	};
	const move = (i: number, by: number) => {
		const j = i + by;
		if (j < 0 || j >= items.length) return;
		const next = [...items];
		[next[i], next[j]] = [next[j], next[i]];
		set(next);
	};
	const full = typeof limit === 'number' && items.length >= limit;

	return (
		<Flex
			direction='column'
			gap={2}
			w='full'>
			{label && (
				<Text
					fontSize='sm'
					fontWeight='600'>
					{label}
					{isRequired && (
						<Text
							as='span'
							color='red.500'>
							{' '}
							*
						</Text>
					)}
				</Text>
			)}
			{items.map((item, i) => {
				const key = item._key || `i${i}`;
				const type = typeOf(item.__component);
				const isOpen = open.has(key);
				const preview = previewOf(item, type);
				return (
					<Box
						key={key}
						borderWidth='1px'
						borderColor='border'
						borderRadius='lg'
						bg='bg.panel'>
						<Flex
							align='center'
							gap={2}
							px={3}
							py={2}>
							<Flex
								as='button'
								flex={1}
								minW={0}
								align='center'
								gap={2}
								textAlign='left'
								cursor='pointer'
								aria-expanded={isOpen}
								onClick={() => toggle(key)}>
								{isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
								<Flex
									boxSize='24px'
									flexShrink={0}
									align='center'
									justify='center'
									borderRadius='md'
									bg='violet.subtle'
									color='violet.fg'>
									<Puzzle size={13} />
								</Flex>
								<Text
									fontSize='13px'
									fontWeight='600'
									flexShrink={0}>
									{type?.title || item.__component}
								</Text>
								{preview && (
									<Text
										fontSize='12.5px'
										color='fg.muted'
										truncate>
										{preview}
									</Text>
								)}
							</Flex>
							{!isDisabled && (
								<Flex gap={0.5}>
									<IconButton
										size='2xs'
										variant='ghost'
										aria-label='Move up'
										disabled={i === 0}
										onClick={() => move(i, -1)}>
										<ArrowUp size={13} />
									</IconButton>
									<IconButton
										size='2xs'
										variant='ghost'
										aria-label='Move down'
										disabled={i === items.length - 1}
										onClick={() => move(i, 1)}>
										<ArrowDown size={13} />
									</IconButton>
									<IconButton
										size='2xs'
										variant='ghost'
										aria-label='Copy'
										disabled={full}
										onClick={() => {
											const _key = newKey();
											const next = [...items];
											next.splice(i + 1, 0, { ...item, _key });
											set(next);
										}}>
										<Copy size={13} />
									</IconButton>
									<IconButton
										size='2xs'
										variant='ghost'
										aria-label='Remove'
										onClick={() => set(items.filter((_, j) => j !== i))}>
										<Trash2 size={13} />
									</IconButton>
								</Flex>
							)}
						</Flex>
						{isOpen && (
							<Box
								px={3}
								pb={3}
								pt={1}
								borderTopWidth='1px'
								borderColor='border.muted'>
								<BlockFields
									item={item}
									type={type}
									disabled={isDisabled}
									onChange={next => set(items.map((x, j) => (j === i ? next : x)))}
								/>
							</Box>
						)}
					</Box>
				);
			})}
			{!items.length && (
				<Text
					fontSize='13px'
					color='fg.muted'
					px={1}>
					Nothing here yet — add the first one.
				</Text>
			)}
			{!isDisabled && (
				<Menu.Root positioning={{ placement: 'bottom-start' }}>
					<Menu.Trigger asChild>
						<Button
							alignSelf='flex-start'
							size='xs'
							variant='outline'
							disabled={full || !blocks.length}>
							<Plus size={13} />
							Add
						</Button>
					</Menu.Trigger>
					<Portal>
						<Menu.Positioner>
							<Menu.Content maxW='320px'>
								{blocks.map(b => (
									<Menu.Item
										key={b.uid}
										value={b.uid}
										onClick={() => add(b.uid)}>
										<Box minW={0}>
											<Text
												fontSize='13px'
												fontWeight='600'>
												{b.title}
											</Text>
											{b.description && (
												<Text
													fontSize='12px'
													color='fg.muted'
													lineClamp={2}>
													{b.description}
												</Text>
											)}
										</Box>
									</Menu.Item>
								))}
							</Menu.Content>
						</Menu.Positioner>
					</Portal>
				</Menu.Root>
			)}
			{full && (
				<Text
					fontSize='12px'
					color='fg.muted'>
					It takes at most {limit}.
				</Text>
			)}
			{helper && <HelperText>{helper}</HelperText>}
		</Flex>
	);
};

export default VBlocks;
