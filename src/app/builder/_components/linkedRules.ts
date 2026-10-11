import { TabCondition, Match, conditionsText } from './ConditionsEditor';

/**
 * Linked Relationships, the builder's side (docs/linked-relationships): the
 * rule shape the server reads (backend linkedRelationships.function.ts — keep
 * the two in step), the sentence a rule reads as, and what a rule still lacks
 * before it can be saved. The server checks the rest at save and publish.
 */

export type LinkedAction = 'create' | 'update' | 'delete';
export type HowKind = 'value' | 'from' | 'formula' | 'inc' | 'dec' | 'clear';

export type Assignment = {
	field: string;
	value?: any;
	from?: string;
	formula?: string;
	inc?: string | number;
	dec?: string | number;
	/** With inc / dec: never below this — the save is refused instead. */
	min?: number | string;
	message?: string;
	clear?: boolean;
};

export type LinkedRule = {
	id: string;
	name?: string;
	enabled?: boolean;
	on?: LinkedAction[];
	when?: TabCondition[];
	match?: Match;
	target: { via: string; route?: string; when?: TabCondition[]; match?: Match };
	set?: Assignment[];
	block?: { message: string };
	undo?: 'revert' | 'keep' | 'block';
	require?: string[];
	asSystem?: boolean;
	fromApi?: boolean;
};

export const ACTIONS: { value: LinkedAction; label: string }[] = [
	{ value: 'create', label: 'added' },
	{ value: 'update', label: 'edited' },
	{ value: 'delete', label: 'deleted' },
];

export const HOW: { value: HowKind; label: string; hint: string }[] = [
	{ value: 'value', label: 'Set to', hint: 'A value you choose — Status to Paid' },
	{ value: 'from', label: 'Copy from this record', hint: 'One of this record’s fields — its Payment date' },
	{ value: 'inc', label: 'Add', hint: 'A number, or this record’s number field — taken off again when it’s undone' },
	{ value: 'dec', label: 'Take off', hint: 'A number, or this record’s number field — given back when it’s undone' },
	{ value: 'formula', label: 'Work out', hint: 'A formula over this.<field> and target.<field>' },
	{ value: 'clear', label: 'Empty it', hint: 'Clear the field' },
];

export const UNDO: { value: 'revert' | 'keep' | 'block'; label: string; hint: string }[] = [
	{
		value: 'revert',
		label: 'Put it back',
		hint: 'The fields go back to what they were — unless someone changed them since, or another record still holds them.',
	},
	{ value: 'keep', label: 'Leave it', hint: 'The linked record keeps the values.' },
	{ value: 'block', label: 'Don’t allow it', hint: 'Deleting or changing this record so the rule no longer holds is refused.' },
];

export const howOf = (a: Assignment): HowKind =>
	a.clear ? 'clear' : a.from !== undefined ? 'from' : a.formula !== undefined ? 'formula' : a.inc !== undefined ? 'inc' : a.dec !== undefined ? 'dec' : 'value';

/** An add or take-off: its amount as written (a number, or this record's field), and whether that is a field. */
export const stepOf = (a: Assignment) => (a.dec !== undefined ? a.dec : a.inc);
export const stepIsField = (a: Assignment) => {
	const v = stepOf(a);
	return typeof v === 'string' && !!v && !Number.isFinite(Number(v));
};

/** An assignment switched to another way of setting the field, keeping the field. */
export const withHow = (a: Assignment, how: HowKind): Assignment => {
	// Between Add and Take off the amount and the floor stay.
	const keep = { ...(a.min !== undefined && { min: a.min }), ...(a.message && { message: a.message }) };
	if (how === 'inc' || how === 'dec') return { field: a.field, [how]: stepOf(a) ?? '', ...keep };
	return how === 'clear' ? { field: a.field, clear: true } : how === 'from' ? { field: a.field, from: '' } : how === 'formula' ? { field: a.field, formula: '' } : { field: a.field, value: '' };
};

export const newRule = (): LinkedRule => ({
	id: `rule-${Math.random().toString(36).slice(2, 8)}`,
	name: '',
	on: ['create', 'update'],
	when: [],
	match: 'all',
	target: { via: '' },
	set: [{ field: '', value: '' }],
	undo: 'revert',
});

type Labels = { self: (k: string) => string; target: (k: string) => string; title?: string; targetTitle?: string };

