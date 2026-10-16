import type { Automation, AutomationAction, AutomationEvent, AutomationInput } from '@/components/library/store/services/tenantApi';
import type { ModelField } from '@/app/builder/_components/filterTypes';

/**
 * What the automations page works with (backend docs/automations): a project
 * page and its fields, from the model builder's definitions, and the words an
 * automation is described in.
 */

export type PageField = { key: string; label: string; kind: string; ref?: string; required?: boolean; options?: { value: string; label?: string }[]; default?: any };
export type Page = { route: string; name: string; title: string; noun: string; fields: PageField[] };

export const REFERENCE_KINDS = ['reference', 'references'];
/** Kinds an action can't write (the server refuses them too). */
const UNWRITABLE = new Set(['formula', 'section', 'sectionlist', 'password']);

/** The model builder's definitions as pages. */
export const pagesOf = (defs: any[] = []): Page[] =>
	defs
		.filter(d => d?.route)
		.map(d => {
			const title = d.title || d.name;
			return {
				route: d.route,
				name: String(d.name || '').replace(/^T[0-9a-f]{24}_/, ''),
				title,
				noun: String(title).replace(/s$/i, ''),
				fields: (d.fields || []).map((f: any) => ({ key: f.key, label: f.label || f.key, kind: f.kind, ref: f.ref, required: f.required, options: f.options, default: f.default })),
			};
		});

export const writable = (p?: Page) => (p?.fields || []).filter(f => !UNWRITABLE.has(f.kind));

/** A reference field's page: by the model name it links to. */
export const pageOfRef = (pages: Page[], ref?: string) => pages.find(p => p.name === String(ref || '').replace(/^T[0-9a-f]{24}_/, ''));

/** Email fields, and text fields named like one ("Email address") — not every Name and Note. */
const addressFields = (p?: Page) => (p?.fields || []).filter(f => f.kind === 'email' || (f.kind === 'text' && /e-?mail/i.test(`${f.key} ${f.label}`)));

/**
 * The fields an email can be sent to: the record's own ("email") and those of
 * each record it links to ("customer.email" — a bill's Customer → Email).
 */
export const addressSources = (page: Page | undefined, pages: Page[]) => [
	...addressFields(page).map(f => ({ value: f.key, label: `This ${page?.noun || 'record'}’s ${f.label}` })),
	...(page?.fields || [])
		.filter(f => REFERENCE_KINDS.includes(f.kind))
		.flatMap(f => addressFields(pageOfRef(pages, f.ref)).map(x => ({ value: `${f.key}.${x.key}`, label: `${f.label} → ${x.label}` }))),
];

const INSTANCE: Record<string, string> = { number: 'Number', formula: 'Number', boolean: 'Boolean', date: 'Date' };

/** A page's fields for the shared ConditionsEditor. */
export const conditionFields = (p?: Page): ModelField[] =>
	(p?.fields || [])
		.filter(f => !['section', 'sectionlist', 'password', 'image', 'images', 'file', 'files', 'video', 'editor'].includes(f.kind))
		.map(f => ({
			key: f.key,
			instance: INSTANCE[f.kind] || (REFERENCE_KINDS.includes(f.kind) ? 'ObjectId' : 'String'),
			...(f.ref && { ref: f.ref }),
			...(f.options?.length && { enum: f.options.map(o => o.value) }),
			...(['references', 'multiselect', 'tags'].includes(f.kind) && { isArray: true }),
		}));

export const EVENT_WORD: Record<AutomationEvent, string> = { create: 'created', update: 'changed', delete: 'deleted' };

export const ACTION_LABEL: Record<AutomationAction['type'], string> = {
	notify: 'Notify people',
	email: 'Send an email',
	webhook: 'Call a webhook',
	update: 'Update a record',
	create: 'Create a record',
};

export const ACTION_HINT: Record<AutomationAction['type'], string> = {
	notify: 'A notification in the panel, for people in this project.',
	email: 'Through the project’s default email account (Project → Email), or the organization’s server if it has none.',
	webhook: 'POSTs the record to your server, signed with this automation’s secret.',
	update: 'Change fields of this record, or of a record it links to.',
	create: 'Add a record to another page — a task for a new order, a log line.',
};

export const newAction = (type: AutomationAction['type']): AutomationAction => {
	switch (type) {
		case 'notify':
			return { type, to: { people: [], actor: false }, title: '', message: '' };
		case 'email':
			return { type, to: { people: [], actor: false, fields: [], emails: [] }, subject: '', body: '' };
		case 'webhook':
			return { type, url: '' };
		case 'update':
			return { type, target: 'this', set: [{ field: '', value: '' }] };
		case 'create':
			return { type, route: '', set: [{ field: '', value: '' }] };
	}
};

export const EMPTY: AutomationInput = { name: '', description: '', enabled: true, route: '', on: ['create'], changed: [], when: [], match: 'all', actions: [newAction('notify')] };

export const inputOf = (a: Automation): AutomationInput => ({
	name: a.name,
	description: a.description || '',
	enabled: a.enabled,
	route: a.route,
	on: a.on,
	changed: a.changed || [],
	when: a.when || [],
	match: a.match || 'all',
	actions: a.actions,
});

const list = (words: string[], last = 'or') => (words.length <= 1 ? words.join('') : `${words.slice(0, -1).join(', ')} ${last} ${words[words.length - 1]}`);

/** "When a Deal is changed (Status) and Status is won: notify people, call a webhook." */
export const sentence = (a: AutomationInput, pages: Page[]) => {
	const page = pages.find(p => p.route === a.route);
	const label = (k: string) => page?.fields.find(f => f.key === k)?.label || k;
	const events = list(a.on.map(e => EVENT_WORD[e]));
	const changed = a.on.includes('update') && a.changed?.length ? ` (${list(a.changed.map(label))})` : '';
	const conds = a.when?.length ? ` and ${a.when.length === 1 ? 'a condition holds' : `${a.match === 'any' ? 'any' : 'all'} of ${a.when.length} conditions hold`}` : '';
	const actions = list(a.actions.map(x => ACTION_LABEL[x.type].toLowerCase()), 'and');
	return `When ${page ? `a ${page.noun}` : 'a record'} is ${events || '…'}${changed}${conds}: ${actions || '…'}.`;
};

/** The placeholders a text of `page` can use. */
export const placeholdersOf = (page?: Page) => [
	...(page?.fields || []).filter(f => !['section', 'sectionlist', 'password'].includes(f.kind)).map(f => ({ key: f.key, label: f.label })),
	{ key: 'link', label: 'Link' },
	{ key: 'page', label: 'Page' },
	{ key: 'project', label: 'Project' },
	{ key: 'actor', label: 'Who saved' },
	{ key: 'event', label: 'Event' },
	{ key: 'today', label: 'Today' },
];
