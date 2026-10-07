'use client';

import { FC, useEffect, useMemo, useRef, useState } from 'react';
import { Badge, Box, Button, CloseButton, Dialog, Flex, Grid, Input, Portal, Text, Textarea } from '@chakra-ui/react';
import { Calculator, CheckCircle2, CircleAlert } from 'lucide-react';
import { AlertDialogContent, AlertDialogHeader, ModalFooter } from '@/components/library';
import DiscardButton from '@/components/library/components/buttons/DiscardButton';
import { Dropdown } from '@/components/library/cl';
import { AGGREGATES, FUNCTIONS, FieldInfo, checkFormula, evaluate } from '@/components/library/functions/formula';

/**
 * Writing a formula field's formula — `due = total - paid`. Two ways in, one
 * formula: pick fields, operators and functions from the buttons (each goes
 * in at the cursor), or type it. Either way it's checked as it changes —
 * that it parses, that every name is a number field, that it doesn't use
 * itself — with the problem pointed at, and a small calculator to try it on
 * sample numbers. The server runs the same checks before it publishes.
 */

type Props = {
	isOpen: boolean;
	onClose: () => void;
	onSave: (formula: string) => void;
	/** The formula field, and what it's called. */
	fieldKey: string;
	fieldTitle?: string;
	formula: string;
	/** Every settings field, with whether it holds a number. */
	fields: FieldInfo[];
};

const OPS = [
	{ label: '+', insert: '+', hint: 'Add' },
	{ label: '−', insert: '-', hint: 'Subtract' },
	{ label: '×', insert: '*', hint: 'Multiply' },
	{ label: '÷', insert: '/', hint: 'Divide (by 0 leaves it empty)' },
	{ label: '%', insert: '%', hint: 'Remainder' },
	{ label: '(', insert: '(', hint: 'Open bracket' },
	{ label: ')', insert: ')', hint: 'Close bracket' },
];