const list = (xs: string[], last = 'and') => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} ${last} ${xs[xs.length - 1]}`);

/** A condition's value that names this record's field: `{ ref: 'this.amount' }`. */
export const refOf = (v: any): string | undefined =>
	v && typeof v === 'object' && !Array.isArray(v) && typeof v.ref === 'string' && v.ref.startsWith('this.') ? v.ref.slice(5) : undefined;

/** Conditions read with the fields' labels: "Mark as paid is true", "Balance is less than this Transfer’s Amount". */
const condText = (conds: TabCondition[] = [], match: Match | undefined, label: (k: string) => string, l?: Labels) =>
	conditionsText(
		conds.map(c => {
			const ref = refOf(c.value);
			return { ...c, field: c.field ? label(c.field) : c.field, ...(ref && { value: `this ${l?.title || 'record'}’s ${l ? l.self(ref) : ref}` }) };
		}) as any,
		match
	);

/** "When a Payment is added or edited, if markPaid is true, update the Invoice in Invoice: set Status to paid…" */
export const ruleSentence = (r: LinkedRule, l: Labels) => {
	const on = (r.on?.length ? r.on : ['create', 'update']).map(a => ACTIONS.find(x => x.value === a)?.label || a);
	const parts = [`When a ${l.title || 'record'} is ${list(on, 'or')}`];
	if (r.when?.length) parts.push(`if ${condText(r.when, r.match, l.self, l)}`);
	const target = `the ${l.targetTitle || 'record'} picked in ${r.target.via ? l.self(r.target.via) : '…'}`;
	const only = r.target.when?.length ? ` (only if its ${condText(r.target.when, r.target.match, l.target, l)})` : '';
	if (r.block) return `${parts.join(', ')}, refuse the save when ${target}${only || ' is picked'}: “${r.block.message || '…'}”`;
	const sets = (r.set || []).map(a => {
		const f = a.field ? l.target(a.field) : '…';
		switch (howOf(a)) {
			case 'clear':
				return `empty ${f}`;
			case 'from':
				return `set ${f} to this record’s ${a.from ? l.self(a.from) : '…'}`;
			case 'inc':
			case 'dec': {
				const amount = stepIsField(a) ? `this record’s ${l.self(String(stepOf(a)))}` : stepOf(a) === '' || stepOf(a) === undefined ? '…' : String(stepOf(a));
				const floor = a.min !== undefined && a.min !== '' ? ` (never below ${a.min} — refused if it would be)` : '';
				return a.dec !== undefined ? `take ${amount} off ${f}${floor}` : `add ${amount} to ${f}${floor}`;
			}
			case 'formula':
				return `set ${f} to ${a.formula || '…'}`;
			default:
				return `set ${f} to ${a.value === '' || a.value === undefined ? '…' : String(a.value)}`;
		}
	});
	return `${parts.join(', ')}, update ${target}${only}: ${list(sets)}.`;
};

/** What a rule still lacks — shown in the dialog, and a save is held back while any rule has some. */
export const ruleProblems = (r: LinkedRule): string[] => {
	const out: string[] = [];
	const name = r.name || 'A rule';
	if (!r.target?.via) out.push(`${name}: pick the field that picks the record to change`);
	// No `on` at all means added and edited; an emptied list means never.
	if (Array.isArray(r.on) && !r.on.length) out.push(`${name}: pick when it runs`);
	if (r.block) {
		if (!r.block.message?.trim()) out.push(`${name}: write the message people see when it refuses`);
	} else {
		if (!r.set?.length) out.push(`${name}: add a field to change`);
		(r.set || []).forEach((a, i) => {
			if (!a.field) out.push(`${name}: change ${i + 1} needs a field`);
			const how = howOf(a);
			if (how === 'from' && !a.from) out.push(`${name}: say which field to copy into ${a.field || `change ${i + 1}`}`);
			if (how === 'formula' && !String(a.formula || '').trim()) out.push(`${name}: write the formula for ${a.field || `change ${i + 1}`}`);
			if (how === 'inc' && (a.inc === '' || a.inc === undefined)) out.push(`${name}: say what to add to ${a.field || `change ${i + 1}`}`);
			if (how === 'dec' && (a.dec === '' || a.dec === undefined)) out.push(`${name}: say what to take off ${a.field || `change ${i + 1}`}`);
			if (a.min !== undefined && a.min !== '' && !Number.isFinite(Number(a.min))) out.push(`${name}: the lowest value for ${a.field || `change ${i + 1}`} must be a number`);
		});
	}
	for (const c of [...(r.when || []), ...(r.target?.when || [])]) if (!c.field) out.push(`${name}: a condition needs a field`);
	return out;
};

/** The rules ready to save: empty optional parts dropped, `inc` numbers as numbers. */
export const cleanRule = (r: LinkedRule): LinkedRule => {
	const out: any = { ...r, target: { ...r.target } };
	if (!out.name) delete out.name;
	if (!out.when?.length) {
		delete out.when;
		delete out.match;
	}
	if (!out.target.when?.length) {
		delete out.target.when;
		delete out.target.match;
	}
	if (!out.target.route) delete out.target.route;
	if (!out.require?.length) delete out.require;
	if (!out.asSystem) delete out.asSystem;
	if (!out.fromApi) delete out.fromApi;
	if (out.enabled !== false) delete out.enabled;
	if (out.block) {
		delete out.set;
		delete out.undo;
	} else {
		delete out.block;
		out.set = (out.set || []).map((a: Assignment) => {
			const how = howOf(a);
			if (how === 'inc' || how === 'dec') {
				const v = stepOf(a);
				return {
					field: a.field,
					[how]: Number.isFinite(Number(v)) && String(v).trim() !== '' ? Number(v) : v,
					...(a.min !== undefined && String(a.min).trim() !== '' && { min: Number(a.min) }),
					...(a.message?.trim() && { message: a.message.trim() }),
				};
			}
			if (how === 'value') return { field: a.field, value: a.value ?? '' };
			return a;
		});
	}
	return out;
};
