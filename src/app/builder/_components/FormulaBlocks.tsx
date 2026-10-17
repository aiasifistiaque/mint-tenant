'use client';

import { DragEvent, FC, ReactNode, RefObject, createContext, useContext, useEffect, useRef, useState } from 'react';
import { Box, Button, Flex, IconButton, Input, Menu, Portal, Text } from '@chakra-ui/react';
import { ChevronDown, GitBranch, GripVertical, Hash, Plus, Sigma, Type, X } from 'lucide-react';
import { Dropdown } from '@/components/library/cl';
import { FieldInfo, Node } from '@/components/library/functions/formula';

/**
 * A formula built from blocks instead of typed — for people who don't write
 * code. Every empty box says what goes in it; click it to pick a block from a
 * menu, or drag a block (or a field) from the shelf onto it. An If block reads
 * as a sentence — "If ___ then ___ otherwise ___" — and "Add another
 * condition" adds an "otherwise if" before the last otherwise.
 *
 * The blocks are the formula engine's own tree (formula.ts `Node`), so they
 * turn into the same text the typed editor shows (`format`) and back
 * (`parse`): someone can build it here and read or tweak it as text there.
 * An empty box is a field reference with no key, which `format` can't write
 * out — the formula counts as unfinished until every box is filled.
 */

export const HOLE: Node = { t: 'ref', key: '', at: 0 };
const isHole = (n: Node) => n.t === 'ref' && !n.key;

/** How many boxes are still empty (a list block with no list picked counts too). */
export const holesIn = (n: Node): number => {
	if (isHole(n)) return 1;
	if (n.t === 'agg' && !n.key) return 1;
	return childrenOf(n).reduce((sum, c) => sum + holesIn(c), 0);
};

const childrenOf = (n: Node): Node[] => {
	switch (n.t) {
		case 'bin':
		case 'cmp':
		case 'logic':
			return [n.a, n.b];
		case 'neg':
			return [n.a];
		case 'fn':
			return n.args;
		default:
			return [];
	}
};

const withChild = (n: Node, i: number, c: Node): Node => {
	switch (n.t) {
		case 'bin':
		case 'cmp':
		case 'logic':
			return i === 0 ? { ...n, a: c } : { ...n, b: c };
		case 'neg':
			return { ...n, a: c };
		case 'fn': {
			const args = [...n.args];
			args[i] = c;
			return { ...n, args };
		}
		default:
			return n;
	}
};

type Path = number[];
const getAt = (n: Node, path: Path): Node => (path.length ? getAt(childrenOf(n)[path[0]], path.slice(1)) : n);
const setAt = (n: Node, path: Path, c: Node): Node =>
	path.length ? withChild(n, path[0], setAt(childrenOf(n)[path[0]], path.slice(1), c)) : c;
const keyOf = (path: Path) => path.join('.');

/* ---------- the blocks on offer ---------- */

type BlockKind =
	| 'if'
	| 'compare'
	| 'and'
	| 'or'
	| 'not'
	| 'calc'
	| 'number'
	| 'text'
	| 'yes'
	| 'round'
	| 'floor'
	| 'ceil'
	| 'abs'
	| 'min'
	| 'max'
	| 'sum'
	| 'avg'
	| 'count';

type BlockSpec = { kind: BlockKind; label: string; hint: string };

const DECIDE: BlockSpec[] = [
	{ kind: 'if', label: 'If … then … otherwise', hint: 'Pick one value or another, by a condition' },
	{ kind: 'compare', label: 'Compare', hint: 'Discount type is Percentage · total is more than 100' },
	{ kind: 'and', label: 'Both are true', hint: 'Two conditions that must both hold' },
	{ kind: 'or', label: 'Either is true', hint: 'Two conditions, one of which must hold' },
	{ kind: 'not', label: 'Is not true', hint: 'When a condition doesn’t hold' },
];
const CALCULATE: BlockSpec[] = [
	{ kind: 'calc', label: 'Calculation', hint: 'Add, subtract, multiply or divide two values' },
	{ kind: 'round', label: 'Round', hint: 'To a number of decimals' },
	{ kind: 'floor', label: 'Round down', hint: 'Down to a whole number' },
	{ kind: 'ceil', label: 'Round up', hint: 'Up to a whole number' },
	{ kind: 'abs', label: 'Without its sign', hint: '−5 becomes 5' },
	{ kind: 'min', label: 'Smallest of', hint: 'The smallest of two or more values' },
	{ kind: 'max', label: 'Largest of', hint: 'The largest of two or more values' },
];
const LISTS: BlockSpec[] = [
	{ kind: 'sum', label: 'Total of a list', hint: 'A number in every row, added up' },
	{ kind: 'avg', label: 'Average of a list', hint: 'A number in every row, averaged' },
	{ kind: 'count', label: 'Rows in a list', hint: 'How many rows a list has' },
];
const VALUES: BlockSpec[] = [
	{ kind: 'number', label: 'A number', hint: 'Type a number, like 100 or 0.5' },
	{ kind: 'text', label: 'Text', hint: 'To compare a text or choice field with' },
	{ kind: 'yes', label: 'Yes / No', hint: 'To compare a yes / no field with' },
];

