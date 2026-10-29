/**
 * The table an "Add" page was opened from, so a saved record returns there
 * even when the table lives at its own address (not /t/<route>).
 */
const KEY = 'mint:table-origin';

export const rememberTable = (route: string) => {
	try {
		sessionStorage.setItem(KEY, JSON.stringify({ route, href: window.location.pathname + window.location.search }));
	} catch {}
};

export const recalledTable = (route: string): string => {
	try {
		const v = JSON.parse(sessionStorage.getItem(KEY) || 'null');
		sessionStorage.removeItem(KEY);
		return v && v.route === route ? v.href : '';
	} catch {
		return '';
	}
};
