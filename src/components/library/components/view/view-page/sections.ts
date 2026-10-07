/**
 * Turn a form layout into view sections.
 *
 * The create/edit form already answers the question a view page has to answer —
 * which fields belong together, and what that group is called. Rather than ask
 * every model to describe its fields twice, the view reads the same
 * `formFields` layout and renders a container per section.
 *
 * A layout row may be a bare field name or an array of names sitting
 * side-by-side on the form (`[['name', 'project'], ['category']]`). That
 * grouping is a form-width concern and means nothing in a read-only grid, so
 * rows are flattened and only the section boundary survives.
 */

export type ViewSection = {
	title: string;
	/** The form section's own `description`, shown under the heading. */
	description?: string;
	fields: string[];
};

const flattenRows = (rows: any[]): string[] => {
	const out: string[] = [];

	(rows || []).forEach(row => {
		if (Array.isArray(row)) {
			row.forEach(field => {
				if (typeof field === 'string') out.push(field);
			});
			return;
		}

		if (typeof row === 'string') out.push(row);
	});

	return out;
};

/**
 * `allFields` is the flat list the page would otherwise have rendered. Anything
 * in it that no section claims lands in a trailing group rather than being
 * dropped: a field added to the model but not yet to the form layout should
 * show up looking unplaced, not vanish.
 */
export const buildViewSections = (formFields: any[], allFields?: string[]): ViewSection[] => {
	const sections: ViewSection[] = (formFields || [])
		.map((section: any) => ({
			title: section?.sectionTitle || '',
			description: section?.description,
			fields: flattenRows(section?.fields),
		}))
		.filter(section => section.fields.length);

	if (!sections.length) return [];
	if (!allFields?.length) return sections;

	const claimed: Record<string, boolean> = {};
	sections.forEach(section => section.fields.forEach(field => (claimed[field] = true)));

	const leftover = allFields.filter(field => !claimed[field]);
	if (leftover.length) sections.push({ title: 'Other', fields: leftover });

	return sections;
};

/**
 * The same layout, from a route's form config (`/get/config` → `form`): a flat
 * list of fields where one carrying a `sectionTitle` starts a new section.
 * For routes whose form lives in the route builder rather than in code.
 */
export const formFieldsFromConfig = (form: any[]): { sectionTitle: string; fields: string[] }[] => {
	const out: { sectionTitle: string; fields: string[] }[] = [];
	(form || []).forEach((f: any) => {
		const key = f?.name || f?.key;
		if (!key) return;
		if (f.sectionTitle || !out.length) out.push({ sectionTitle: f.sectionTitle || '', fields: [] });
		out[out.length - 1].fields.push(key);
	});
	return out;
};