const make = (kind: BlockKind, current?: Node): Node => {
	switch (kind) {
		case 'if':
			return { t: 'fn', name: 'if', args: [HOLE, HOLE, HOLE], at: 0 };
		case 'compare':
			return { t: 'cmp', op: '=', a: HOLE, b: HOLE };
		case 'and':
		case 'or':
			return { t: 'logic', op: kind, a: HOLE, b: HOLE };
		case 'not':
			return { t: 'fn', name: 'not', args: [HOLE], at: 0 };
		case 'calc':
			return { t: 'bin', op: '+', a: HOLE, b: HOLE };
		case 'number':
			return { t: 'num', v: 0 };
		case 'text':
			return { t: 'str', v: '', at: 0 };
		case 'yes':
			return { t: 'bool', v: true };
		case 'round':
			return { t: 'fn', name: 'round', args: [current && !isHole(current) ? current : HOLE, { t: 'num', v: 2 }], at: 0 };
		case 'floor':
		case 'ceil':
		case 'abs':
			return { t: 'fn', name: kind, args: [current && !isHole(current) ? current : HOLE], at: 0 };
		case 'min':
		case 'max':
			return { t: 'fn', name: kind, args: [HOLE, HOLE], at: 0 };
		case 'sum':
		case 'avg':
		case 'count':
			return { t: 'agg', name: kind, key: '', at: 0 };
	}
};

/* ---------- shared state ---------- */

type Role = 'value' | 'cond' | 'compared';

type Ctx = {
	tree: Node;
	set: (path: Path, n: Node) => void;
	fields: FieldInfo[];
	self?: string;
	portal: RefObject<HTMLElement | null>;
	over: string | null;
	setOver: (k: string | null) => void;
};
const BlocksContext = createContext<Ctx | null>(null);
const useBlocks = () => useContext(BlocksContext)!;

const DRAG_TYPE = 'application/x-mint-formula-block';

/** What a dragged shelf item drops as: a block, or a field. */
type Dragged = { kind: BlockKind } | { field: string };

const fieldLabel = (f?: FieldInfo, key?: string) => (f?.label && f.label !== f.key ? f.label : f?.key || key || '');

/* ---------- a box: drop target + the block in it ---------- */

const Slot: FC<{ path: Path; role?: Role; hint?: string; partner?: FieldInfo }> = ({ path, role = 'value', hint, partner }) => {
	const { tree, set, over, setOver } = useBlocks();
	const n = getAt(tree, path);
	const k = keyOf(path);
	const onDrop = (e: DragEvent) => {
		const raw = e.dataTransfer.getData(DRAG_TYPE);
		if (!raw) return;
		e.preventDefault();
		e.stopPropagation();
		setOver(null);
		const d: Dragged = JSON.parse(raw);
		set(path, 'field' in d ? { t: 'ref', key: d.field, at: 0 } : make(d.kind, n));
	};
	return (
		<Box
			display='inline-flex'
			alignItems='center'
			maxW='full'
			borderRadius='md'
			outline={over === k ? '2px solid' : undefined}
			outlineColor='blue.solid'
			outlineOffset='2px'
			onDragOver={e => {
				if (!e.dataTransfer.types.includes(DRAG_TYPE)) return;
				e.preventDefault();
				e.stopPropagation();
				if (over !== k) setOver(k);
			}}
			onDragLeave={e => {
				e.stopPropagation();
				if (over === k) setOver(null);
			}}
			onDrop={onDrop}>
			<Block
				path={path}
				node={n}
				role={role}
				hint={hint}
				partner={partner}
			/>
		</Box>
	);
};

