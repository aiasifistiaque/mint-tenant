'use client';

import { FC, useEffect, useMemo, useRef, useState } from 'react';
import { Badge, Box, Button, CloseButton, Dialog, Flex, Grid, Input, Portal, Text, Textarea } from '@chakra-ui/react';
import { Blocks, Calculator, CheckCircle2, CircleAlert, Code } from 'lucide-react';
import { AlertDialogContent, AlertDialogHeader, ModalFooter } from '@/components/library';
import DiscardButton from '@/components/library/components/buttons/DiscardButton';
import { Dropdown } from '@/components/library/cl';
import { AGGREGATES, CONDITIONS, FUNCTIONS, FieldInfo, Node, checkFormula, evaluate, format, parse } from '@/components/library/functions/formula';
import FormulaBlocks, { HOLE, holesIn } from './FormulaBlocks';

/**
 * Writing a formula field's formula — `due = total - paid`. Two ways in, one
 * formula: build it from blocks (FormulaBlocks — picked from menus or dragged
 * in, the way in for people who don't write code), or type it, with buttons
 * for fields, operators and functions that go in at the cursor. Either way it's checked as it changes —
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

/** Conditions: if() and what it tests with. */
const CONDS = [
	{ label: 'if()', insert: 'if(', hint: FUNCTIONS.if.hint },
	{ label: '=', insert: '=', hint: CONDITIONS['='] },
	{ label: '≠', insert: '!=', hint: CONDITIONS['!='] },
	{ label: '<', insert: '<', hint: CONDITIONS['<'] },
	{ label: '≤', insert: '<=', hint: CONDITIONS['<='] },
	{ label: '>', insert: '>', hint: CONDITIONS['>'] },
	{ label: '≥', insert: '>=', hint: CONDITIONS['>='] },
	{ label: 'and', insert: 'and', hint: CONDITIONS.and },
	{ label: 'or', insert: 'or', hint: CONDITIONS.or },
	{ label: 'not()', insert: 'not(', hint: FUNCTIONS.not.hint },
	{ label: '"text"', insert: '""', hint: 'Text to compare a choice or text field with — type it between the quotes' },
];

