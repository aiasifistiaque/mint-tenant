'use client';

import { FC, useCallback, useEffect, useState } from 'react';
import { useGetBuilderRouteQuery } from '@/components/library';
import { FieldInfo, isDateFormulaSchema, isFormulaType } from '@/components/library/functions/formula';
import { SettingsField } from './SettingsEditor';

/**
 * The fields of the pages a page's record pickers point to — what a formula
 * reads through a link (`plan.price`, `member.expiresAt`). The Fields & rules
 * tab's formula window and a Linked Relationships rule (Copy from Plan › Price,
 * Work out) both offer them, the way the model builder offers a linked
 * model's numbers. Fetched per picker (LinkFields) while they're needed.
 */

/** A page's settings fields, as it runs now (draft first: that's what the builder shows). */
export const settingsOf = (data: any): SettingsField[] =>
	(data?.settings?.draft ?? data?.settings?.data)?.fields || data?.code?.settings?.fields || [];

/** A field's own label. */
export const titleOf = (f: SettingsField) => f?.schema?.label || f?.title || f?.key;
export const isDateField = (f?: SettingsField) => !!f && (f.type === 'date' || f.type === 'date-only' || isDateFormulaSchema(f.schema));
export const isNumberField = (f?: SettingsField) => !!f && !isDateField(f) && (f.type === 'number' || isFormulaType(f.schema?.type));

/** What a formula may know of a settings field, under `key` (`linked`: the link it's read through). */
export const infoOf = (f: SettingsField, key: string, label: string, linked?: string): FieldInfo => {
	const options = Array.isArray(f.schema?.options) ? f.schema.options.map((o: any) => ({ value: o?.value ?? o, label: o?.label ?? o?.value ?? o })) : [];
	return {
		key,
		label,
		numeric: isNumberField(f),
		...(isDateField(f) && { date: true }),
		...(f.type === 'boolean' && { yesNo: true }),
		...(options.length && { options }),
		...(linked && { linked }),
	};
};

/** Inputs that pick one record — what a formula can read through. */
const SINGLE_PICKERS = ['data-menu', 'data-select', 'nested-data-menu'];
/** A page's fields that pick one record of another page. */
export const singlePickers = (fields: SettingsField[]) =>
	fields.filter(f => typeof f.schema?.model === 'string' && f.schema.model && (!f.schema?.type || SINGLE_PICKERS.includes(f.schema.type)));

/** One record picker's page, fetched: its fields reported as `onFields(link, fields)`. */
export const LinkFields: FC<{ link: string; route: string; onFields: (link: string, fields: SettingsField[]) => void }> = ({ link, route, onFields }) => {
	const { data } = useGetBuilderRouteQuery(route);
	useEffect(() => {
		if (data) onFields(link, settingsOf(data));
	}, [data, link, onFields]);
	return null;
};

/** The fields of each picker's page, by link — render `loaders` while `active`. */
export const useLinkFields = (pickers: SettingsField[], active = true) => {
	const [byLink, setByLink] = useState<Record<string, SettingsField[]>>({});
	const onFields = useCallback((link: string, f: SettingsField[]) => setByLink(x => (x[link] === f ? x : { ...x, [link]: f })), []);
	const loaders = active
		? pickers.map(p => (
				<LinkFields
					key={p.key}
					link={p.key}
					route={p.schema.model}
					onFields={onFields}
				/>
		  ))
		: null;
	return { byLink, loaders };
};

/** A linked page's fields a formula can read through the link: `plan.price` as “Plan › Price”. */
export const linkedEntries = (pickers: SettingsField[], byLink: Record<string, SettingsField[]>, labelOfLink: (key: string) => string) =>
	pickers.flatMap(p =>
		(byLink[p.key] || [])
			.filter(lf => !['_id', 'createdAt', 'updatedAt'].includes(lf.key) && !lf.rollup)
			.map(lf => ({ key: `${p.key}.${lf.key}`, label: `${labelOfLink(p.key)} › ${titleOf(lf)}`, f: lf, link: p.key }))
	);