/* ---------- the menu a box opens ---------- */

const PickMenu: FC<{ path: Path; role: Role; trigger: ReactNode }> = ({ path, role, trigger }) => {
	const { set, fields, self, portal, tree } = useBlocks();
	const current = getAt(tree, path);
	// Number fields for a value; any field to compare or test.
	const usable = fields.filter(f => f.key !== self && !f.list && !f.inList && (role !== 'value' || f.numeric));
	// What the box most likely wants comes first: a condition to test, a value to compare, or a value.
	const FIELDS = 'fields';
	const groups: [string, BlockSpec[] | typeof FIELDS][] =
		role === 'cond'
			? [
					['Test', DECIDE.filter(b => b.kind !== 'if')],
					['Or a field that’s filled in, yes, or not 0', FIELDS],
			  ]
			: role === 'compared'
			? [
					['Fields', FIELDS],
					['Values', VALUES],
					['Calculate', CALCULATE],
			  ]
			: [
					['Decide', DECIDE.slice(0, 1)],
					['Number fields', FIELDS],
					['Calculate', CALCULATE],
					['Values', VALUES.slice(0, 1)],
					...(fields.some(f => f.list) ? ([['Lists', LISTS]] as [string, BlockSpec[]][]) : []),
			  ];
	return (
		<Menu.Root positioning={{ placement: 'bottom-start' }}>
			<Menu.Trigger asChild>{trigger}</Menu.Trigger>
			<Portal container={portal}>
				<Menu.Positioner>
					<Menu.Content
						minW='260px'
						maxH='360px'
						overflowY='auto'>
						{groups.map(([title, items]) =>
							items === FIELDS ? (
								usable.length > 0 && (
									<Menu.ItemGroup key={title}>
										<Menu.ItemGroupLabel>{title}</Menu.ItemGroupLabel>
										{usable.map(f => (
											<Menu.Item
												key={f.key}
												value={`field:${f.key}`}
												onClick={() => set(path, { t: 'ref', key: f.key, at: 0 })}>
												<Hash size={13} />
												{fieldLabel(f)}
											</Menu.Item>
										))}
									</Menu.ItemGroup>
								)
							) : (
								<Menu.ItemGroup key={title}>
									<Menu.ItemGroupLabel>{title}</Menu.ItemGroupLabel>
									{items.map(b => (
										<Menu.Item
											key={b.kind}
											value={b.kind}
											onClick={() => set(path, make(b.kind, current))}>
											<Flex direction='column'>
												<Text fontSize='sm'>{b.label}</Text>
												<Text
													fontSize='xs'
													color='fg.muted'>
													{b.hint}
												</Text>
											</Flex>
										</Menu.Item>
									))}
								</Menu.ItemGroup>
							)
						)}
					</Menu.Content>
				</Menu.Positioner>
			</Portal>
		</Menu.Root>
	);
};

/** The × on a filled box: empties it again. */
const Clear: FC<{ path: Path }> = ({ path }) => {
	const { set } = useBlocks();
	return (
		<IconButton
			className='blk-x'
			aria-label='Remove'
			title='Remove'
			size='2xs'
			variant='ghost'
			color='fg.subtle'
			minW='18px'
			h='18px'
			// Shown while its block is pointed at (see HOVER) or focused.
			opacity={0}
			_focusVisible={{ opacity: 1 }}
			onClick={() => set(path, HOLE)}>
			<X size={11} />
		</IconButton>
	);
};

/** Shows a block's own × while the pointer is on it — not every × at once. */
const HOVER = { '&:hover > .blk-x, &:hover > div > .blk-x': { opacity: 1 } };