const FormulaModal: FC<Props> = ({ isOpen, onClose, onSave, fieldKey, fieldTitle, formula, fields }) => {
	const [text, setText] = useState(formula);
	const latest = useRef(formula);
	const change = (v: string) => {
		latest.current = v;
		setText(v);
	};
	const [sample, setSample] = useState<Record<string, string>>({});
	// The field picker starts afresh after each pick: kept, its last pick stays selected inside
	// the Select, and picking the same field again (price * qty + price) did nothing.
	const [picks, setPicks] = useState(0);
	const area = useRef<HTMLTextAreaElement>(null);
	const cursor = useRef<number | null>(null);

	// Blocks: the formula as a tree, while it's being built. Unfinished (empty
	// boxes), the text is empty, so it can't be saved.
	const [mode, setMode] = useState<'blocks' | 'text'>('blocks');
	const [tree, setTree] = useState<Node>(HOLE);
	const [switchError, setSwitchError] = useState('');
	const treeOf = (src: string): Node | null => {
		if (!src.trim()) return HOLE;
		try {
			return parse(src);
		} catch {
			return null;
		}
	};
	const changeTree = (t: Node) => {
		setTree(t);
		change(holesIn(t) ? '' : format(t));
	};
	const toBlocks = () => {
		const t = treeOf(latest.current);
		if (!t) return setSwitchError('The typed formula has a mistake — fix it (or clear it) to build it with blocks.');
		setSwitchError('');
		setTree(t);
		setMode('blocks');
	};
	const toText = () => {
		setSwitchError('');
		setMode('text');
	};
	const holes = mode === 'blocks' ? holesIn(tree) : 0;

	useEffect(() => {
		if (isOpen) {
			change(formula);
			setSample({});
			cursor.current = null;
			setSwitchError('');
			// A formula that doesn't parse opens as text, to be fixed there.
			const t = treeOf(formula);
			setTree(t || HOLE);
			setMode(t ? 'blocks' : 'text');
		}
	}, [isOpen, formula]);

	const name = fieldTitle || fieldKey;
	// What the picker inserts: a number field as is; a number in a list's rows
	// added up (`sum(items.total)`); a list, its row count (`count(items)`); any
	// other field as is, to compare in a condition (`discountType = "flat"`).
	const usable = fields
		.filter(f => f.key !== fieldKey)
		.map(f => {
			const label = f.label && f.label !== f.key ? f.label : f.key;
			if (f.list) return { key: f.key, insert: `count(${f.key})`, label: `Number of rows in ${label} — count(${f.key})` };
			if (!f.numeric && f.inList) return null;
			if (!f.numeric) return { key: f.key, insert: f.key, label: `${label === f.key ? f.key : `${label} (${f.key})`} — to compare in a condition` };
			if (f.inList) return { key: f.key, insert: `sum(${f.key})`, label: `Sum of ${label} in ${labelOfList(f.inList)} — sum(${f.key})` };
			if (f.linked) return { key: f.key, insert: f.key, label: `${label} (${f.key}) — from the linked record` };
			return { key: f.key, insert: f.key, label: label === f.key ? f.key : `${label} (${f.key})` };
		})
		.filter((f): f is { key: string; insert: string; label: string } => !!f);
	const hasLists = fields.some(f => f.list);
	const hasLinks = fields.some(f => f.linked);
	const checked = useMemo(() => (text.trim() ? checkFormula(text, fields, fieldKey) : null), [text, fields, fieldKey]);
	const labelOf = (key: string) => fields.find(f => f.key === key)?.label || key;
	function labelOfList(key: string) {
		return fields.find(f => f.key === key)?.label || key;
	}
	const infoOf = (key: string) => fields.find(f => f.key === key);
	// The sample values by their full key, so a dotted one (tax.amount, billing.fee) is read as typed.
	// A yes / no field is tried as yes or no, so if(isVip, …) reads "no" as not holding.
	const yesNo = (r: string, v: string) => (!infoOf(r)?.numeric && /^(yes|true|no|false)$/i.test(v.trim()) ? /^(yes|true)$/i.test(v.trim()) : v);
	const tried = checked?.ok ? Object.fromEntries(checked.refs.map(r => [r, yesNo(r, sample[r] ?? '')])) : {};
	const result = checked?.ok && checked.tree ? evaluate(checked.tree, tried, tried) : null;

	/** Puts `token` in at the cursor (or the end), spaced, and keeps the cursor after it. */
	const insert = (token: string) => {
		// From the ref, not the render's `text`: two quick clicks both see the latest.
		const prev = latest.current;
		const at = Math.min(cursor.current ?? prev.length, prev.length);
		// A closing bracket hugs what it closes.
		const before = token === ')' ? prev.slice(0, at).replace(/\s+$/, '') : prev.slice(0, at);
		const after = prev.slice(at).replace(/^\s+/, '');
		const pad = /[\s(]$/.test(before) || !before ? '' : ' ';
		const piece = token === ')' ? token : `${pad}${token}${token.endsWith('(') || token === '""' ? '' : ' '}`;
		// Into an empty pair of quotes, to type the text.
		const pos = before.length + piece.length - (token === '""' ? 1 : 0);
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
			// Blocks need the room: an If reads as a sentence on one line.
			size={mode === 'blocks' ? 'xl' : 'lg'}
			// Tall with blocks: the body scrolls, the buttons stay in view.
			scrollBehavior='inside'
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
									typed in. An empty field counts as 0. It can depend on a condition — if(discountType =
									&quot;percentage&quot;, subtotal * discount / 100, flatDiscount) takes a percentage off when
									Discount type is percentage, and the flat discount when it isn&apos;t.
									{hasLists &&
										' A list’s rows are used through sum(), avg() and count() — e.g. sum(items.total) adds up the total of every row.'}
									{hasLinks &&
										' A linked record’s numbers are read through the link — e.g. tax.amount is the amount of the Tax picked (0 when none is).'}
									{' A field can be used as many times as you need.'}
								</Text>

								<Flex
									gap={1}
									p={0.5}
									borderRadius='md'
									bg='bg.muted'
									alignSelf='flex-start'>
									<Button
										size='xs'
										variant={mode === 'blocks' ? 'solid' : 'ghost'}
										onClick={toBlocks}>
										<Blocks size={13} />
										Build with blocks
									</Button>
									<Button
										size='xs'
										variant={mode === 'text' ? 'solid' : 'ghost'}
										onClick={toText}>
										<Code size={13} />
										Type it
									</Button>
								</Flex>
								{switchError && (
									<Text
										fontSize='sm'
										color='red.fg'>
										{switchError}
									</Text>
								)}

								{mode === 'blocks' && (
									<FormulaBlocks
										tree={tree}
										onChange={changeTree}
										fields={fields}
										self={fieldKey}
									/>
								)}

								{/* Build it from pieces… */}
								{mode === 'text' && (
									<Flex
										direction='column'
										gap={2}>
										<Flex
											gap={2}
											align='center'
											flexWrap='wrap'>
											<Dropdown
												key={picks}
												size='sm'
												w='240px'
												value=''
												placeholder={usable.length ? 'Insert a field…' : 'No number fields to use'}
												disabled={!usable.length}
												onChange={(v: string) => {
													if (v) insert(v);
													setPicks(n => n + 1);
												}}>
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
											{[...Object.entries(FUNCTIONS).filter(([fn]) => fn !== 'if' && fn !== 'not'), ...(hasLists ? Object.entries(AGGREGATES) : [])].map(([fn, spec]) => (
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
										</Flex>
										<Flex
											gap={1}
											flexWrap='wrap'
											align='center'>
											<Text
												fontSize='xs'
												color='fg.muted'
												mr={1}>
												Conditions
											</Text>
											{CONDS.map(o => (
												<Button
													key={o.label}
													size='xs'
													variant='ghost'
													fontFamily='mono'
													title={o.hint}
													onClick={() => insert(o.insert)}>
													{o.label}
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

								)}

								{/* …or type it. */}
								<Box>
									{mode === 'text' && (
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
									)}

									{mode === 'blocks' && holes > 0 ? (
										<Text
											fontSize='xs'
											color='fg.muted'>
											{holes === 1 ? 'One box is still empty' : `${holes} boxes are still empty`} — fill
											{holes === 1 ? ' it' : ' them'} in to finish the formula.
										</Text>
									) : !checked ? (
										<Text
											mt={2}
											fontSize='xs'
											color='fg.muted'>
											Type a formula, or build it with the buttons above. Use field keys, numbers, + − × ÷ %,
											brackets, the functions and conditions — text goes in quotes.
										</Text>
									) : !checked.ok ? (
										<Box mt={2}>
											{mode === 'text' && typeof firstAt === 'number' && (
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
													{infoOf(r)?.options?.length || infoOf(r)?.yesNo ? (
														<Dropdown
															size='xs'
															placeholder='Pick one'
															value={sample[r] ?? ''}
															onChange={(v: string) => setSample(s => ({ ...s, [r]: v }))}>
															{(infoOf(r)?.yesNo
																? [
																		{ value: 'yes', label: 'Yes' },
																		{ value: 'no', label: 'No' },
																  ]
																: infoOf(r)!.options!.map(o => ({ value: String(o.value), label: String(o.label ?? o.value) }))
															).map(o => (
																<option
																	key={o.value}
																	value={o.value}>
																	{o.label}
																</option>
															))}
														</Dropdown>
													) : (
														<Input
															size='xs'
															type={infoOf(r)?.inList || !infoOf(r)?.numeric ? 'text' : 'number'}
															placeholder={infoOf(r)?.inList ? '5, 3, 2' : infoOf(r)?.numeric || infoOf(r)?.list ? '0' : 'its value'}
															value={sample[r] ?? ''}
															onChange={e => setSample(s => ({ ...s, [r]: e.target.value }))}
														/>
													)}
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
