import { projectHref } from '../../../../config/lib/constants/panel';
/**
 * Linked records: a field whose value is another record — a reference
 * (`client`), a list of them (`access`), or a populated owner (`addedBy`).
 * View pages and view modals draw these as RecordLink chips, which name the
 * record, show a card of it on hover, and link to its view page.
 */

/**
 * Admins are read through /access-users (name and email only), which every
 * signed-in admin can call — /admins needs a permission most people lack —
 * and viewed on the admins page.
 */
const FETCH_PATH: Record<string, string> = { admins: 'access-users' };
const VIEW_ROUTE: Record<string, string> = { 'access-users': 'admins' };

/** Keys that always point at an admin, whichever route they're on. */
const ADMIN_KEYS = ['addedBy', 'createdBy', 'updatedBy', 'access'];

export const fetchPathOf = (route: string) => FETCH_PATH[route] || route;
export const viewRouteOf = (route: string) => VIEW_ROUTE[route] || route;
export const viewHrefOf = (route: string, id: string) => projectHref(`/view/${viewRouteOf(route)}/${id}`);

export const idOf = (item: any): string =>
	item && typeof item === 'object' ? String(item._id || '') : typeof item === 'string' ? item : '';

/** What a record is called: its name, else its title, code or email. */
export const labelOf = (record: any): string => {
	if (!record || typeof record !== 'object') return '';
	for (const k of ['name', 'title', 'label', 'code', 'email', 'phone']) {
		const v = record[k];
		if (typeof v === 'string' && v.trim()) return v.trim();
		if (typeof v === 'number') return String(v);
	}
	return '';
};

const isRecord = (v: any) => v && typeof v === 'object' && !Array.isArray(v) && v._id;

/** The route a field's linked records live under — '' when it isn't linked. */
export const routeOf = (field: any): string => {
	const root = String(field?.dataKey || '').split('.')[0];
	return field?.model || (ADMIN_KEYS.includes(root) ? 'access-users' : '');
};

/**
 * The record a view field shows part of, when there is one: `addedBy.name`
 * on a record whose `addedBy` came back populated, or a reference picked in
 * a form. The route comes from the field's `model`, else from the key.
 */
export const linkOf = (field: any, doc: any): { route: string; record: any } | null => {
	const dataKey: string = field?.dataKey || '';
	if (!dataKey || !doc) return null;
	const raw = doc[dataKey.split('.')[0]];
	const route = routeOf(field);
	if (!route) return null;
	if (isRecord(raw)) return { route, record: raw };
	if (field?.originalType === 'data-menu' && typeof raw === 'string' && raw) return { route, record: { _id: raw } };
	return null;
};

/** Anything that would show a secret — never listed on a card. */
const SECRET = /pass(word)?|token|secret|api_?key|apikey|private|otp|salt|hash/i;
const SKIP = new Set(['_id', '__v', '_model', 'id', 'createdAt', 'updatedAt', 'isDeleted', 'deletedAt', 'preferences']);
const IMAGE_KEYS = ['image', 'avatar', 'photo', 'logo', 'thumbnail', 'picture', 'icon'];

const humanize = (key: string) =>
	key
		.replace(/([a-z])([A-Z])/g, '$1 $2')
		.replace(/[_-]+/g, ' ')
		.replace(/^./, c => c.toUpperCase());

const isImageUrl = (v: any) => typeof v === 'string' && /^(https?:)?\/\/|^\//.test(v);

/** The picture, heading, sub-heading and a few details a record's card shows. */
export const cardOf = (record: any, max = 5) => {
	const title = labelOf(record);
	const image = IMAGE_KEYS.map(k => record?.[k]).find(isImageUrl) as string | undefined;
	const subtitle = ['email', 'code', 'phone']
		.map(k => record?.[k])
		.find(v => typeof v === 'string' && v && v !== title) as string | undefined;

	const details: { label: string; value: string }[] = [];
	for (const [k, v] of Object.entries(record || {})) {
		if (details.length >= max) break;
		if (SKIP.has(k) || SECRET.test(k) || IMAGE_KEYS.includes(k)) continue;
		if (v === title || v === subtitle) continue;
		let value: string;
		if (typeof v === 'string') {
			if (!v.trim() || /^[a-f0-9]{24}$/i.test(v) || /<\/?[a-z][\s\S]*>/i.test(v)) continue;
			value = /^\d{4}-\d{2}-\d{2}T/.test(v) ? new Date(v).toLocaleDateString() : v;
		} else if (typeof v === 'number') value = v.toLocaleString();
		else if (typeof v === 'boolean') value = v ? 'Yes' : 'No';
		else if (isRecord(v) && labelOf(v)) value = labelOf(v);
		else continue;
		details.push({ label: humanize(k), value: value.length > 80 ? `${value.slice(0, 77)}…` : value });
	}
	return { title, subtitle, image, details };
};

/**
 * What a view row passes to renderViewItem as `link`: the linked record for
 * a single reference, or just the route for a list of them.
 */
export const linkFor = (field: any, doc: any) => {
	const route = routeOf(field);
	return route ? linkOf(field, doc) || { route, record: null } : null;
};
