'use client';

import { Split } from 'lucide-react';
import { ToneTitle } from './areas';
import { FC } from 'react';
import { Badge, Box, Button, Flex, IconButton, Input, Text } from '@chakra-ui/react';
import { GitBranch, LayoutList, Plus, Trash2, X } from 'lucide-react';
import { Dropdown, Panel } from '@/components/library/cl';
import { Condition, Operator, Rule, Rules, fieldsOfRule } from '@/components/library/functions/formRules';
import { DocLink } from './ui';
import RecordPicker from './RecordPicker';

/**
 * Conditional form fields — the config's `formRules`. Each rule shows one
 * field only while conditions on other fields hold ("Company name" when Type
 * is Business). Rules chain: a hidden field reads as empty to the rules that
 * depend on it, so "if A then B, if B then C" hides C when A is cleared.
 *
 * The server applies the same rules on save (a hidden field's value is
 * dropped, and a hidden field isn't required). A rule set in the settings
 * (`schema.renderIf`) shows here as inherited; adding one for the same field
 * replaces it.
 */

export type RuleField = {
	key: string;
	label?: string;
	/** The form input, e.g. select, switch, number. */
	input?: string;
	/** The data type from the settings. */
	type?: string;
	options?: { value: any; label?: any }[];
	required?: boolean;
	/** A record picker's linked route (settings `schema.model`). */
	route?: string;
};

type Props = {
	rules: Rules;
	onChange: (rules: Rules | undefined) => void;
	/** The fields in the form, in form order. */
	fields: RuleField[];
	/** Rules from the settings' renderIf, shown until replaced here. */
	inherited?: Rules;
	/** The record page's rules (config viewRules) rather than the form's: its own words, no "required". */
	forView?: boolean;
};

const ICON = { size: 14, strokeWidth: 1.75 };

type Kind = 'bool' | 'choice' | 'number' | 'record' | 'text';
const BOOL_INPUTS = ['switch', 'checkbox'];
const NUMBER_INPUTS = ['number', 'formula', 'slider'];
const RECORD_INPUTS = ['data-menu', 'data-select', 'data-tag', 'nested-data-menu'];

export const kindOf = (f?: RuleField): Kind => {
	if (!f) return 'text';
	if (BOOL_INPUTS.includes(f.input || '') || f.type === 'boolean') return 'bool';
	if (f.options?.length) return 'choice';
	if (NUMBER_INPUTS.includes(f.input || '') || f.type === 'number') return 'number';
	if (RECORD_INPUTS.includes(f.input || '')) return 'record';
	return 'text';
};

const OP_LABEL: Record<Operator, string> = {
	eq: 'is',
	neq: 'is not',
	in: 'is one of',
	notIn: 'is none of',
	gt: 'is more than',
	gte: 'is at least',
	lt: 'is less than',
	lte: 'is at most',
	empty: 'is empty',
	notEmpty: 'is filled in',
	true: 'is on',
	false: 'is off',
};
export const OPS_BY_KIND: Record<Kind, Operator[]> = {
	bool: ['true', 'false'],
	choice: ['eq', 'neq', 'in', 'notIn', 'empty', 'notEmpty'],
	number: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'empty', 'notEmpty'],
	record: ['eq', 'neq', 'in', 'notIn', 'notEmpty', 'empty'],
	text: ['eq', 'neq', 'in', 'notIn', 'notEmpty', 'empty'],
};
const NO_VALUE: Operator[] = ['empty', 'notEmpty', 'true', 'false'];
const LIST_VALUE: Operator[] = ['in', 'notIn'];

/** The editable shape of a rule: all/any of a flat list of conditions — or not editable here (nested groups). */
type UiRule = { mode: 'all' | 'any'; conditions: Condition[] } | null;
export const toUi = (rule: Rule): UiRule => {
	if ('all' in rule || 'any' in rule) {
		const list = 'all' in rule ? rule.all : (rule as any).any;
		if (list.every((r: Rule) => !('all' in r) && !('any' in r))) return { mode: 'all' in rule ? 'all' : 'any', conditions: list as Condition[] };
		return null;
	}
	return { mode: 'all', conditions: [rule as Condition] };
};
export const fromUi = (ui: { mode: 'all' | 'any'; conditions: Condition[] }): Rule =>
	ui.conditions.length === 1 ? ui.conditions[0] : ui.mode === 'all' ? { all: ui.conditions } : { any: ui.conditions };