const FormulaModal: FC<Props> = ({ isOpen, onClose, onSave, fieldKey, fieldTitle, formula, fields }) => {
	const [text, setText] = useState(formula);
	const latest = useRef(formula);
	const change = (v: string) => {
		latest.current = v;
		setText(v);
	};
	const [sample, setSample] = useState<Record<string, string>>({});
	const area = useRef<HTMLTextAreaElement>(null);
	const cursor = useRef<number | null>(null);

	useEffect(() => {
		if (isOpen) {
			change(formula);
			setSample({});
			cursor.current = null;
		}
	}, [isOpen, formula]);

	const name = fieldTitle || fieldKey;
	// What the picker inserts: a number field as is; a number in a list's rows
	// added up (`sum(items.total)`); a list, its row count (`count(items)`).
	const usable = fields
		.filter(f => f.key !== fieldKey && (f.numeric || f.list))
		.map(f => {
			const label = f.label && f.label !== f.key ? f.label : f.key;
			if (f.list) return { key: f.key, insert: `count(${f.key})`, label: `Number of rows in ${label} — count(${f.key})` };
			if (f.inList) return { key: f.key, insert: `sum(${f.key})`, label: `Sum of ${label} in ${labelOfList(f.inList)} — sum(${f.key})` };
			return { key: f.key, insert: f.key, label: label === f.key ? f.key : `${label} (${f.key})` };
		});
	const hasLists = fields.some(f => f.list);
	const checked = useMemo(() => (text.trim() ? checkFormula(text, fields, fieldKey) : null), [text, fields, fieldKey]);
	const labelOf = (key: string) => fields.find(f => f.key === key)?.label || key;
	function labelOfList(key: string) {
		return fields.find(f => f.key === key)?.label || key;
	}
	const infoOf = (key: string) => fields.find(f => f.key === key);
	const result = checked?.ok && checked.tree ? evaluate(checked.tree, Object.fromEntries(checked.refs.map(r => [r, sample[r] ?? '']))) : null;

	/** Puts `token` in at the cursor (or the end), spaced, and keeps the cursor after it. */
	const insert = (token: string) => {
		// From the ref, not the render's `text`: two quick clicks both see the latest.
		const prev = latest.current;
		const at = Math.min(cursor.current ?? prev.length, prev.length);
		// A closing bracket hugs what it closes.
		const before = token === ')' ? prev.slice(0, at).replace(/\s+$/, '') : prev.slice(0, at);
		const after = prev.slice(at).replace(/^\s+/, '');
		const pad = /[\s(]$/.test(before) || !before ? '' : ' ';
		const piece = token === ')' ? token : `${pad}${token}${token.endsWith('(') ? '' : ' '}`;
		const pos = before.length + piece.length;
		change(`${before}${piece}${after}`);
		cursor.current = pos;
		requestAnimationFrame(() => {
			area.current?.focus();
			area.current?.setSelectionRange(pos, pos);
		});
	};

	const remember = () => (cursor.current = area.current?.selectionStart ?? null);
	const firstAt = checked?.errors.find(e => typeof e.at === 'number')?.at;

	return (
		<Dialog.Root
			size='lg'
			// Pinned to the top: it grows and shrinks as the formula is checked
			// (errors, "Try it"), and centred, the buttons moved under the pointer.
			placement='top'
			open={isOpen}
			onOpenChange={e => !e.open && onClose()}>
			<Portal>
				<Dialog.Backdrop />
				<Dialog.Positioner>
					<AlertDialogContent
						px={0}
						borderWidth='1px'
						borderColor='border'>
						<AlertDialogHeader>
							<Flex
								as='span'
								align='center'
								gap={2}>
								<Calculator size={16} />
								Formula for {name}
							</Flex>
						</AlertDialogHeader>
						<Dialog.CloseTrigger
							asChild
							top={2}
							right={2}>
							<CloseButton size='sm' />
						</Dialog.CloseTrigger>

						<Dialog.Body p={4}>
							<Flex
								direction='column'
								gap={4}>
								<Text
									fontSize='sm'
									color='fg.muted'>
									{name} is calculated from other number fields each time a record is saved, and can&apos;t be
									typed in. An empty field counts as 0.
									{hasLists &&
										' A list’s rows are used through sum(), avg() and count() — e.g. sum(items.total) adds up the total of every row.'}
								</Text>

								{/* Build it from pieces… */}
								<Flex
									direction='column'
									gap={2}>
									<Flex
										gap={2}
										align='center'
										flexWrap='wrap'>
										<Dropdown
											size='sm'
											w='240px'
											value=''
											placeholder={usable.length ? 'Insert a field…' : 'No number fields to use'}
											disabled={!usable.length}
											onChange={(v: string) => v && insert(v)}>
											{usable.map(f => (
												<option
													key={f.key}
													value={f.insert}>
													{f.label}
												</option>
											))}
										</Dropdown>
										<Flex gap={1}>
											{OPS.map(o => (
												<Button
													key={o.label}
													size='sm'
													variant='outline'
													minW='36px'
													px={0}
													fontFamily='mono'
													title={o.hint}
													onClick={() => insert(o.insert)}>
													{o.label}
												</Button>
											))}
										</Flex>
									</Flex>
									<Flex
										gap={1}
										flexWrap='wrap'
										align='center'>
										<Text
											fontSize='xs'
											color='fg.muted'
											mr={1}>
											Functions
										</Text>
										{[...Object.entries(FUNCTIONS), ...(hasLists ? Object.entries(AGGREGATES) : [])].map(([fn, spec]) => (
											<Button
												key={fn}
												size='xs'
												variant='ghost'
												fontFamily='mono'
												title={spec.hint}
												onClick={() => insert(`${fn}(`)}>
												{fn}()
											</Button>
										))}
										<Button
											size='xs'
											variant='ghost'
											color='fg.muted'
											ml='auto'
											disabled={!text}
											onClick={() => {
												change('');
												cursor.current = 0;
											}}>
											Clear
										</Button>
									</Flex>
								</Flex>

								{/* …or type it. */}
								<Box>
									<Textarea
										ref={area}
										rows={3}
										fontFamily='mono'
										fontSize='sm'
										placeholder='e.g. total - paid'
										value={text}
										aria-invalid={checked && !checked.ok ? true : undefined}
										borderColor={checked && !checked.ok ? 'red.solid' : undefined}
										onChange={e => {
											change(e.target.value);
											cursor.current = e.target.selectionStart;
										}}
										onSelect={remember}
										onKeyUp={remember}
										onClick={remember}
									/>

									{!checked ? (
										<Text
											mt={2}
											fontSize='xs'
											color='fg.muted'>
											Type a formula, or build it with the buttons above. Use field keys, numbers, + − × ÷ %,
											brackets and the functions.
										</Text>
									) : !checked.ok ? (
										<Box mt={2}>
											{typeof firstAt === 'number' && (
												<Box
													as='pre'
													fontFamily='mono'
													fontSize='xs'
													color='fg.muted'
													whiteSpace='pre'
													overflowX='auto'
													mb={1}>
													{text.replace(/\n/g, ' ')}
													{'\n'}
													<Box
														as='span'
														color='red.fg'>
														{' '.repeat(firstAt)}^
													</Box>
												</Box>
											)}
											{checked.errors.map((e, i) => (
												<Flex
													key={i}
													gap={1.5}
													align='flex-start'
													color='red.fg'
													fontSize='sm'>
													<Box mt='3px'>
														<CircleAlert size={14} />
													</Box>
													<Text>{e.message}</Text>
												</Flex>
											))}
										</Box>
									) : (
										<Flex
											mt={2}
											direction='column'
											gap={1.5}>
											<Flex
												gap={1.5}
												align='center'
												color='green.fg'
												fontSize='sm'>
												<CheckCircle2 size={14} />
												<Text>
													Valid —{' '}
													<Text
														as='span'
														fontFamily='mono'
														color='fg'>
														{fieldKey} = {checked.formatted}
													</Text>
												</Text>
											</Flex>
											{checked.refs.length > 0 && (
												<Flex
													gap={1}
													align='center'
													flexWrap='wrap'>
													<Text
														fontSize='xs'
														color='fg.muted'>
														Uses
													</Text>
													{checked.refs.map(r => (
														<Badge
															key={r}
															size='sm'
															variant='subtle'>
															{labelOf(r)}
														</Badge>
													))}
												</Flex>
											)}
										</Flex>
									)}
								</Box>

								{/* Try it on sample numbers. */}
								{checked?.ok && checked.refs.length > 0 && (
									<Box
										borderWidth='1px'
										borderColor='border.muted'
										borderRadius='md'
										p={3}>
										<Text
											fontSize='xs'
											fontWeight='600'
											mb={2}>
											Try it
										</Text>
										<Grid
											templateColumns='repeat(auto-fill, minmax(140px, 1fr))'
											gap={2}>
											{checked.refs.map(r => (
												<Box key={r}>
													<Text
														fontSize='11px'
														color='fg.muted'
														mb={1}
														truncate>
														{infoOf(r)?.inList ? `${labelOf(r)}, each row` : infoOf(r)?.list ? `Rows in ${labelOf(r)}` : labelOf(r)}
													</Text>
													<Input
														size='xs'
														type={infoOf(r)?.inList ? 'text' : 'number'}
														placeholder={infoOf(r)?.inList ? '5, 3, 2' : '0'}
														value={sample[r] ?? ''}
														onChange={e => setSample(s => ({ ...s, [r]: e.target.value }))}
													/>
												</Box>
											))}
										</Grid>
										<Text
											mt={2.5}
											fontSize='sm'>
											{name} ={' '}
											<Text
												as='span'
												fontWeight='600'
												fontFamily='mono'>
												{result === null ? 'empty (divides by 0)' : result.toLocaleString(undefined, { maximumFractionDigits: 10 })}
											</Text>
										</Text>
									</Box>
								)}
							</Flex>
						</Dialog.Body>

						<ModalFooter>
							<DiscardButton onClick={onClose}>Cancel</DiscardButton>
							<Button
								size='sm'
								px={3}
								disabled={!checked?.ok}
								onClick={() => checked?.formatted && onSave(checked.formatted)}>
								Save formula
							</Button>
						</ModalFooter>
					</AlertDialogContent>
				</Dialog.Positioner>
			</Portal>
		</Dialog.Root>
	);
};

export default FormulaModal;