/** A labelled group of blocks with a tinted edge. */
const Frame: FC<{ tone: string; children: ReactNode; path?: Path; column?: boolean }> = ({ tone, children, path, column }) => (
	<Flex
		direction={column ? 'column' : 'row'}
		align={column ? 'stretch' : 'center'}
		gap={1.5}
		flexWrap='wrap'
		px={2}
		py={1.5}
		borderRadius='md'
		borderWidth='1px'
		borderColor={`${tone}.muted`}
		bg={`${tone}.subtle`}
		maxW='full'
		position='relative'
		css={HOVER}>
		{children}
		{path && (
			<Box
				position={column ? 'absolute' : 'static'}
				top={1}
				right={1}>
				<Clear path={path} />
			</Box>
		)}
	</Flex>
);

const Word: FC<{ children: ReactNode; strong?: boolean }> = ({ children, strong }) => (
	<Text
		as='span'
		fontSize='xs'
		fontWeight={strong ? '700' : '500'}
		letterSpacing={strong ? '0.06em' : undefined}
		textTransform={strong ? 'uppercase' : undefined}
		color='fg.muted'
		whiteSpace='nowrap'>
		{children}
	</Text>
);

const OP_WORDS = [
	{ value: '+', label: 'plus' },
	{ value: '-', label: 'minus' },
	{ value: '*', label: 'times' },
	{ value: '/', label: 'divided by' },
	{ value: '%', label: 'remainder after dividing by' },
];
const CMP_WORDS = [
	{ value: '=', label: 'is' },
	{ value: '!=', label: 'is not' },
	{ value: '>', label: 'is more than' },
	{ value: '>=', label: 'is at least' },
	{ value: '<', label: 'is less than' },
	{ value: '<=', label: 'is at most' },
];

const Pick: FC<{ value: string; items: { value: string; label: string }[]; onChange: (v: string) => void; w?: string; placeholder?: string }> = ({
	value,
	items,
	onChange,
	w,
	placeholder,
}) => (
	<Dropdown
		size='xs'
		w={w || 'auto'}
		minW='90px'
		placeholder={placeholder}
		value={value}
		onChange={(v: string) => v && onChange(v)}>
		{items.map(i => (
			<option
				key={i.value}
				value={i.value}>
				{i.label}
			</option>
		))}
	</Dropdown>
);

/**
 * A number box that keeps what's typed — "0." on the way to "0.5", a lone
 * "-" — and sets the block's number whenever the text is one.
 */