export const conditionProblem = (c: Condition, byKey: Map<string, RuleField>) => {
	if (!c.field) return 'Pick a field';
	if (!byKey.has(c.field)) return `“${c.field}” isn't in the form`;
	if (NO_VALUE.includes(c.operator)) return '';
	if (LIST_VALUE.includes(c.operator)) return Array.isArray(c.value) && c.value.length ? '' : 'Pick at least one value';
	return c.value === undefined || c.value === '' ? 'Enter a value' : '';
};

const ValueInput: FC<{ c: Condition; field?: RuleField; onChange: (v: any) => void }> = ({ c, field, onChange }) => {
	if (NO_VALUE.includes(c.operator)) return null;
	const kind = kindOf(field);
	const opts = field?.options || [];
	if (kind === 'choice' && LIST_VALUE.includes(c.operator)) {
		const picked: any[] = Array.isArray(c.value) ? c.value : [];
		return (
			<Flex
				gap={1}
				flexWrap='wrap'>
				{opts.map(o => {
					const on = picked.some(v => String(v) === String(o.value));
					return (
						<Button
							key={String(o.value)}
							size='2xs'
							variant={on ? 'solid' : 'outline'}
							onClick={() => onChange(on ? picked.filter(v => String(v) !== String(o.value)) : [...picked, o.value])}>
							{String(o.label ?? o.value)}
						</Button>
					);
				})}
			</Flex>
		);
	}
	if (kind === 'choice')
		return (
			<Dropdown
				size='xs'
				w='180px'
				value={c.value === undefined ? '' : String(c.value)}
				placeholder='Pick a value'
				onChange={(v: string) => onChange(opts.find(o => String(o.value) === v)?.value ?? v)}>
				{opts.map(o => (
					<option
						key={String(o.value)}
						value={String(o.value)}>
						{String(o.label ?? o.value)}
					</option>
				))}
			</Dropdown>
		);
	// A linked record: picked by name, stored as its id.
	if (kind === 'record' && field?.route)
		return (
			<RecordPicker
				route={field.route}
				multiple={LIST_VALUE.includes(c.operator)}
				value={c.value}
				onChange={onChange}
			/>
		);
	if (LIST_VALUE.includes(c.operator))
		return (
			<Input
				size='xs'
				w='220px'
				placeholder='Values, separated by commas'
				value={Array.isArray(c.value) ? c.value.join(', ') : ''}
				onChange={e =>
					onChange(
						e.target.value
							.split(',')
							.map(s => s.trim())
							.filter(Boolean)
					)
				}
			/>
		);
	return (
		<Input
			size='xs'
			w='160px'
			type={kind === 'number' ? 'number' : 'text'}
			placeholder='Value'
			value={c.value ?? ''}
			onChange={e => onChange(kind === 'number' && e.target.value !== '' ? Number(e.target.value) : e.target.value)}
		/>
	);
};

/** "Type is Business and Amount is more than 100". */
export const describeRule = (rule: Rule, labelOf: (k: string) => string, optionLabel: (k: string, v: any) => string): string => {
	if ('all' in rule) return rule.all.map(r => describeRule(r, labelOf, optionLabel)).join(' and ');
	if ('any' in rule) return rule.any.map(r => describeRule(r, labelOf, optionLabel)).join(' or ');
	const c = rule as Condition;
	const value = NO_VALUE.includes(c.operator)
		? ''
		: Array.isArray(c.value)
		? ` ${c.value.map(v => optionLabel(c.field, v)).join(', ')}`
		: ` ${optionLabel(c.field, c.value)}`;
	return `${labelOf(c.field)} ${OP_LABEL[c.operator] || c.operator}${value}`;
};

