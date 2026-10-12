'use client';

import { FC, useMemo } from 'react';
import { CreateModal, useGetConfigQuery } from '../../../..';
import { lockedPresets } from '../../../../functions/fieldLocks';
import { nounOf, recordLabel } from '../../../../modals/CreateModal/CreateModal';

/**
 * A row menu's "Add a linked record" (route builder → Row menu, type
 * `add-related`): another page's own create form, with fields filled in from
 * this row — "Add payment" on a bill opens Payment with the bill set. Locked
 * presets show muted with their value; one the form doesn't show is still
 * sent. Saving refreshes this page too (its rows may change through Linked
 * Relationships).
 */

type Preset = { field: string; from?: string; value?: any; lock?: boolean };

type Props = { item: any; doc: any; path: string; onClose: () => void };

const get = (doc: any, path: string) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), doc);

/** A picked record as its id, as the form keeps it. */
const plain = (v: any): any => {
	if (Array.isArray(v)) return v.map(plain);
	if (v && typeof v === 'object' && !(v instanceof Date)) return v._id ?? v.value ?? v;
	return v;
};

const MANY = new Set(['data-tag', 'tag', 'array', 'array-string']);

const AddRelatedDialog: FC<Props> = ({ item, doc, path, onClose }) => {
	const route: string = item?.route;
	const { data: config, isFetching } = useGetConfigQuery(route, { skip: !route });

	const { fields, defaults } = useMemo(() => {
		const form: any[] = Array.isArray(config?.form) ? config.form : [];
		const presets: Preset[] = Array.isArray(item?.presets) ? item.presets : [];
		const defaults: Record<string, any> = {};
		const locks: Record<string, { shown: any; helper: string }> = {};
		const extra: any[] = [];
		const from = recordLabel(doc) || `this ${nounOf(path)}`;
		for (const p of presets) {
			if (!p?.field) continue;
			const raw = p.from === undefined ? p.value : p.from === '_id' ? doc : get(doc, p.from);
			const field = form.find(f => f?.name === p.field);
			let value = plain(raw);
			if (field && MANY.has(field.type) && value != null && !Array.isArray(value)) value = [value];
			defaults[p.field] = value;
			if (!field) extra.push({ name: p.field, type: 'string', renderCondition: () => false });
			else if (p.lock) locks[p.field] = { shown: raw, helper: p.from === undefined ? 'Set for you here' : `Set from ${from}` };
		}
		return { fields: [...lockedPresets(form, locks), ...extra], defaults };
	}, [config, item, doc, path]);

	// The form starts from its fields, so it opens once they're in.
	if (!route || isFetching || !config) return null;

	return (
		<CreateModal
			type='post'
			path={route}
			data={fields}
			defaults={defaults}
			title={item?.title}
			description={recordLabel(doc) ? `From ${recordLabel(doc)}` : undefined}
			invalidate={[path]}
			open
			onClose={onClose}
		/>
	);
};

export default AddRelatedDialog;
