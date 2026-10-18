'use client';

import { FC, Fragment, KeyboardEvent, MouseEvent, ReactNode, createContext, useContext, useRef, useState } from 'react';
import { Box, Button, Flex, Input, Text, Textarea } from '@chakra-ui/react';
import { Delete, Lock, LockOpen, Undo2 } from 'lucide-react';
import { Dropdown } from '@/components/library/cl';
import { FieldInfo, Node, format, parse } from '@/components/library/functions/formula';

/**
 * Writing a formula by clicking, not typing. The formula sits at the bottom,
 * locked: it can't be typed in, only built from the buttons above it. Each
 * empty box in it says what goes there (condition, then, otherwise…), the
 * highlighted one is filled by the next button or field picked, and the
 * line on top says what to pick. Clicking a part of the formula highlights it
 * to change; + − × ÷ added after a part work on it, the way typing would.
 *
 * "Type it yourself" unlocks it to plain text, where the same buttons put
 * their piece in at the cursor; "Back to buttons" reads the text back.
 *
 * A Formula (date) (`returns: 'date'`, docs/date-formulas) gets a row of date
 * buttons — Today, Add days / weeks / months / years, Add (a unit from a
 * field), Latest, Earliest — and a number formula gets Days between when the
 * fields hold dates.
 *
 * The formula is the engine's own tree (formula.ts `Node`), turned into text
 * with `format` and read back with `parse`. An empty box is a field
 * reference with no key; while there is one, the formula is unfinished and
 * its text empty, so it can't be saved.
 */

export const HOLE: Node = { t: 'ref', key: '', at: 0 };
const isHole = (n: Node) => n.t === 'ref' && !n.key;
/** An empty box in the typed text: a name no field has, made an empty box again when it's locked. */
const BLANK = '___';

type Path = number[];
type FnName = Extract<Node, { t: 'fn' }>['name'];

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

const getAt = (n: Node, path: Path): Node => (path.length ? getAt(childrenOf(n)[path[0]], path.slice(1)) : n);
const setAt = (n: Node, path: Path, c: Node): Node =>
	path.length ? withChild(n, path[0], setAt(childrenOf(n)[path[0]], path.slice(1), c)) : c;
const mapNode = (n: Node, f: (n: Node) => Node): Node => f(childrenOf(n).reduce((acc, c, i) => withChild(acc, i, mapNode(c, f)), n));
const same = (a: Path, b: Path) => a.length === b.length && a.every((x, i) => x === b[i]);
/** Whether `a` comes after `b`, reading the formula left to right. */
const after = (a: Path, b: Path) => {
	for (let i = 0; i < Math.min(a.length, b.length); i++) if (a[i] !== b[i]) return a[i] > b[i];
	return a.length > b.length;
};
/** The empty boxes, in reading order. */
const holesOf = (n: Node, path: Path = []): Path[] => (isHole(n) ? [path] : childrenOf(n).flatMap((c, i) => holesOf(c, [...path, i])));
export const holesIn = (n: Node) => holesOf(n).length;

const treeOf = (src: string): Node | null => {
	if (!src.trim()) return HOLE;
	try {
		return mapNode(parse(src), n => (n.t === 'ref' && n.key === BLANK ? HOLE : n));
	} catch {
		return null;
	}
};
const textOf = (t: Node) => (holesOf(t).length ? '' : format(t));
const isCondition = (n: Node) => n.t === 'cmp' || n.t === 'logic' || n.t === 'bool' || (n.t === 'fn' && n.name === 'not');

/** How tightly an operator holds, as `format` brackets them. */
const levelOf = (n: Node): number | null =>
	n.t === 'bin' ? (n.op === '+' || n.op === '-' ? 1 : 2) : n.t === 'cmp' ? 0 : n.t === 'logic' ? (n.op === 'or' ? -2 : -1) : null;

/* ---------- what an empty box is for ---------- */

type Spot = { role: 'value' | 'cond' | 'compared' | 'date' | 'unit'; hint: string; prompt: string };
const COND: Spot = { role: 'cond', hint: 'condition', prompt: 'Choose the condition — a field to check, then what it should be.' };
const DATE_SPOT = (hint: string): Spot => ({ role: 'date', hint, prompt: 'Choose a date — a date field, Today, or Add days… to move one.' });

