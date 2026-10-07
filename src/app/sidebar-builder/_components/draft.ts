/**
 * The sidebar builder edits a local copy of the SidebarCategory and
 * SidebarItem records, and only talks to the server on Save. This file holds
 * that copy's shape and turns "what was loaded" + "what's on screen" into the
 * plain CRUD calls the two routes already take.
 *
 * Order is stored as `priority`, highest first (see getAdminSidebar). A list
 * is only renumbered when its order actually changed, so saving one renamed
 * page doesn't rewrite the priority of every record.
 */

export type Item = {
	key: string;
	_id?: string;
	name: string;
	href: string;
	icon: string;
	isActive: boolean;
	permissionProtected: boolean;
	permission: string;
	tooltip: string;
	description: string;
	priority?: number;
};

export type Section = {
	key: string;
	_id?: string;
	name: string;
	icon: string;
	isActive: boolean;
	tooltip: string;
	description: string;
	priority?: number;
	items: Item[];
};

export const ITEM_FIELDS = ['name', 'href', 'icon', 'isActive', 'permissionProtected', 'permission', 'tooltip', 'description'] as const;
export const SECTION_FIELDS = ['name', 'icon', 'isActive', 'tooltip', 'description'] as const;

let seq = 0;
export const tempKey = (prefix: string) => `new-${prefix}-${Date.now().toString(36)}-${++seq}`;

const byPriority = (a: any, b: any) => (b.priority || 0) - (a.priority || 0) || String(a._id).localeCompare(String(b._id));

/** The loaded records as sections holding their items, in sidebar order. */
export const toSections = (categories: any[] = [], items: any[] = []): Section[] =>
	[...categories].sort(byPriority).map(c => ({
		key: c._id,
		_id: c._id,
		name: c.name || '',
		icon: c.icon || '',
		isActive: c.isActive !== false,
		tooltip: c.tooltip || '',
		description: c.description || '',
		priority: c.priority,
		items: items
			.filter(i => String(i.category?._id || i.category) === String(c._id))
			.sort(byPriority)
			.map(i => ({
				key: i._id,
				_id: i._id,
				name: i.name || '',
				href: i.href || '',
				icon: i.icon || '',
				isActive: i.isActive !== false,
				permissionProtected: !!i.permissionProtected,
				permission: i.permission || '',
				tooltip: i.tooltip || '',
				description: i.description || '',
				priority: i.priority,
			})),
	}));

/** Stored without a leading slash; the sidebar controller adds it. */
export const cleanHref = (href: string) => href.trim().replace(/^\/+/, '').replace(/\s+/g, '-');

/** What a page's permission defaults to: the view permission of its route. */
export const defaultPermission = (href: string) => `view-${cleanHref(href).split('/')[0] || 'page'}`;

export const emptyItem = (): Item => ({
	key: tempKey('item'),
	name: '',
	href: '',
	icon: '',
	isActive: true,
	permissionProtected: false,
	permission: '',
	tooltip: '',
	description: '',
});

export const emptySection = (): Section => ({
	key: tempKey('section'),
	name: '',
	icon: 'folder',
	isActive: true,
	tooltip: '',
	description: '',
	items: [],
});

/** Why an item can't be saved, or null. */
export const itemProblem = (i: Item) =>
	!i.name.trim() ? 'needs a label' : !cleanHref(i.href) ? 'needs a page address' : null;

export type Op =
	| { kind: 'create-section'; section: Section; body: any }
	| { kind: 'update-section'; id: string; name: string; body: any }
	| { kind: 'delete-section'; id: string; name: string }
	| { kind: 'create-item'; item: Item; sectionKey: string; body: any }
	| { kind: 'update-item'; id: string; name: string; body: any; sectionKey?: string }
	| { kind: 'delete-item'; id: string; name: string };

const pick = (obj: any, fields: readonly string[]) => Object.fromEntries(fields.map(f => [f, obj[f]]));