const NumberBox: FC<{ value: number; onChange: (v: number) => void }> = ({ value, onChange }) => {
	const [text, setText] = useState(String(value));
	useEffect(() => {
		if (Number(text) !== value) setText(String(value));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [value]);
	return (
		<Input
			size='xs'
			inputMode='decimal'
			w='84px'
			value={text}
			onChange={e => {
				setText(e.target.value);
				const v = Number(e.target.value);
				if (e.target.value.trim() && Number.isFinite(v)) onChange(v);
			}}
			onBlur={() => setText(String(value))}
		/>
	);
};

/* ---------- one block ---------- */

const Block: FC<{ path: Path; node: Node; role: Role; hint?: string; partner?: FieldInfo }> = ({ path, node: n, role, hint, partner }) => {
	const { set, fields, tree } = useBlocks();
	const fieldOf = (key: string) => fields.find(f => f.key === key);

	// Compared with a choice field: its options, picked from a list.
	if (role === 'compared' && partner?.options?.length && (isHole(n) || n.t === 'str'))
		return (
			<Flex
				align='center'
				gap={1}
				css={HOVER}>
				<Pick
					w='160px'
					placeholder='Choose a value'
					value={n.t === 'str' ? String(n.v) : ''}
					items={partner.options.map(o => ({ value: String(o.value), label: String(o.label ?? o.value) }))}
					onChange={v => set(path, { t: 'str', v, at: 0 })}
				/>
				{n.t === 'str' && <Clear path={path} />}
			</Flex>
		);
	if (role === 'compared' && partner?.yesNo && (isHole(n) || n.t === 'bool'))
		return (
			<Pick
				placeholder='Choose'
				value={n.t === 'bool' ? String(n.v) : ''}
				items={[
					{ value: 'true', label: 'Yes' },
					{ value: 'false', label: 'No' },
				]}
				onChange={v => set(path, { t: 'bool', v: v === 'true' })}
			/>
		);

	if (isHole(n))
		return (
			<PickMenu
				path={path}
				role={role}
				trigger={
					<Button
						size='xs'
						variant='outline'
						borderStyle='dashed'
						color='fg.muted'
						fontWeight='400'>
						{hint || (role === 'cond' ? 'Choose a condition' : 'Choose')}
						<ChevronDown size={12} />
					</Button>
				}
			/>
		);

	switch (n.t) {
		case 'ref':
			return (
				<Flex
					align='center'
					gap={0.5}
					css={HOVER}>
					<PickMenu
						path={path}
						role={role}
						trigger={
							<Button
								size='xs'
								variant='subtle'
								colorPalette='blue'>
								<Hash size={12} />
								{fieldLabel(fieldOf(n.key), n.key)}
							</Button>
						}
					/>
					<Clear path={path} />
				</Flex>
			);
		case 'num':
			return (
				<Flex
					align='center'
					gap={0.5}
					css={HOVER}>
					<NumberBox
						value={n.v}
						onChange={v => set(path, { t: 'num', v })}
					/>
					<Clear path={path} />
				</Flex>
			);
		case 'str':
			return (
				<Flex
					align='center'
					gap={0.5}
					css={HOVER}>
					<Input
						size='xs'
						w='130px'
						placeholder='Text'
						value={n.v}
						// Quotes end the text in a formula, so they can't be part of it.
						onChange={e => set(path, { t: 'str', v: e.target.value.replace(/["“”]/g, ''), at: 0 })}
					/>
					<Clear path={path} />
				</Flex>
			);
		case 'bool':
			return (
				<Flex
					align='center'
					gap={0.5}
					css={HOVER}>
					<Pick
						value={String(n.v)}
						items={[
							{ value: 'true', label: 'Yes' },
							{ value: 'false', label: 'No' },
						]}
						onChange={v => set(path, { t: 'bool', v: v === 'true' })}
					/>
					<Clear path={path} />
				</Flex>
			);
		case 'neg':
			return (
				<Frame
					tone='gray'
					path={path}>
					<Word>minus</Word>
					<Slot path={[...path, 0]} />
				</Frame>
			);
		case 'bin':
			return (
				<Frame
					tone='gray'
					path={path}>
					<Slot path={[...path, 0]} />
					<Pick
						value={n.op}
						items={OP_WORDS}
						onChange={op => set(path, { ...n, op: op as any })}
					/>
					<Slot path={[...path, 1]} />
				</Frame>
			);
		case 'cmp': {
			const side = (x: Node) => (x.t === 'ref' && x.key ? fieldOf(x.key) : undefined);
			return (
				<Frame
					tone='purple'
					path={path}>
					<Slot
						path={[...path, 0]}
						role='compared'
						hint='Choose a field'
						partner={side(n.b)}
					/>
					<Pick
						value={n.op}
						items={CMP_WORDS}
						onChange={op => set(path, { ...n, op: op as any })}
					/>
					<Slot
						path={[...path, 1]}
						role='compared'
						hint='Choose a value'
						partner={side(n.a)}
					/>
				</Frame>
			);
		}
		case 'logic':
			return (
				<Frame
					tone='purple'
					path={path}>
					<Slot
						path={[...path, 0]}
						role='cond'
					/>
					<Pick
						value={n.op}
						items={[
							{ value: 'and', label: 'and' },
							{ value: 'or', label: 'or' },
						]}
						onChange={op => set(path, { ...n, op: op as any })}
					/>
					<Slot
						path={[...path, 1]}
						role='cond'
					/>
				</Frame>
			);
		case 'agg': {
			const options = fields.filter(f => (n.name === 'count' ? f.list : f.inList && f.numeric));
			return (
				<Frame
					tone='teal'
					path={path}>
					<Word>{n.name === 'sum' ? 'total of' : n.name === 'avg' ? 'average of' : 'rows in'}</Word>
					<Pick
						w='200px'
						placeholder='Choose a list'
						value={n.key}
						items={options.map(f => ({ value: f.key, label: fieldLabel(f) }))}
						onChange={key => set(path, { ...n, key })}
					/>
				</Frame>
			);
		}
		case 'fn':
			return (
				<FnBlock
					path={path}
					node={n}
					tree={tree}
				/>
			);
	}
	return null;
};

/** If chains, not, round and the rest. */
const FnBlock: FC<{ path: Path; node: Extract<Node, { t: 'fn' }>; tree: Node }> = ({ path, node: n, tree }) => {
	const { set } = useBlocks();

	if (n.name === 'if') {
		// "If … then …", then each nested if in the otherwise as "Otherwise if …", then the last otherwise.
		const isIf = (x: Node) => x.t === 'fn' && x.name === 'if';
		const steps: Path[] = [path];
		while (isIf(getAt(tree, [...steps[steps.length - 1], 2]))) steps.push([...steps[steps.length - 1], 2]);
		const last = steps[steps.length - 1];
		const elsePath = [...last, 2];
		return (
			<Frame
				tone='orange'
				path={path}
				column>
				{steps.map((p, i) => (
					<Flex
						key={keyOf(p)}
						align='center'
						gap={1.5}
						flexWrap='wrap'
						pr={i === 0 ? 6 : 0}>
						<Word strong>{i === 0 ? 'If' : 'Otherwise if'}</Word>
						<Slot
							path={[...p, 0]}
							role='cond'
						/>
						<Word strong>then</Word>
						<Slot
							path={[...p, 1]}
							hint='Choose the value'
						/>
						{i > 0 && (
							<IconButton
								aria-label='Remove this condition'
								title='Remove this condition'
								size='2xs'
								variant='ghost'
								color='fg.subtle'
								// The step's own otherwise takes its place.
								onClick={() => set(p, getAt(tree, [...p, 2]))}>
								<X size={11} />
							</IconButton>
						)}
					</Flex>
				))}
				<Flex
					align='center'
					gap={1.5}
					flexWrap='wrap'>
					<Word strong>Otherwise</Word>
					<Slot
						path={elsePath}
						hint='Choose the value otherwise'
					/>
				</Flex>
				<Box>
					<Button
						size='2xs'
						variant='ghost'
						colorPalette='orange'
						onClick={() => set(elsePath, { t: 'fn', name: 'if', args: [HOLE, HOLE, getAt(tree, elsePath)], at: 0 })}>
						<Plus size={12} />
						Add another condition
					</Button>
				</Box>
			</Frame>
		);
	}

	if (n.name === 'not')
		return (
			<Frame
				tone='purple'
				path={path}>
				<Word>not</Word>
				<Slot
					path={[...path, 0]}
					role='cond'
				/>
			</Frame>
		);

	if (n.name === 'round') {
		const digits = n.args[1]?.t === 'num' ? n.args[1].v : 0;
		return (
			<Frame
				tone='teal'
				path={path}>
				<Word>round</Word>
				<Slot path={[...path, 0]} />
				<Word>to</Word>
				<Input
					size='xs'
					type='number'
					w='56px'
					min={0}
					max={20}
					value={String(digits)}
					onChange={e => {
						const v = Math.max(0, Math.min(20, Math.round(Number(e.target.value) || 0)));
						set(path, { ...n, args: [n.args[0], { t: 'num', v }] });
					}}
				/>
				<Word>decimals</Word>
			</Frame>
		);
	}

	if (n.name === 'min' || n.name === 'max')
		return (
			<Frame
				tone='teal'
				path={path}>
				<Word>{n.name === 'min' ? 'smallest of' : 'largest of'}</Word>
				{n.args.map((_, i) => (
					<Slot
						key={i}
						path={[...path, i]}
					/>
				))}
				{n.args.length < 20 && (
					<IconButton
						aria-label='Add a value'
						title='Add a value'
						size='2xs'
						variant='ghost'
						onClick={() => set(path, { ...n, args: [...n.args, HOLE] })}>
						<Plus size={12} />
					</IconButton>
				)}
			</Frame>
		);

	// floor, ceil, abs
	return (
		<Frame
			tone='teal'
			path={path}>
			<Word>{n.name === 'floor' ? 'round down' : n.name === 'ceil' ? 'round up' : 'without its sign'}</Word>
			<Slot path={[...path, 0]} />
		</Frame>
	);
};

/* ---------- the shelf to drag from ---------- */

const ShelfItem: FC<{ drag: Dragged; children: ReactNode; title: string; tone: string }> = ({ drag, children, title, tone }) => (
	<Flex
		as='span'
		draggable
		title={title}
		onDragStart={e => {
			e.dataTransfer.setData(DRAG_TYPE, JSON.stringify(drag));
			e.dataTransfer.effectAllowed = 'copy';
		}}
		align='center'
		gap={1}
		px={2}
		h='24px'
		borderRadius='full'
		borderWidth='1px'
		borderColor={`${tone}.muted`}
		bg={`${tone}.subtle`}
		fontSize='xs'
		cursor='grab'
		userSelect='none'
		whiteSpace='nowrap'>
		<GripVertical size={11} />
		{children}
	</Flex>
);

const Shelf: FC<{ fields: FieldInfo[]; self?: string }> = ({ fields, self }) => {
	const usable = fields.filter(f => f.key !== self && !f.list && !f.inList);
	const hasLists = fields.some(f => f.list);
	return (
		<Flex
			direction='column'
			gap={1.5}>
			<Flex
				gap={1}
				flexWrap='wrap'
				align='center'>
				<Text
					fontSize='xs'
					color='fg.muted'
					w='72px'>
					<GitBranch
						size={12}
						style={{ display: 'inline', marginRight: 4 }}
					/>
					Decide
				</Text>
				{DECIDE.map(b => (
					<ShelfItem
						key={b.kind}
						drag={{ kind: b.kind }}
						title={b.hint}
						tone={b.kind === 'if' ? 'orange' : 'purple'}>
						{b.label}
					</ShelfItem>
				))}
			</Flex>
			<Flex
				gap={1}
				flexWrap='wrap'
				align='center'>
				<Text
					fontSize='xs'
					color='fg.muted'
					w='72px'>
					<Sigma
						size={12}
						style={{ display: 'inline', marginRight: 4 }}
					/>
					Calculate
				</Text>
				{[...CALCULATE, ...VALUES, ...(hasLists ? LISTS : [])].map(b => (
					<ShelfItem
						key={b.kind}
						drag={{ kind: b.kind }}
						title={b.hint}
						tone={b.kind === 'calc' || VALUES.includes(b) ? 'gray' : 'teal'}>
						{b.label}
					</ShelfItem>
				))}
			</Flex>
			{usable.length > 0 && (
				<Flex
					gap={1}
					flexWrap='wrap'
					align='center'>
					<Text
						fontSize='xs'
						color='fg.muted'
						w='72px'>
						<Type
							size={12}
							style={{ display: 'inline', marginRight: 4 }}
						/>
						Fields
					</Text>
					{usable.map(f => (
						<ShelfItem
							key={f.key}
							drag={{ field: f.key }}
							title={f.numeric ? `${fieldLabel(f)} — a number` : `${fieldLabel(f)} — to compare in a condition`}
							tone='blue'>
							{fieldLabel(f)}
						</ShelfItem>
					))}
				</Flex>
			)}
		</Flex>
	);
};

/* ---------- the editor ---------- */

type Props = {
	tree: Node;
	onChange: (tree: Node) => void;
	fields: FieldInfo[];
	/** The formula field itself — not offered. */
	self?: string;
};

const FormulaBlocks: FC<Props> = ({ tree, onChange, fields, self }) => {
	const portal = useRef<HTMLDivElement>(null);
	const [over, setOver] = useState<string | null>(null);
	const ctx: Ctx = {
		tree,
		set: (path, n) => onChange(setAt(tree, path, n)),
		fields,
		self,
		portal,
		over,
		setOver,
	};
	return (
		<BlocksContext.Provider value={ctx}>
			<Flex
				direction='column'
				gap={3}>
				<Shelf
					fields={fields}
					self={self}
				/>
				<Box
					p={3}
					minH='72px'
					borderRadius='md'
					borderWidth='1px'
					borderColor='border'
					bg='bg.subtle'
					onDragEnd={() => setOver(null)}>
					<Flex
						align='center'
						gap={1.5}
						flexWrap='wrap'>
						<Text
							fontSize='xs'
							fontWeight='600'
							color='fg.muted'>
							{self ? `${self} =` : '='}
						</Text>
						<Slot
							path={[]}
							hint='Choose what it works out — a field, a calculation or an if'
						/>
					</Flex>
				</Box>
				{/* Menus open in here, inside the dialog, so the dialog doesn't take a click in one as a click outside. */}
				<div ref={portal} />
			</Flex>
		</BlocksContext.Provider>
	);
};

export default FormulaBlocks;