/** `date`: the formula works out a date (a Date formula field). */
const spotOf = (tree: Node, path: Path, date = false): Spot => {
	if (!path.length)
		return date
			? { role: 'date', hint: 'start here', prompt: 'Start with a date — Add days, Add months…, Latest of, Today or a date field — or If, to choose between two dates.' }
			: { role: 'value', hint: 'start here', prompt: 'Start with a field or a number — or If, to choose between two values by a condition.' };
	const p = getAt(tree, path.slice(0, -1));
	const i = path[path.length - 1];
	// An If's answers are dates when the If itself stands where a date goes.
	const dated = date && spotOf(tree, path.slice(0, -1), date).role === 'date';
	if (p.t === 'fn' && p.name === 'if')
		return i === 0
			? COND
			: i === 1
			? dated
				? DATE_SPOT('then')
				: { role: 'value', hint: 'then', prompt: 'Choose the value when the condition holds — a field, a number or a calculation.' }
			: dated
			? { ...DATE_SPOT('otherwise'), prompt: 'Choose the date otherwise — or Otherwise if, to check another condition first.' }
			: { role: 'value', hint: 'otherwise', prompt: 'Choose the value otherwise — or Otherwise if, to check another condition first.' };
	if (p.t === 'fn' && p.name.startsWith('add'))
		return i === 0
			? DATE_SPOT('date')
			: i === 1
			? { role: 'value', hint: 'how many', prompt: 'Choose how many — a number, or a number field (a plan’s length). Below 0 goes back in time.' }
			: { role: 'unit', hint: 'unit', prompt: 'Choose the unit — days, weeks, months or years — or a field holding one (a plan’s unit).' };
	if (p.t === 'fn' && (p.name === 'latest' || p.name === 'earliest')) return DATE_SPOT('date');
	if (p.t === 'fn' && p.name === 'daysBetween') return DATE_SPOT(i === 0 ? 'from' : 'to');
	if ((p.t === 'fn' && p.name === 'not') || p.t === 'logic') return COND;
	if (p.t === 'cmp')
		return i === 0
			? { role: 'compared', hint: 'field', prompt: 'Choose the field to check.' }
			: { role: 'compared', hint: 'compare with', prompt: 'Choose what it should be — a value, a number, text or another field.' };
	if (p.t === 'fn' && p.name === 'round' && i === 1) return { role: 'value', hint: 'decimals', prompt: 'Type how many decimals to round to, and Add.' };
	return { role: 'value', hint: 'value', prompt: 'Choose a value — a field, a number or a calculation.' };
};

const fieldLabel = (f?: FieldInfo, key?: string) => (f?.label && f.label !== f.key ? f.label : f?.key || key || '');

/* ---------- the formula, drawn ---------- */

type BarCtx = { tree: Node; sel: Path | null; select: (p: Path) => void; fieldOf: (key: string) => FieldInfo | undefined };
const BarContext = createContext<BarCtx | null>(null);

const SHOW: Record<string, string> = { '+': '+', '-': '−', '*': '×', '/': '÷', '%': '%', '=': '=', '!=': '≠', '<': '<', '<=': '≤', '>': '>', '>=': '≥' };