/** A rule's conditions, each a field, a test and a value — a field's rule or a section's. */
export const RuleConditions: FC<{
	ui: { mode: 'all' | 'any'; conditions: Condition[] };
	onChange: (ui: { mode: 'all' | 'any'; conditions: Condition[] }) => void;
	/** The fields a condition can test. */
	choices: RuleField[];
	byKey: Map<string, RuleField>;
}> = ({ ui, onChange, choices, byKey }) => (
		<Flex
			direction='column'
			gap={1.5}>
			{ui.conditions.map((c, i) => {
				const f = byKey.get(c.field);
				const ops = OPS_BY_KIND[kindOf(f)];
				const update = (patch: Partial<Condition>) =>
					onChange({ ...ui, conditions: ui.conditions.map((x, j) => (j === i ? { ...x, ...patch } : x)) });
				return (
					<Flex
						key={i}
						gap={2}
						align='center'
						flexWrap='wrap'
						pl={5}>
						<Text
							fontSize='xs'
							color='fg.muted'
							w='34px'>
							{i === 0 ? '' : ui.mode === 'all' ? 'and' : 'or'}
						</Text>
						<Dropdown
							size='xs'
							w='180px'
							value={c.field}
							placeholder='Field'
							onChange={(v: string) => {
								const nk = kindOf(byKey.get(v));
								update({ field: v, operator: OPS_BY_KIND[nk][0], value: undefined });
							}}>
							{choices
								.map(o => (
									<option
										key={o.key}
										value={o.key}>
										{o.label && o.label !== o.key ? `${o.label} (${o.key})` : o.key}
									</option>
								))}
						</Dropdown>
						<Dropdown
							size='xs'
							w='140px'
							value={c.operator}
							onChange={(v: string) =>
								update({
									operator: v as Operator,
									value: NO_VALUE.includes(v as Operator)
										? undefined
										: LIST_VALUE.includes(v as Operator)
										? Array.isArray(c.value)
											? c.value
											: c.value !== undefined && c.value !== ''
											? [c.value]
											: []
										: Array.isArray(c.value)
										? c.value[0]
										: c.value,
								})
							}>
							{(ops.includes(c.operator) ? ops : [c.operator, ...ops]).map(o => (
								<option
									key={o}
									value={o}>
									{OP_LABEL[o] || o}
								</option>
							))}
						</Dropdown>
						<ValueInput
							c={c}
							field={f}
							onChange={value => update({ value })}
						/>
						{ui.conditions.length > 1 && (
							<IconButton
								size='2xs'
								variant='ghost'
								aria-label='Remove this condition'
								onClick={() => onChange({ ...ui, conditions: ui.conditions.filter((_, j) => j !== i) })}>
								<X {...ICON} />
							</IconButton>
						)}
					</Flex>
				);
			})}
			<Box pl={5}>
				<Button
					size='2xs'
					variant='ghost'
					onClick={() =>
						onChange({
							...ui,
							conditions: [...ui.conditions, { field: '', operator: 'eq' }],
						})
					}>
					<Plus {...ICON} />
					Add a condition
				</Button>
			</Box>
		</Flex>
);