const changed = (before: any, after: any, fields: readonly string[]) => {
	const out: any = {};
	fields.forEach(f => {
		if ((before?.[f] ?? '') !== (after?.[f] ?? '')) out[f] = after[f];
	});
	return out;
};

/** Priorities for a list in display order: 10 apart, highest first. */
const numbered = (n: number, i: number) => (n - i) * 10;

const sameOrder = (a: string[], b: string[]) => a.length === b.length && a.every((k, i) => k === b[i]);

/**
 * Every call needed to turn `base` (as loaded) into `next` (as edited), in the
 * order they must run: sections are created before the items that need their
 * ids, and items are deleted before the sections that held them.
 */
export const diff = (base: Section[], next: Section[]): Op[] => {
	const ops: Op[] = [];
	const baseSections = new Map(base.map(s => [s.key, s]));
	const baseItems = new Map<string, { item: Item; section: string }>();
	base.forEach(s => s.items.forEach(i => baseItems.set(i.key, { item: i, section: s.key })));

	const nextItemKeys = new Set(next.flatMap(s => s.items.map(i => i.key)));
	const nextSectionKeys = new Set(next.map(s => s.key));

	const renumberSections = !sameOrder(
		base.filter(s => nextSectionKeys.has(s.key)).map(s => s.key),
		next.map(s => s.key)
	);

	next.forEach((s, si) => {
		const priority = renumberSections ? numbered(next.length, si) : s.priority;
		const before = baseSections.get(s.key);
		if (!before) {
			ops.push({
				kind: 'create-section',
				section: s,
				body: { ...pick(s, SECTION_FIELDS), name: s.name.trim(), priority },
			});
		} else {
			const body = changed(before, { ...s, name: s.name.trim() }, SECTION_FIELDS);
			if (priority !== before.priority) body.priority = priority;
			if (Object.keys(body).length) ops.push({ kind: 'update-section', id: s._id!, name: s.name, body });
		}
	});

	next.forEach(s => {
		const baseOrder = (baseSections.get(s.key)?.items || []).filter(i => nextItemKeys.has(i.key)).map(i => i.key);
		const renumber = !sameOrder(baseOrder, s.items.map(i => i.key));

		s.items.forEach((i, ii) => {
			const priority = renumber ? numbered(s.items.length, ii) : i.priority;
			const href = cleanHref(i.href);
			const permission = i.permission.trim() || defaultPermission(href);
			const clean = { ...i, name: i.name.trim(), href, permission };
			const before = baseItems.get(i.key);
			if (!before) {
				ops.push({
					kind: 'create-item',
					item: i,
					sectionKey: s.key,
					body: { ...pick(clean, ITEM_FIELDS), priority },
				});
			} else {
				const body = changed(before.item, clean, ITEM_FIELDS);
				const moved = before.section !== s.key;
				if (priority !== before.item.priority) body.priority = priority;
				if (moved || Object.keys(body).length)
					ops.push({ kind: 'update-item', id: i._id!, name: i.name, body, ...(moved && { sectionKey: s.key }) });
			}
		});
	});

	baseItems.forEach(({ item }, key) => {
		if (!nextItemKeys.has(key)) ops.push({ kind: 'delete-item', id: item._id!, name: item.name });
	});
	base.forEach(s => {
		if (!nextSectionKeys.has(s.key)) ops.push({ kind: 'delete-section', id: s._id!, name: s.name });
	});

	// A moved item's new category, like a created item's, is set by the save
	// loop from `sectionKey` — a brand-new section has no id until it's
	// created, which is why section creates run first. Deletes run last.
	const rank: Record<Op['kind'], number> = {
		'create-section': 0,
		'update-section': 1,
		'create-item': 2,
		'update-item': 2,
		'delete-item': 3,
		'delete-section': 4,
	};
	return ops.sort((a, b) => rank[a.kind] - rank[b.kind]);
};

/** "3 changes" — for the save bar. */
export const describe = (ops: Op[]) => `${ops.length} change${ops.length === 1 ? '' : 's'}`;