/** One part of the formula; a click on it (its operator, for a calculation) highlights it. */
const Part: FC<{ n: Node; path: Path; parent?: number; right?: boolean }> = ({ n, path, parent = -3, right = false }) => {
	const { tree, sel, select, fieldOf } = useContext(BarContext)!;
	// The whole formula isn't marked: it's where + − × ÷ go when nothing else is picked.
	const on = !!sel && same(sel, path) && (!!path.length || isHole(n));
	const pick = (e: MouseEvent) => {
		e.stopPropagation();
		select(path);
	};

	if (isHole(n))
		return (
			<Box
				as='span'
				display='inline-block'
				px={1.5}
				mx='1px'
				lineHeight='1.6'
				fontFamily='body'
				fontSize='xs'
				borderWidth='1px'
				borderStyle='dashed'
				borderRadius='sm'
				borderColor={on ? 'blue.solid' : 'border.emphasized'}
				bg={on ? 'blue.subtle' : 'bg.muted'}
				color={on ? 'blue.fg' : 'fg.muted'}
				cursor='pointer'
				onClick={pick}>
				{spotOf(tree, path).hint}
			</Box>
		);

	const tok = (content: ReactNode, color?: string) => (
		<Box
			as='span'
			cursor='pointer'
			color={color}
			_hover={{ color: 'blue.fg' }}
			onClick={pick}>
			{content}
		</Box>
	);
	const chip = (key: string) => (
		<Box
			as='span'
			display='inline-block'
			px={1.5}
			mx='1px'
			lineHeight='1.6'
			borderRadius='sm'
			bg='blue.subtle'
			color='blue.fg'
			fontFamily='body'
			fontSize='xs'
			fontWeight='500'
			cursor='pointer'
			title={key}
			onClick={pick}>
			{fieldLabel(fieldOf(key), key)}
		</Box>
	);

	let body: ReactNode = null;
	let brackets = false;
	switch (n.t) {
		case 'num':
			body = tok(String(n.v));
			break;
		case 'str':
			body = tok(`"${n.v}"`, 'green.fg');
			break;
		case 'bool':
			body = tok(n.v ? 'yes' : 'no', 'purple.fg');
			break;
		case 'ref':
			body = chip(n.key);
			break;
		case 'agg':
			body = (
				<>
					{tok(`${n.name}(`)}
					{chip(n.key)}
					{tok(')')}
				</>
			);
			break;
		case 'neg':
			body = (
				<>
					{tok('−')}
					<Part
						n={n.a}
						path={[...path, 0]}
						parent={3}
					/>
				</>
			);
			break;
		case 'bin':
		case 'cmp':
		case 'logic': {
			const p = levelOf(n)!;
			// Comparisons sit inside the arithmetic's brackets: `(a > b) * 2`.
			const lp = n.t === 'cmp' ? 0.5 : p;
			brackets = n.t === 'cmp' ? parent > 0 : p < parent || (right && p === parent);
			body = (
				<>
					<Part
						n={n.a}
						path={[...path, 0]}
						parent={lp}
					/>
					{tok(` ${SHOW[n.op] || n.op} `, 'fg.muted')}
					<Part
						n={n.b}
						path={[...path, 1]}
						parent={lp}
						right={n.t !== 'cmp'}
					/>
				</>
			);
			break;
		}
		case 'fn':
			body = (
				<>
					{tok(`${n.name}(`, n.name === 'if' ? 'orange.fg' : 'teal.fg')}
					{n.args.map((a, i) => (
						<Fragment key={i}>
							{i > 0 && tok(', ', 'fg.muted')}
							<Part
								n={a}
								path={[...path, i]}
							/>
						</Fragment>
					))}
					{tok(')', n.name === 'if' ? 'orange.fg' : 'teal.fg')}
				</>
			);
			break;
	}
	return (
		<Box
			as='span'
			borderRadius='sm'
			bg={on ? 'blue.subtle' : undefined}
			boxShadow={on ? '0 0 0 1px var(--chakra-colors-blue-solid)' : undefined}>
			{brackets && tok('(')}
			{body}
			{brackets && tok(')')}
		</Box>
	);
};

/* ---------- the buttons ---------- */

const Row: FC<{ label: string; children: ReactNode }> = ({ label, children }) => (
	<Flex
		gap={1}
		align='center'
		flexWrap='wrap'>
		<Text
			fontSize='xs'
			color='fg.muted'
			w='64px'
			flexShrink={0}>
			{label}
		</Text>
		{children}
	</Flex>
);

const Key: FC<{ title?: string; onClick: () => void; children: ReactNode; disabled?: boolean; tone?: string }> = ({
	title,
	onClick,
	children,
	disabled,
	tone,
}) => (
	<Button
		size='xs'
		variant='outline'
		minW='30px'
		px={2}
		title={title}
		colorPalette={tone}
		disabled={disabled}
		onClick={onClick}>
		{children}
	</Button>
);

const ARITH = [
	{ op: '+', label: '+', title: 'Add' },
	{ op: '-', label: '−', title: 'Subtract' },
	{ op: '*', label: '×', title: 'Multiply' },
	{ op: '/', label: '÷', title: 'Divide (by 0 leaves it empty)' },
	{ op: '%', label: '%', title: 'Remainder after dividing' },
];
const COMPARE = [
	{ op: '=', label: '= is', title: 'is — discount type = "percentage"' },
	{ op: '!=', label: '≠ is not', title: 'is not' },
	{ op: '>', label: '> more than', title: 'more than' },
	{ op: '>=', label: '≥ at least', title: 'at least' },
	{ op: '<', label: '< less than', title: 'less than' },
	{ op: '<=', label: '≤ at most', title: 'at most' },
];
const FNS: { name: FnName; label: string; title: string }[] = [
	{ name: 'round', label: 'Round', title: 'round(x, 2) — to a number of decimals' },
	{ name: 'floor', label: 'Round down', title: 'floor(x) — down to a whole number' },
	{ name: 'ceil', label: 'Round up', title: 'ceil(x) — up to a whole number' },
	{ name: 'abs', label: 'Without sign', title: 'abs(x) — −5 becomes 5' },
	{ name: 'min', label: 'Smallest of', title: 'min(a, b) — the smallest' },
	{ name: 'max', label: 'Largest of', title: 'max(a, b) — the largest' },
];
const DATE_FNS: { name: FnName; label: string; title: string; date: boolean }[] = [
	{ name: 'today', label: 'Today', title: 'today() — now, when the record is saved', date: true },
	{ name: 'addDays', label: 'Add days', title: 'addDays(date, n) — n days later (earlier below 0)', date: true },
	{ name: 'addWeeks', label: 'Add weeks', title: 'addWeeks(date, n)', date: true },
	{ name: 'addMonths', label: 'Add months', title: 'addMonths(date, n) — 31 Jan + 1 month is the end of February', date: true },
	{ name: 'addYears', label: 'Add years', title: 'addYears(date, n)', date: true },
	{ name: 'add', label: 'Add…', title: 'add(date, n, unit) — the unit from a field: add(start, plan.length, plan.unit)', date: true },
	{ name: 'latest', label: 'Latest of', title: 'latest(a, b) — the later date; an empty one is left out: latest(expiresAt, today())', date: true },
	{ name: 'earliest', label: 'Earliest of', title: 'earliest(a, b) — the earlier date', date: true },
	{ name: 'daysBetween', label: 'Days between', title: 'daysBetween(from, to) — a number of whole days', date: false },
];
const UNITS = ['days', 'weeks', 'months', 'years'];