const FormRulesPanel: FC<Props> = ({ rules, onChange, fields, inherited = {}, forView }) => {
	const byKey = new Map(fields.map(f => [f.key, f]));
	const labelOf = (k: string) => byKey.get(k)?.label || k;
	const optionLabel = (k: string, v: any) => {
		if (kindOf(byKey.get(k)) === 'record') return 'the picked record';
		const o = byKey.get(k)?.options?.find(o => String(o.value) === String(v));
		return String(o?.label ?? v ?? '');
	};
	const set = (next: Rules) => onChange(Object.keys(next).length ? next : undefined);
	const setRule = (key: string, ui: { mode: 'all' | 'any'; conditions: Condition[] }) => set({ ...rules, [key]: fromUi(ui) });
	const remove = (key: string) => {
		const { [key]: _gone, ...rest } = rules;
		set(rest);
	};

	const shownKeys = [...Object.keys(rules), ...Object.keys(inherited).filter(k => !rules[k])];
	const all = { ...inherited, ...rules };
	const ordered = fields.map(f => f.key).filter(k => shownKeys.includes(k));
	const extra = shownKeys.filter(k => !ordered.includes(k));

	// Rules that depend on each other in a loop: the page would show them regardless.
	const loops = loopsIn(all);

	// Chains: which rules depend on another conditional field.
	const dependsOnConditional = (k: string) => [...fieldsOfRule(all[k])].filter(d => all[d]);
	const addable = fields.filter(f => !rules[f.key]);

	return (
		<Panel
			title={
				<ToneTitle
					icon={Split}
					palette='orange'>
					{forView ? 'Fields shown only when needed' : 'Fields that show only when needed'}
				</ToneTitle>
			}
			subtitle={
				forView
					? 'On the record page and quick view, show a field only when the record holds certain values — “Bank name” only when Method is Bank transfer, “Refund note” only when Status is Refunded. It’s only hidden from view; the value stays.'
					: 'Show a field only when others hold certain values — e.g. “Reason” only when Status is Cancelled. A hidden field counts as empty, so anything that depends on it hides too.'
			}
			actions={<DocLink section={forView ? 'view-visibility' : 'form'} />}>
			<Flex
				direction='column'
				gap={3}>
				{[...ordered, ...extra].map(key => {
					const own = !!rules[key];
					const rule = all[key];
					const ui = toUi(rule);
					const field = byKey.get(key);
					const chain = dependsOnConditional(key);
					const problems = ui ? ui.conditions.map(c => conditionProblem(c, byKey)).filter(Boolean) : [];
					return (
						<Box
							key={key}
							borderWidth='1px'
							borderColor={loops.has(key) || problems.length ? 'red.muted' : 'border'}
							borderRadius='md'
							p={3}
							opacity={own ? 1 : 0.85}>
							<Flex
								align='center'
								gap={2}
								mb={own && ui ? 2.5 : 0}
								flexWrap='wrap'>
								<GitBranch size={13} />
								<Text fontSize='sm'>
									Show <b>{labelOf(key)}</b> only when
								</Text>
								{own && ui && ui.conditions.length > 1 && (
									<Flex gap={1}>
										{(['all', 'any'] as const).map(m => (
											<Button
												key={m}
												size='2xs'
												variant={ui.mode === m ? 'solid' : 'outline'}
												onClick={() => setRule(key, { ...ui, mode: m })}>
												{m === 'all' ? 'all of these' : 'any of these'}
											</Button>
										))}
									</Flex>
								)}
								{!own && (
									<Badge
										size='sm'
										variant='outline'
										title='Set in the settings (renderIf). Edit it here to replace it.'>
										from settings
									</Badge>
								)}
								{field?.required && !forView && (
									<Badge
										size='sm'
										variant='subtle'
										title='Required only while shown — the server doesn’t ask for it when it’s hidden.'>
										required when shown
									</Badge>
								)}
								<Flex
									ml='auto'
									gap={1}>
									{!own && ui && (
										<Button
											size='2xs'
											variant='outline'
											onClick={() => setRule(key, ui)}>
											Edit here
										</Button>
									)}
									{own && (
										<IconButton
											size='2xs'
											variant='ghost'
											color='red.fg'
											aria-label={`Remove the condition on ${labelOf(key)}`}
											title='Remove — the field is always shown'
											onClick={() => remove(key)}>
											<Trash2 {...ICON} />
										</IconButton>
									)}
								</Flex>
							</Flex>

							{own && ui ? (
								<RuleConditions
									ui={ui}
									onChange={next => setRule(key, next)}
									choices={fields.filter(o => o.key !== key)}
									byKey={byKey}
								/>
							) : null}

							<Text
								mt={own && ui ? 2 : 1.5}
								fontSize='xs'
								color={loops.has(key) || problems.length ? 'red.fg' : 'fg.muted'}>
								{loops.has(key)
									? 'These conditions depend on each other in a loop — the fields in it are always shown. Break the loop.'
									: problems.length
									? problems.join(' · ')
									: `Shown when ${describeRule(rule, labelOf, optionLabel)}.${
											chain.length ? ` Hidden too whenever ${chain.map(labelOf).join(', ')} is hidden.` : ''
									  }`}
							</Text>
						</Box>
					);
				})}

				{!shownKeys.length && (
					<Text
						fontSize='sm'
						color='fg.muted'>
						Every field is always shown.
					</Text>
				)}

				<Flex
					align='center'
					gap={2}>
					<Dropdown
						size='xs'
						w='260px'
						value=''
						placeholder={addable.length ? 'Make a field conditional…' : 'Every field has a condition'}
						disabled={!addable.length}
						onChange={(k: string) => {
							if (!k) return;
							const other = fields.find(f => f.key !== k);
							const kind = kindOf(other);
							setRule(k, {
								mode: 'all',
								conditions: [{ field: other?.key || '', operator: OPS_BY_KIND[kind][0] }],
							});
						}}>
						{addable.map(f => (
							<option
								key={f.key}
								value={f.key}>
								{f.label && f.label !== f.key ? `${f.label} (${f.key})` : f.key}
							</option>
						))}
					</Dropdown>
				</Flex>
			</Flex>
		</Panel>
	);
};

