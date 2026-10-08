'use client';

import { FC, useEffect, useRef } from 'react';
import { useLazyGetByIdQuery } from '../../../store/services/commonApi';
import { fillValue, linkedId } from '../../../functions/linkedFill';

/**
 * Fills the form's fields that come from a linked record (settings
 * `schema.fillFrom`) when that record is picked: choosing a bill sets the
 * payment's amount to the bill's total. Only on a change made in the form —
 * opening a saved record never overwrites what it holds — and the filled
 * value stays editable. Renders nothing.
 */

type Props = {
	fields: any[];
	formData: any;
	setFormData: any;
	setChangedData: any;
};

const LinkedFiller: FC<Props> = ({ fields, formData, setFormData, setChangedData }) => {
	const fills = (fields || []).filter((f: any) => f?.name && f?.fillFrom?.from && f?.fillFrom?.formula);
	// The picker each fill reads, and the route its records come from.
	const routeOf = (from: string) => (fields || []).find((f: any) => f?.name === from)?.model;
	const [fetchOne] = useLazyGetByIdQuery();
	const seen = useRef<Record<string, string | null>>({});
	const doc = useRef<any>(Symbol('none'));

	useEffect(() => {
		if (!fills.length) return;
		// A record loading into the form (edit), not a pick: remember its links, fill nothing.
		const loaded = formData?._id !== doc.current;
		doc.current = formData?._id;
		const froms = [...new Set(fills.map((f: any) => f.fillFrom.from as string))];
		for (const from of froms) {
			const id = linkedId(formData?.[from]);
			const before = seen.current[from];
			seen.current[from] = id;
			if (loaded && formData?._id) continue;
			if (!id || id === before) continue;
			const route = routeOf(from);
			if (!route) continue;
			fetchOne({ path: route, id }, true)
				.unwrap()
				.then((linked: any) => {
					// Picked something else meanwhile: that pick fills instead.
					if (seen.current[from] !== id) return;
					const values: Record<string, any> = {};
					for (const f of fills.filter((x: any) => x.fillFrom.from === from)) {
						const v = fillValue(f.fillFrom.formula, linked);
						if (v !== undefined && v !== null) values[f.name] = v;
					}
					if (!Object.keys(values).length) return;
					setFormData((p: any) => ({ ...p, ...values }));
					setChangedData?.((p: any) => ({ ...(p || {}), ...values }));
				})
				.catch(() => {});
		}
		// Only the form's values matter; the fills come from the same fields every render.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [formData]);

	return null;
};

export default LinkedFiller;
