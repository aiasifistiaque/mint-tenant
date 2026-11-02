'use client';

import { FC, useEffect, useRef } from 'react';
import { useLazyGetByIdQuery } from '../../../store/services/commonApi';
import { fillHolds, fillValue, linkedId } from '../../../functions/linkedFill';

/**
 * Autofill on the form (settings `schema.fillFrom`, docs/autofill): the fields
 * that copy a field of a linked record are filled when that record is picked —
 * choosing a customer sets the order's phone. Only on a change made in the form —
 * opening a saved record never overwrites what it holds. An editable one stays
 * editable and is filled again when another record is picked, or when its
 * conditions (`when`) start to hold and it is empty; a read-only one (`readonly`)
 * is the server's: it follows the pick, and is emptied when the pick is cleared
 * or while its conditions don't hold (it stays locked). Renders nothing.
 */

type Props = {
	fields: any[];
	formData: any;
	setFormData: any;
	setChangedData: any;
};

const blank = (v: any) => v === undefined || v === null || v === '' || (Array.isArray(v) && !v.length);
const same = (a: any, b: any) => (blank(a) && blank(b)) || String(a) === String(b);

const LinkedFiller: FC<Props> = ({ fields, formData, setFormData, setChangedData }) => {
	const fills = (fields || []).filter((f: any) => f?.name && f?.fillFrom?.from && f?.fillFrom?.formula);
	// The picker each fill reads, and the route its records come from.
	const routeOf = (from: string) => (fields || []).find((f: any) => f?.name === from)?.model;
	const [fetchOne] = useLazyGetByIdQuery();
	const seen = useRef<Record<string, string | null>>({});
	const doc = useRef<any>(Symbol('none'));
	// The picked record of each link (kept to check conditions on it), and whether each fill's conditions held last time.
	const records = useRef<Record<string, { id: string; rec: any } | undefined>>({});
	const held = useRef<Record<string, boolean | undefined>>({});
	const latest = useRef<any>(formData);
	latest.current = formData;

	useEffect(() => {
		if (!fills.length) return;
		// A record loading into the form (edit), not a pick: remember its links, fill nothing.
		const loaded = formData?._id !== doc.current;
		doc.current = formData?._id;
		const initial = loaded && !!formData?._id;
		const froms = [...new Set(fills.map((f: any) => f.fillFrom.from as string))];

		/** Brings the fills of one link in step with the form and the picked record. */
		const evaluate = (from: string, rec: any, opts: { linkChanged: boolean; cleared: boolean; initial: boolean }) => {
			const form = latest.current;
			const values: Record<string, any> = {};
			for (const f of fills.filter((x: any) => x.fillFrom.from === from)) {
				const ok = fillHolds(f.fillFrom, form, rec);
				const was = held.current[f.name];
				held.current[f.name] = ok;
				if (opts.initial) continue;
				const readonly = !!f.fillFrom.readonly;
				const now = form?.[f.name];
				if (!rec) {
					// The link was cleared (the read-only copies go; an editable one keeps what was typed), or conditions on this record alone stopped holding.
					if (readonly && (opts.cleared || !ok) && !blank(now)) values[f.name] = null;
					continue;
				}
				if (!ok) {
					if (readonly && !blank(now)) values[f.name] = null;
					continue;
				}
				const v = fillValue(f.fillFrom.formula, rec);
				if (readonly) {
					// Nothing to copy: a read-only copy empties with it (a customer without an email).
					const next = v === undefined || v === null ? null : v;
					if (!same(now, next)) values[f.name] = next;
				} else if (v !== undefined && v !== null && (opts.linkChanged || (was === false && blank(now)))) values[f.name] = v;
			}
			if (!Object.keys(values).length) return;
			setFormData((p: any) => ({ ...p, ...values }));
			setChangedData?.((p: any) => ({ ...(p || {}), ...values }));
		};

		for (const from of froms) {
			const id = linkedId(formData?.[from]);
			const before = seen.current[from];
			seen.current[from] = id;
			if (!id) {
				records.current[from] = undefined;
				evaluate(from, null, { linkChanged: false, cleared: !!before && !initial, initial });
				continue;
			}
			const have = records.current[from];
			if (have?.id === id) {
				evaluate(from, have.rec, { linkChanged: false, cleared: false, initial });
				continue;
			}
			const route = routeOf(from);
			if (!route) continue;
			const linkChanged = !initial && id !== before;
			fetchOne({ path: route, id }, true)
				.unwrap()
				.then((rec: any) => {
					// Picked something else meanwhile: that pick fills instead.
					if (seen.current[from] !== id) return;
					records.current[from] = { id, rec };
					evaluate(from, rec, { linkChanged, cleared: false, initial });
				})
				.catch(() => {});
		}
		// Only the form's values matter; the fills come from the same fields every render.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [formData]);

	return null;
};

export default LinkedFiller;
