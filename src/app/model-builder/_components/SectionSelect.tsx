'use client';

import { FC, ReactNode, useState } from 'react';
import { usePostMutation } from '@/components/library';
import { Dropdown } from '@/components/library/cl';
import { toaster } from '@/components/ui/toaster';
import SectionDialog from '@/app/sidebar-builder/_components/SectionDialog';
import { emptySection, Section, SECTION_FIELDS } from '@/app/sidebar-builder/_components/draft';

/** The option that opens "Add a section" instead of being picked. */
const NEW = '__new-section__';
const SIDEBAR_TAG = `/sidebar/crm/${process.env.NEXT_PUBLIC_SIDEBAR_TYPE || 'generic'}`;

type Props = {
	value: string;
	onChange: (id: string) => void;
	categories: { _id: string; name: string }[];
	placeholder?: string;
	/** Options listed before the sections ("Not in the sidebar", "A new category: …"). */
	before?: ReactNode;
	/** Options listed after them. */
	after?: ReactNode;
};

/**
 * The sidebar section a model's page goes under, with "New section…" at the
 * end: it opens the sidebar builder's section dialog, creates the section
 * through the usual sidebarcategories CRUD and picks it.
 */
const SectionSelect: FC<Props> = ({ value, onChange, categories, placeholder, before, after }) => {
	const [post, { isLoading: saving }] = usePostMutation();
	const [adding, setAdding] = useState<Section | null>(null);
	// Shown until the builder options reload with it.
	const [added, setAdded] = useState<{ _id: string; name: string }[]>([]);
	const list = [...categories, ...added.filter(a => !categories.some(c => c._id === a._id))];

	const create = async (s: Section) => {
		try {
			// Last in the sidebar: the sidebar builder numbers sections 10, 20, … from the bottom.
			const body = { ...Object.fromEntries(SECTION_FIELDS.map(f => [f, s[f]])), priority: 0 };
			const res: any = await post({ path: 'sidebarcategories', body, invalidate: ['builder', SIDEBAR_TAG] }).unwrap();
			const id = res?.doc?._id;
			if (!id) throw new Error();
			setAdded(a => [...a, { _id: id, name: s.name }]);
			onChange(id);
			setAdding(null);
			toaster.create({ title: `Section “${s.name}” added`, description: 'The page goes under it once it’s built.', type: 'success' });
		} catch (e: any) {
			toaster.create({ title: 'Couldn’t add the section', description: e?.data?.message || 'The server refused it.', type: 'error' });
		}
	};

	return (
		<>
			<Dropdown
				value={value}
				placeholder={placeholder}
				onChange={v => (v === NEW ? setAdding(emptySection()) : onChange(v))}>
				{before}
				{list.map(c => (
					<option
						key={c._id}
						value={c._id}>
						{c.name}
					</option>
				))}
				{after}
				<option value={NEW}>+ New section…</option>
			</Dropdown>
			<SectionDialog
				section={adding}
				isNew
				saving={saving}
				onClose={() => setAdding(null)}
				onSave={create}
			/>
		</>
	);
};

export default SectionSelect;
