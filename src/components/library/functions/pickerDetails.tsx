'use client';

import { ReactNode } from 'react';
import { Text } from '@chakra-ui/react';
import { useGetConfigQuery } from '../store/services/commonApi';
import { choicesOf } from './optionColors';

/**
 * Details under each record in a picker's list (settings `schema.pickerDetails`:
 * keys of the linked model's fields) — a bill's total and due date under its
 * name, so the right one can be told apart before it's picked. Choice
 * names come from the linked page's config.
 */

const ISO_DATE = /^\d{4}-\d{2}-\d{2}(T[\d:.]+(Z|[+-]\d{2}:?\d{2})?)?$/;

const valueAt = (doc: any, path: string) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), doc);

/** One field of a record as short words: a choice's name, a date, a number with separators. */
export const detailText = (doc: any, key: string, schema?: any): string => {
	const words = (v: any): string => {
		if (v === null || v === undefined || v === '') return '';
		if (Array.isArray(v)) return v.map(words).filter(Boolean).join(', ');
		if (typeof v === 'boolean') return v ? 'Yes' : 'No';
		if (typeof v === 'number') return v.toLocaleString();
		if (typeof v === 'object') return String(v.name || v.title || v.label || v.code || '');
		const s = String(v);
		const choice = choicesOf(schema).find(o => String(o.value) === s);
		if (choice) return String(choice.label);
		if (ISO_DATE.test(s)) {
			const d = new Date(s);
			if (!isNaN(d.getTime())) return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
		}
		return s;
	};
	return words(valueAt(doc, key));
};

/**
 * How a picker shows its details (settings `schema.pickerDetailsLayout`):
 * `inline` puts them on one line under the name, separated by dots;
 * `stacked` gives each its own line.
 */
export type PickerDetailsLayout = 'inline' | 'stacked';

/** The picker's detail line(s) for a record, or null when none is set or the record has none filled. */
export const usePickerDetails = (model: string | undefined, keys: unknown, layout?: PickerDetailsLayout) => {
	const list: string[] = Array.isArray(keys) ? keys.filter(k => typeof k === 'string' && k) : [];
	// The linked page's config turns stored values into words (choice names).
	const { data } = useGetConfigQuery(model || '', { skip: !model || !list.length });
	const schema = data?.schema || {};
	const stacked = layout === 'stacked';

	// Values only: the field's name would crowd a line meant to tell two
	// records apart at a glance — "1,200 · 12 Oct 2026" reads on its own.
	return (doc: any): ReactNode => {
		if (!list.length) return null;
		const parts = list.map(key => ({ key, text: detailText(doc, key, schema?.[key]) })).filter(p => p.text);
		if (!parts.length) return null;
		const line = { as: 'span' as const, display: 'block', fontSize: '11px', lineHeight: '1.4', color: 'fg.muted', fontWeight: '400', truncate: true };
		if (stacked)
			return parts.map(p => (
				<Text
					key={p.key}
					{...line}>
					{p.text}
				</Text>
			));
		return <Text {...line}>{parts.map(p => p.text).join(' · ')}</Text>;
	};
};