/** The fields whose rules depend on each other in a loop. */
const loopsIn = (all: Rules) => {
	const loops = new Set<string>();
	for (const key of Object.keys(all)) {
		const seen = new Set<string>([key]);
		const walk = (k: string): boolean => {
			for (const dep of fieldsOfRule(all[k])) {
				if (dep === key) return true;
				if (!all[dep] || seen.has(dep)) continue;
				seen.add(dep);
				if (walk(dep)) return true;
			}
			return false;
		};
		if (walk(key)) loops.add(key);
	}
	return loops;
};

/** Problems that should stop a save. */
export const formRuleProblems = (rules: Rules | undefined, fields: RuleField[], inherited: Rules = {}) => {
	const out: string[] = [];
	const byKey = new Map(fields.map(f => [f.key, f]));
	const loops = [...loopsIn({ ...inherited, ...(rules || {}) })];
	if (loops.length) out.push(`${loops.map(k => byKey.get(k)?.label || k).join(', ')}: their conditions depend on each other in a loop`);
	for (const [key, rule] of Object.entries(rules || {})) {
		const ui = toUi(rule);
		if (!ui) continue;
		const bad = ui.conditions.map(c => conditionProblem(c, byKey)).filter(Boolean);
		if (bad.length) out.push(`${byKey.get(key)?.label || key}: ${bad[0]}`);
	}
	return out;
};

/** A form section as the config stores it; `showIf` hides all of it. */
type FormSection = { sectionTitle?: string; description?: string; fields?: (string | string[])[]; showIf?: Rule };
const keysOf = (sec: FormSection) => (sec.fields || []).flat().filter((k): k is string => typeof k === 'string');
const sectionName = (sec: FormSection, i: number) => sec.sectionTitle?.trim() || `Section ${i + 1}`;

/**
 * Sections that show only when needed — a form section's `showIf`. The
 * server gives the rule to every field in the section (rulesOf), so a hidden
 * section's values are dropped and its fields aren't required, and the form
 * hides the section, heading and all. Its conditions test fields outside it.
 */
