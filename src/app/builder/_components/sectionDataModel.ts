import { EditableField, FieldKind, newUid, sectionPreset } from '@/app/model-builder/_components/modelKinds';
import { FieldInfo } from '@/components/library/functions/formula';

/**
 * A section field's own fields, between the two shapes they live in:
 *
 * - settings (`schema.section.dataModel` for a list, `schema.dataModel` for
 *   a single section): `{ name, label, type, isRequired, options, formula }`,
 *   `type` being the form input;
 * - the model builder's field editor (EditableField, by kind) — which the
 *   route builder reuses to edit them (SectionFieldsModal).
 *
 * An input the editor has no kind for (a rich-text editor, a record picker…)
 * reads as Text and keeps its input unless the kind is changed.
 */

/** The inputs that hold a section's own fields. */
export const SECTION_INPUTS = ['section-data-array', 'section-object'];
export const isSectionInput = (type?: string) => SECTION_INPUTS.includes(type || '');

const KIND_OF: Record<string, FieldKind> = {
	text: 'text',
	string: 'text',
	textarea: 'textarea',
	email: 'email',
	url: 'url',
	color: 'color',
	number: 'number',
	formula: 'formula',
	checkbox: 'boolean',
	switch: 'boolean',
	date: 'date',
	select: 'select',
	image: 'image',
	file: 'file',
};

const INPUT_OF: Partial<Record<FieldKind, string>> = {
	text: 'text',
	textarea: 'textarea',
	email: 'email',
	url: 'text',
	color: 'color',
	number: 'number',
	formula: 'formula',
	boolean: 'checkbox',
	date: 'date',
	select: 'select',
	image: 'image',
	file: 'file',
};

type Sub = EditableField & { _input?: string; _extra?: Record<string, any> };

/** The section's fields of a settings field, where they sit for its input. */
export const dataModelOf = (f: any): any[] => {
	const list = f?.schema?.type === 'section-data-array' ? f?.schema?.section?.dataModel : f?.schema?.dataModel;
	return Array.isArray(list) ? list.filter((x: any) => x && typeof x.name === 'string') : [];
};

export const fromDataModel = (dm: any[]): Sub[] =>
	dm.map(({ name, label, type, isRequired, options, formula, helper, kind: _k, ...extra }: any) => {
		const kind: FieldKind = KIND_OF[type] || 'text';
		return {
			uid: newUid(),
			key: name,
			label,
			kind: kind === 'select' && !options?.length ? 'text' : kind,
			keyTouched: true,
			...(isRequired && { required: true }),
			...(options?.length && { options: options.map((o: any) => ({ value: String(o.value), label: o.label })) }),
			...(formula && { formula }),
			...(helper && { helper }),
			// Kept as they were: an input with no kind of its own, and props the editor doesn't show (span…).
			...(!KIND_OF[type] && typeof type === 'string' && type ? { _input: type } : {}),
			...(Object.keys(extra).length > 0 && { _extra: extra }),
		};
	});

export const toDataModel = (fields: Sub[]): any[] =>
	fields.map(f => ({
		...(f._extra || {}),
		name: f.key,
		label: f.label || f.key,
		type: f.kind === 'text' && f._input ? f._input : INPUT_OF[f.kind] || 'text',
		...(f.required && f.kind !== 'formula' && { isRequired: true }),
		...(f.helper && { helper: f.helper }),
		...(f.kind === 'select' && f.options?.length && { options: f.options.filter(o => o.value?.trim()) }),
		...(f.kind === 'formula' && { formula: f.formula || '' }),
	}));

/** The section's fields as the dialog edits them: a new section starts from the preset. */
export const editableSection = (f: any) => {
	const isList = f?.schema?.type === 'section-data-array';
	const dm = dataModelOf(f);
	return {
		uid: `section-${f.key}`,
		key: f.key,
		label: f.title,
		kind: (isList ? 'sectionlist' : 'section') as FieldKind,
		fields: dm.length ? fromDataModel(dm) : sectionPreset(isList ? 'sectionlist' : 'section'),
		addLabel: f?.schema?.section?.addBtnText,
	};
};

/** The settings `schema` after the dialog saves `fields` (and a list's add button). */
export const withSection = (f: any, fields: Sub[], addLabel?: string) => {
	const dataModel = toDataModel(fields);
	if (f?.schema?.type !== 'section-data-array') return { ...(f.schema || {}), dataModel };
	const section = f.schema.section || {};
	const texts = fields.filter(x => ['text', 'email', 'url', 'select', 'textarea'].includes(x.kind));
	return {
		...f.schema,
		section: {
			...section,
			title: section.title || f.title,
			addBtnText: addLabel || section.addBtnText || 'Add row',
			...(section.btnText !== undefined && { btnText: addLabel || section.btnText }),
			// The form lists the rows as a table, number columns added up.
			table: true,
			display: {
				...(section.display || {}),
				title: fields.some(x => x.key === section.display?.title) ? section.display.title : texts[0]?.key,
				description: fields.some(x => x.key === section.display?.description) ? section.display.description : texts[1]?.key,
			},
			dataModel,
		},
	};
};

/**
 * What a formula may use from a section field: a list itself (count) and
 * its rows' values (`items.total`, for sum / avg); a single section's values
 * as `billing.fee`. Empty for any other field.
 */
export const sectionFormulaInfo = (f: any): FieldInfo[] => {
	const dm = dataModelOf(f);
	if (!dm.length || !isSectionInput(f?.schema?.type)) return [];
	const numeric = (x: any) => x.type === 'number' || x.type === 'formula';
	if (f.schema.type === 'section-data-array')
		return [
			{ key: f.key, label: f.title, numeric: false, list: true },
			...dm.map(x => ({ key: `${f.key}.${x.name}`, label: x.label, numeric: numeric(x), inList: f.key })),
		];
	return dm.map(x => ({ key: `${f.key}.${x.name}`, label: `${f.title || f.key} › ${x.label || x.name}`, numeric: numeric(x) }));
};
