'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useGetByIdQuery } from '../../../store/services/commonApi';
import { parse, refsOf } from '../../../functions/formula';

/**
 * A formula reading a linked record's number — `total = price + tax.amount`,
 * tax a link to a Tax record: the form only holds the picked record's id, so
 * the record is fetched here and its numbers handed to withFormulaValues. The
 * server reads the same values when it saves (formula.function.ts linkedValues).
 */

type Read = { name: string; model: string; paths: string[] };

/** The links the form's formulas read through, and what they read: `tax.amount` → tax: [amount]. */
const linkedReadsOf = (fields: any[] = []): Read[] => {
	const links = new Map<string, any>(fields.filter(f => f?.type === 'data-menu' && f?.model && f?.name).map(f => [f.name, f]));
	if (!links.size) return [];
	const out = new Map<string, Read>();
	for (const f of fields) {
		if ((f?.type !== 'formula' && f?.type !== 'dateformula') || typeof f.formula !== 'string') continue;
		let refs: Set<string>;
		try {
			refs = refsOf(parse(f.formula));
		} catch {
			continue;
		}
		for (const r of refs) {
			const dot = r.indexOf('.');
			const link = dot > 0 ? links.get(r.slice(0, dot)) : null;
			if (!link) continue;
			if (!out.has(link.name)) out.set(link.name, { name: link.name, model: link.model, paths: [] });
			const read = out.get(link.name)!;
			if (!read.paths.includes(r.slice(dot + 1))) read.paths.push(r.slice(dot + 1));
		}
	}
	return [...out.values()];
};

const idOf = (v: any) => (v && typeof v === 'object' ? v._id : v) || null;
const valueAt = (o: any, path: string) => path.split('.').reduce((x, k) => (x == null ? undefined : x[k]), o);

/** One link's record, fetched while one is picked; its numbers reported as `tax.amount`. */
const Reader = ({ read, id, onValues }: { read: Read; id: string | null; onValues: (name: string, values: Record<string, any>) => void }) => {
	const { data } = useGetByIdQuery({ path: read.model, id }, { skip: !id });
	useEffect(() => {
		const rec = id && data && String(data._id) === String(id) ? data : null;
		onValues(read.name, Object.fromEntries(read.paths.map(p => [`${read.name}.${p}`, rec ? valueAt(rec, p) : null])));
	}, [data, id, read, onValues]);
	return null;
};

/** The numbers the form's formulas read through links, and the (invisible) readers that fetch them — render `readers`. */
export const useLinkedFormulaValues = (fields: any[] = [], formData: any) => {
	const reads = useMemo(() => linkedReadsOf(fields), [fields]);
	const [byLink, setByLink] = useState<Record<string, Record<string, any>>>({});
	const onValues = useCallback(
		(name: string, values: Record<string, any>) =>
			setByLink(prev => (JSON.stringify(prev[name]) === JSON.stringify(values) ? prev : { ...prev, [name]: values })),
		[]
	);
	const linked = useMemo(() => (reads.length ? Object.assign({}, ...reads.map(r => byLink[r.name] || {})) : undefined), [reads, byLink]);
	const readers = reads.map(r => (
		<Reader
			key={r.name}
			read={r}
			id={idOf(formData?.[r.name])}
			onValues={onValues}
		/>
	));
	return { linked, readers };
};