export const SectionRulesPanel: FC<{
	sections: FormSection[];
	onChange: (sections: FormSection[]) => void;
	fields: RuleField[];
}> = ({ sections, onChange, fields }) => {
	const byKey = new Map(fields.map(f => [f.key, f]));
	const labelOf = (k: string) => byKey.get(k)?.label || k;
	const optionLabel = (k: string, v: any) => {
		const f = byKey.get(k);
		if (kindOf(f) === 'record') return 'the picked record';
		const o = f?.options?.find(o => String(o.value) === String(v));
		return String(o?.label ?? v ?? '');
	};
	const setRule = (i: number, rule: Rule | undefined) =>
		onChange(
			sections.map((sec, j) => {
				if (j !== i) return sec;
				const { showIf: _old, ...rest } = sec;
				return rule ? { ...rest, showIf: rule } : rest;
			})
		);
	const outside = (i: number) => {
		const own = new Set(keysOf(sections[i] || {}));
		return fields.filter(f => !own.has(f.key));
	};
	const ruled = sections.map((s, i) => ({ s, i })).filter(x => x.s.showIf);
	const addable = sections.map((s, i) => ({ s, i })).filter(x => !x.s.showIf && keysOf(x.s).length && outside(x.i).length);

	return (
		<Panel
			title={
				<ToneTitle
					icon={LayoutList}
					palette='orange'>
					Sections that show only when needed
				</ToneTitle>
			}
			subtitle='Hide a whole section of the form until it applies — “Bank details” only when Method is Bank transfer. While it’s hidden its fields count as empty: their values aren’t saved and they aren’t required.'
			actions={<DocLink section='form-sections' />}>
			<Flex
				direction='column'
				gap={3}>
				{ruled.map(({ s: sec, i }) => {
					const ui = toUi(sec.showIf as Rule);
					const problems = ui ? ui.conditions.map(c => conditionProblem(c, byKey)).filter(Boolean) : [];
					const inside = ui ? ui.conditions.filter(c => keysOf(sec).includes(c.field)) : [];
					return (
						<Box
							key={i}
							borderWidth='1px'
							borderColor={problems.length || inside.length ? 'red.muted' : 'border'}
							borderRadius='md'
							p={3}>
							<Flex
								align='center'
								gap={2}
								mb={ui ? 2.5 : 0}
								flexWrap='wrap'>
								<LayoutList size={13} />
								<Text fontSize='sm'>
									Show the section <b>{sectionName(sec, i)}</b> only when
								</Text>
								{ui && ui.conditions.length > 1 && (
									<Flex gap={1}>
										{(['all', 'any'] as const).map(m => (
											<Button
												key={m}
												size='2xs'
												variant={ui.mode === m ? 'solid' : 'outline'}
												onClick={() => setRule(i, fromUi({ ...ui, mode: m }))}>
												{m === 'all' ? 'all of these' : 'any of these'}
											</Button>
										))}
									</Flex>
								)}
								<IconButton
									ml='auto'
									size='2xs'
									variant='ghost'
									color='red.fg'
									aria-label={`Remove the condition on ${sectionName(sec, i)}`}
									title='Remove — the section is always shown'
									onClick={() => setRule(i, undefined)}>
									<Trash2 {...ICON} />
								</IconButton>
							</Flex>
							{ui ? (
								<RuleConditions
									ui={ui}
									onChange={next => setRule(i, fromUi(next))}
									choices={outside(i)}
									byKey={byKey}
								/>
							) : (
								<Text
									fontSize='xs'
									color='fg.muted'>
									Nested conditions — edit them in the source.
								</Text>
							)}
							<Text
								mt={2}
								fontSize='xs'
								color={problems.length || inside.length ? 'red.fg' : 'fg.muted'}>
								{inside.length
									? `A section can’t depend on its own fields (${inside.map(c => labelOf(c.field)).join(', ')}) — pick a field from another section.`
									: problems.length
									? problems.join(' · ')
									: `Shown when ${describeRule(sec.showIf as Rule, labelOf, optionLabel)}. Its ${keysOf(sec).length} field${
											keysOf(sec).length === 1 ? '' : 's'
									  } hide with it.`}
							</Text>
						</Box>
					);
				})}

				{!ruled.length && (
					<Text
						fontSize='sm'
						color='fg.muted'>
						Every section is always shown.
					</Text>
				)}

				<Dropdown
					size='xs'
					w='260px'
					value=''
					placeholder={addable.length ? 'Make a section conditional…' : sections.length > 1 ? 'Every section has a condition' : 'Add a second section first'}
					disabled={!addable.length}
					onChange={(v: string) => {
						if (v === '') return;
						const i = Number(v);
						const first = outside(i)[0];
						setRule(i, { field: first?.key || '', operator: OPS_BY_KIND[kindOf(first)][0] });
					}}>
					{addable.map(({ s: sec, i }) => (
						<option
							key={i}
							value={String(i)}>
							{sectionName(sec, i)}
						</option>
					))}
				</Dropdown>
			</Flex>
		</Panel>
	);
};

/** Section conditions that should stop a save. */
export const sectionRuleProblems = (sections: FormSection[] | undefined, fields: RuleField[]) => {
	const byKey = new Map(fields.map(f => [f.key, f]));
	const out: string[] = [];
	(sections || []).forEach((sec, i) => {
		const ui = sec.showIf ? toUi(sec.showIf) : null;
		if (!ui) return;
		const bad = ui.conditions.map(c => conditionProblem(c, byKey)).filter(Boolean);
		if (bad.length) out.push(`${sectionName(sec, i)}: ${bad[0]}`);
		if (ui.conditions.some(c => keysOf(sec).includes(c.field))) out.push(`${sectionName(sec, i)}: depends on its own fields`);
	});
	return out;
};

export default FormRulesPanel;