/* ---------- the editor ---------- */

type Props = {
	/** The formula it opens with. Remount (key) to start again. */
	initial: string;
	/** The formula as text — empty while a box is still empty — and whether it's being typed. */
	onText: (text: string, typing: boolean) => void;
	fields: FieldInfo[];
	/** The formula field itself — not offered. */
	self?: string;
	invalid?: boolean;
	/** What it works out: a number (a formula), or a date (a Date formula). */
	returns?: 'number' | 'date';
	/** What the formula sets, shown before it (`self` by default): a rule's "Expires at". */
	lhs?: string;
};

const FormulaEditor: FC<Props> = ({ initial, onText, fields, self, invalid, returns = 'number', lhs }) => {
	const [start] = useState(() => treeOf(initial));
	// A formula with a mistake opens unlocked, to be fixed by hand.
	const [locked, setLocked] = useState(!!start);
	const [tree, setTree] = useState<Node>(start || HOLE);
	const [sel, setSel] = useState<Path>(() => (start ? holesOf(start)[0] || [] : []));
	// The piece just finished, when the highlight moved on to the next box:
	// + − × ÷ still add to it, the way they would typing.
	const [prev, setPrev] = useState<Path | null>(null);
	const [history, setHistory] = useState<{ tree: Node; sel: Path }[]>([]);
	const [text, setText] = useState(initial);
	const [lockError, setLockError] = useState('');
	const [num, setNum] = useState('');
	const [str, setStr] = useState('');
	// The field picker starts afresh after each pick, so the same field can be picked again.
	const [picks, setPicks] = useState(0);
	const area = useRef<HTMLTextAreaElement>(null);
	const cursor = useRef<number | null>(null);
	const latest = useRef(initial);

	const fieldOf = (key: string) => fields.find(f => f.key === key);
	const isDate = returns === 'date';
	const spot = spotOf(tree, sel, isDate);
	// Dates on offer: a Date formula, or a number formula with date fields (Days between).
	const hasDates = isDate || fields.some(f => f.key !== self && f.date);
	const cur = getAt(tree, sel);

	/* --- building, locked --- */

	const commit = (t: Node, s: Path, p: Path | null = null) => {
		setHistory(h => [...h.slice(-49), { tree, sel }]);
		setTree(t);
		setSel(s);
		setPrev(p);
		onText(textOf(t), false);
	};
	const select = (p: Path) => {
		setSel(p);
		setPrev(null);
		const n = getAt(tree, p);
		if (n.t === 'num') setNum(String(n.v));
		if (n.t === 'str') setStr(n.v);
	};
	/** Where the highlight goes after `at` is filled: a box inside it, else the next empty one. */
	const nextSel = (t: Node, at: Path): Path => {
		const inside = holesOf(getAt(t, at), at);
		if (inside.length) return inside[0];
		const all = holesOf(t);
		return all.find(h => after(h, at)) || all[0] || at;
	};
	const place = (n: Node) => {
		const t = setAt(tree, sel, n);
		const next = nextSel(t, sel);
		commit(t, next, !holesOf(n).length && !same(next, sel) ? sel : null);
	};

	const putLeaf = (n: Node) => {
		// A field as a condition reads "field is …"; only a yes / no field holds on its own.
		if (spot.role === 'cond' && n.t === 'ref' && !fieldOf(n.key)?.yesNo) return place({ t: 'cmp', op: '=', a: n, b: HOLE });
		place(n);
	};

	const putFn = (name: FnName) => {
		const filled = !isHole(cur);
		const keep = filled ? cur : HOLE;
		const args: Node[] =
			name === 'if'
				? filled
					? isCondition(cur)
						? [cur, HOLE, HOLE]
						: [HOLE, cur, HOLE]
					: [HOLE, HOLE, HOLE]
				: name === 'round'
				? [keep, { t: 'num', v: 2 }]
				: name === 'min' || name === 'max' || name === 'latest' || name === 'earliest' || name === 'daysBetween'
				? [keep, HOLE]
				: name === 'today'
				? []
				: name === 'add'
				? [keep, HOLE, HOLE]
				: name.startsWith('add')
				? [keep, HOLE]
				: [keep];
		place({ t: 'fn', name, args, at: 0 } as Node);
	};

	const putOp = (kind: 'bin' | 'cmp' | 'logic', op: string) => {
		const s = prev && isHole(cur) ? prev : sel;
		const here = getAt(tree, s);
		const up = s.slice(0, -1);
		const parent = s.length ? getAt(tree, up) : null;
		const make = (a: Node) => ({ t: kind, op, a, b: HOLE } as Node);
		// Changing one's mind: a comparison's own sign, or the sign just before an empty box.
		if (kind === 'cmp' && here.t === 'cmp') return commit(setAt(tree, s, { ...here, op } as Node), sel);
		if (kind === 'cmp' && parent?.t === 'cmp') return commit(setAt(tree, up, { ...parent, op } as Node), sel);
		if (isHole(here) && parent?.t === kind && s[s.length - 1] === 1) return commit(setAt(tree, up, { ...parent, op } as Node), s);
		if (isHole(here)) return commit(setAt(tree, s, make(HOLE)), [...s, 0]);
		// After a part: it takes what it's the end of, as typing it would — `a − b` then − is
		// (a − b) − …, then × is a − b × ….
		const level = levelOf(make(HOLE))!;
		let target = s;
		while (target.length && target[target.length - 1] === 1) {
			const lv = levelOf(getAt(tree, target.slice(0, -1)));
			if (lv === null || !(lv > level || (lv === level && level !== 0))) break;
			target = target.slice(0, -1);
		}
		commit(setAt(tree, target, make(getAt(tree, target))), [...target, 1]);
	};

	/** The If the highlight is in, followed down to its last otherwise. */
	const lastOtherwise = (): Path | null => {
		for (let k = sel.length; k >= 0; k--) {
			let p = sel.slice(0, k);
			const n = getAt(tree, p);
			if (n.t !== 'fn' || n.name !== 'if') continue;
			for (;;) {
				const e = getAt(tree, [...p, 2]);
				if (e.t !== 'fn' || e.name !== 'if') return [...p, 2];
				p = [...p, 2];
			}
		}
		return null;
	};
	const elsePath = locked ? lastOtherwise() : null;
	const otherwiseIf = () => {
		if (!elsePath) return;
		commit(setAt(tree, elsePath, { t: 'fn', name: 'if', args: [HOLE, HOLE, getAt(tree, elsePath)], at: 0 }), [...elsePath, 0]);
	};

	const remove = () => {
		const s = prev && isHole(cur) ? prev : sel;
		const here = getAt(tree, s);
		if (!isHole(here)) return commit(setAt(tree, s, HOLE), s);
		if (!s.length) return;
		// An empty box: what holds it goes too, keeping the rest.
		const up = s.slice(0, -1);
		const p = getAt(tree, up);
		const i = s[s.length - 1];
		if (p.t === 'bin' || p.t === 'logic' || p.t === 'cmp') return commit(setAt(tree, up, i === 0 ? p.b : p.a), up);
		if (p.t === 'neg') return commit(setAt(tree, up, HOLE), up);
		if (p.t !== 'fn') return;
		if ((p.name === 'min' || p.name === 'max' || p.name === 'latest' || p.name === 'earliest') && p.args.length > 2)
			return commit(setAt(tree, up, { ...p, args: p.args.filter((_, k) => k !== i) }), up);
		// An "otherwise if" with no condition: its own otherwise takes its place.
		const outer = up.length ? getAt(tree, up.slice(0, -1)) : null;
		if (p.name === 'if' && i === 0 && up[up.length - 1] === 2 && outer?.t === 'fn' && outer.name === 'if')
			return commit(setAt(tree, up, p.args[2]), up);
		if (p.args.length === 1) return commit(setAt(tree, up, HOLE), up);
	};

	const undo = () => {
		const last = history[history.length - 1];
		if (!last) return;
		setHistory(h => h.slice(0, -1));
		setTree(last.tree);
		setSel(last.sel);
		setPrev(null);
		onText(textOf(last.tree), false);
	};

	const onBarKey = (e: KeyboardEvent) => {
		if (e.key === 'Backspace' || e.key === 'Delete') {
			e.preventDefault();
			remove();
		} else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
			e.preventDefault();
			undo();
		}
	};

	/* --- typing, unlocked --- */

	const change = (v: string) => {
		latest.current = v;
		setText(v);
		onText(v, true);
	};

	/** Puts `token` in at the cursor (or the end), spaced, and keeps the cursor after it. */
	const insert = (token: string) => {
		// From the ref, not the render's `text`: two quick clicks both see the latest.
		const was = latest.current;
		const at = Math.min(cursor.current ?? was.length, was.length);
		// A closing bracket hugs what it closes.
		const before = token === ')' ? was.slice(0, at).replace(/\s+$/, '') : was.slice(0, at);
		const rest = was.slice(at).replace(/^\s+/, '');
		const pad = /[\s(]$/.test(before) || !before ? '' : ' ';
		const piece = token === ')' ? token : `${pad}${token}${token.endsWith('(') || token === '""' ? '' : ' '}`;
		// Into an empty pair of quotes, to type the text.
		const pos = before.length + piece.length - (token === '""' ? 1 : 0);
		change(`${before}${piece}${rest}`);
		cursor.current = pos;
		requestAnimationFrame(() => {
			area.current?.focus();
			area.current?.setSelectionRange(pos, pos);
		});
	};
	const remember = () => (cursor.current = area.current?.selectionStart ?? null);

	const unlock = () => {
		// Empty boxes stay visible as ___, to be typed over.
		const s = isHole(tree) ? '' : format(mapNode(tree, n => (isHole(n) ? { t: 'ref', key: BLANK, at: 0 } : n)));
		latest.current = s;
		setText(s);
		cursor.current = null;
		setLockError('');
		setLocked(false);
		onText(s, true);
	};
	const lock = () => {
		const t = treeOf(latest.current);
		if (!t) return setLockError('The formula has a mistake — fix it (or clear it) to build it with the buttons again.');
		setLockError('');
		setLocked(true);
		setHistory([]);
		setTree(t);
		setSel(holesOf(t)[0] || []);
		setPrev(null);
		onText(textOf(t), false);
	};

	/** A button's piece: into the highlighted box, or typed in at the cursor. */
	const use = (typed: string, build: () => void) => (locked ? build() : insert(typed));

	/* --- what's on offer --- */

	type Entry = { value: string; label: string; node: Node; typed: string; numeric: boolean; date?: boolean };
	const entries: Entry[] = fields
		.filter(f => f.key !== self)
		.flatMap((f): Entry[] => {
			const label = fieldLabel(f);
			const named = label === f.key ? f.key : `${label} (${f.key})`;
			if (f.list)
				return [{ value: `count:${f.key}`, label: `Number of rows in ${label}`, node: { t: 'agg', name: 'count', key: f.key, at: 0 }, typed: `count(${f.key})`, numeric: true }];
			if (f.inList)
				return f.numeric
					? (['sum', 'avg'] as const).map(name => ({
							value: `${name}:${f.key}`,
							label: `${name === 'sum' ? 'Total' : 'Average'} of ${label} in ${fieldLabel(fieldOf(f.inList!), f.inList)}`,
							node: { t: 'agg', name, key: f.key, at: 0 } as Node,
							typed: `${name}(${f.key})`,
							numeric: true,
					  }))
					: [];
			return [
				{
					value: `ref:${f.key}`,
					label: f.date
						? `${named} — a date${f.linked ? ' from the linked record' : ''}`
						: f.numeric
						? f.linked
							? `${named} — from the linked record`
							: named
						: `${named} — to check in a condition`,
					node: { t: 'ref', key: f.key, at: 0 },
					typed: f.key,
					numeric: !!f.numeric,
					date: !!f.date,
				},
			];
		});
	// What the box most likely wants first: dates for a date, numbers to calculate with, anything to check.
	const rank = (e: Entry) =>
		locked && spot.role === 'date' ? (e.date ? 0 : 1) : locked && spot.role === 'unit' ? (!e.numeric && !e.date ? 0 : 1) : (!locked || spot.role === 'value') === e.numeric ? 0 : 1;
	const sorted = [...entries].sort((a, b) => rank(a) - rank(b));
	const hasText = hasDates || fields.some(f => f.key !== self && !f.numeric && !f.list && !f.inList);
	const hasYesNo = fields.some(f => f.key !== self && f.yesNo);

	// Checking a choice or yes / no field: its values, to pick from.
	const side = (() => {
		if (!locked || !sel.length) return undefined;
		const p = getAt(tree, sel.slice(0, -1));
		if (p.t !== 'cmp') return undefined;
		const other = sel[sel.length - 1] === 0 ? p.b : p.a;
		return other.t === 'ref' && other.key ? fieldOf(other.key) : undefined;
	})();
	const choices = locked && spot.role === 'unit'
		? UNITS.map(u => ({ value: `s:${u}`, label: u, node: { t: 'str', v: u, at: 0 } as Node }))
		: side?.options?.length
		? side.options.map(o => ({ value: `s:${o.value}`, label: String(o.label ?? o.value), node: { t: 'str', v: String(o.value), at: 0 } as Node }))
		: side?.yesNo
		? [
				{ value: 'b:true', label: 'Yes', node: { t: 'bool', v: true } as Node },
				{ value: 'b:false', label: 'No', node: { t: 'bool', v: false } as Node },
		  ]
		: [];

	const numOk = !!num.trim() && Number.isFinite(Number(num));
	const addNum = () => {
		if (!numOk) return;
		use(String(Number(num)), () => putLeaf({ t: 'num', v: Number(num) }));
		setNum('');
	};
	const addStr = () => {
		const v = str.replace(/["“”]/g, '');
		use(`"${v}"`, () => putLeaf({ t: 'str', v, at: 0 }));
		setStr('');
	};

	const holes = holesOf(tree).length;
	const prompt = !locked
		? 'Typing it yourself — the buttons put their piece in at the cursor.'
		: holes && isHole(cur)
		? `${spot.prompt}${prev ? ' Or keep calculating with + − × ÷.' : ''}`
		: holes
		? `Change the highlighted part with the buttons, or click an empty box (${holes} left) to fill it.`
		: sel.length
		? 'Done. + − × ÷ add to the highlighted part. Click another part to change it, or the sign between two parts to work on both.'
		: 'Done. + − × ÷ add to the whole formula. Click a part of it to change that part.';

	return (
		<Flex
			direction='column'
			gap={3}>
			<Text
				px={3}
				py={2}
				borderRadius='md'
				fontSize='sm'
				bg={locked ? 'blue.subtle' : 'bg.muted'}
				color={locked ? 'blue.fg' : 'fg.muted'}>
				{prompt}
			</Text>

			<Flex
				direction='column'
				gap={2}>
				<Row label='Fields'>
					<Dropdown
						key={picks}
						size='xs'
						w='260px'
						value=''
						placeholder={sorted.length ? 'Choose a field…' : 'No fields to use'}
						disabled={!sorted.length}
						onChange={(v: string) => {
							const e = sorted.find(x => x.value === v);
							if (e) use(e.typed, () => putLeaf(e.node));
							setPicks(n => n + 1);
						}}>
						{sorted.map(e => (
							<option
								key={e.value}
								value={e.value}>
								{e.label}
							</option>
						))}
					</Dropdown>
					{choices.length > 0 && (
						<Dropdown
							key={`c${picks}`}
							size='xs'
							w='180px'
							value=''
							placeholder={spot.role === 'unit' ? 'Unit…' : `${fieldLabel(side)} is…`}
							onChange={(v: string) => {
								const c = choices.find(x => x.value === v);
								if (c) putLeaf(c.node);
								setPicks(n => n + 1);
							}}>
							{choices.map(c => (
								<option
									key={c.value}
									value={c.value}>
									{c.label}
								</option>
							))}
						</Dropdown>
					)}
				</Row>
				<Row label='Values'>
					<Input
						size='xs'
						w='90px'
						inputMode='decimal'
						placeholder='Number'
						value={num}
						onChange={e => setNum(e.target.value)}
						onKeyDown={e => e.key === 'Enter' && addNum()}
					/>
					<Key
						disabled={!numOk}
						onClick={addNum}>
						Add
					</Key>
					{hasText && (
						<>
							<Input
								size='xs'
								w='120px'
								ml={2}
								placeholder='Text'
								value={str}
								onChange={e => setStr(e.target.value)}
								onKeyDown={e => e.key === 'Enter' && addStr()}
							/>
							<Key
								title='Text to check a choice or text field against'
								onClick={addStr}>
								Add
							</Key>
						</>
					)}
					{hasYesNo && (
						<>
							<Key
								title='To check a yes / no field'
								onClick={() => use('true', () => putLeaf({ t: 'bool', v: true }))}>
								Yes
							</Key>
							<Key
								title='To check a yes / no field'
								onClick={() => use('false', () => putLeaf({ t: 'bool', v: false }))}>
								No
							</Key>
						</>
					)}
				</Row>
				<Row label='Calculate'>
					{ARITH.map(o => (
						<Key
							key={o.op}
							title={o.title}
							onClick={() => use(o.op, () => putOp('bin', o.op))}>
							{o.label}
						</Key>
					))}
					{!locked && (
						<>
							<Key
								title='Open bracket'
								onClick={() => insert('(')}>
								(
							</Key>
							<Key
								title='Close bracket'
								onClick={() => insert(')')}>
								)
							</Key>
						</>
					)}
					{FNS.map(f => (
						<Key
							key={f.name}
							title={f.title}
							tone='teal'
							onClick={() => use(`${f.name}(`, () => putFn(f.name))}>
							{f.label}
						</Key>
					))}
				</Row>
				{hasDates && (
					<Row label='Dates'>
						{DATE_FNS.filter(f => (isDate ? true : !f.date)).map(f => (
							<Key
								key={f.name}
								title={f.title}
								tone='cyan'
								onClick={() => use(f.name === 'today' ? 'today()' : `${f.name}(`, () => putFn(f.name))}>
								{f.label}
							</Key>
						))}
						{!isDate && (
							<Text
								fontSize='xs'
								color='fg.muted'>
								A date itself needs a Formula (date) field.
							</Text>
						)}
					</Row>
				)}
				<Row label='Decide'>
					<Key
						title='if(condition, then, otherwise) — one value or another, by a condition'
						tone='orange'
						onClick={() => use('if(', () => putFn('if'))}>
						If
					</Key>
					{locked && (
						<Key
							title='Check another condition before the last otherwise'
							tone='orange'
							disabled={!elsePath}
							onClick={otherwiseIf}>
							Otherwise if
						</Key>
					)}
					{COMPARE.map(o => (
						<Key
							key={o.op}
							title={o.title}
							tone='purple'
							onClick={() => use(o.op, () => putOp('cmp', o.op))}>
							{o.label}
						</Key>
					))}
					<Key
						title='Both conditions hold'
						tone='purple'
						onClick={() => use('and', () => putOp('logic', 'and'))}>
						and
					</Key>
					<Key
						title='Either condition holds'
						tone='purple'
						onClick={() => use('or', () => putOp('logic', 'or'))}>
						or
					</Key>
					<Key
						title='When a condition doesn’t hold'
						tone='purple'
						onClick={() => use('not(', () => putFn('not'))}>
						not
					</Key>
				</Row>
			</Flex>

			{/* The formula: built by the buttons, or typed once unlocked. */}
			<Box>
				<Flex
					align='center'
					gap={1}
					mb={1}>
					<Text
						fontSize='xs'
						fontWeight='600'
						flex={1}>
						Formula
					</Text>
					{locked && (
						<>
							<Button
								size='2xs'
								variant='ghost'
								disabled={!history.length}
								onClick={undo}>
								<Undo2 size={12} />
								Undo
							</Button>
							<Button
								size='2xs'
								variant='ghost'
								title='Backspace does the same'
								disabled={isHole(tree)}
								onClick={remove}>
								<Delete size={12} />
								Remove
							</Button>
							<Button
								size='2xs'
								variant='ghost'
								disabled={isHole(tree)}
								onClick={() => commit(HOLE, [])}>
								Clear
							</Button>
						</>
					)}
					<Button
						size='2xs'
						variant='outline'
						ml={1}
						onClick={locked ? unlock : lock}>
						{locked ? <LockOpen size={12} /> : <Lock size={12} />}
						{locked ? 'Type it yourself' : 'Back to buttons'}
					</Button>
				</Flex>
				{locked ? (
					<BarContext.Provider value={{ tree, sel, select, fieldOf }}>
						<Box
							tabIndex={0}
							onKeyDown={onBarKey}
							// A click beside the parts highlights the whole formula.
							onClick={() => select([])}
							p={3}
							minH='60px'
							borderWidth='1px'
							borderColor={invalid ? 'red.solid' : 'border'}
							borderRadius='md'
							bg='bg'
							fontFamily='mono'
							fontSize='sm'
							lineHeight='2'
							whiteSpace='pre-wrap'
							wordBreak='break-word'
							cursor='default'
							_focusVisible={{ outline: '2px solid', outlineColor: 'blue.solid' }}>
							<Text
								as='span'
								color='fg.muted'>
								{lhs ? `${lhs} = ` : self ? `${self} = ` : '= '}
							</Text>
							<Part
								n={tree}
								path={[]}
							/>
						</Box>
					</BarContext.Provider>
				) : (
					<Textarea
						ref={area}
						rows={3}
						fontFamily='mono'
						fontSize='sm'
						placeholder={isDate ? 'e.g. addDays(invoiceDate, 30)' : 'e.g. total - paid'}
						value={text}
						aria-invalid={invalid || undefined}
						borderColor={invalid ? 'red.solid' : undefined}
						onChange={e => {
							change(e.target.value);
							cursor.current = e.target.selectionStart;
						}}
						onSelect={remember}
						onKeyUp={remember}
						onClick={remember}
					/>
				)}
				{lockError && (
					<Text
						mt={1}
						fontSize='sm'
						color='red.fg'>
						{lockError}
					</Text>
				)}
			</Box>
		</Flex>
	);
};

export default FormulaEditor;
