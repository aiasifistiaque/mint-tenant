/**
 * Formatting shared by the provider consoles.
 *
 * These were copied into five files between the Heroku and Vercel pages, in
 * three slightly different spellings — one of them rendering a missing date as
 * `Invalid Date` rather than a dash. One copy, one behaviour.
 */

/** A date with no time: for anything where the hour is noise. */
export const date = (value?: string | number | null): string =>
	value ? new Date(value).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '—';

/** Date and time: for anything an admin might need to correlate with a log. */
export const dateTime = (value?: string | number | null): string =>
	value
		? new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
		: '—';

/** Alias kept because "when did this happen" reads better at some call sites. */
export const when = dateTime;

/** Byte sizes as the provider reports them — slug size, repo size, store size. */
export const bytes = (value?: number | null): string => {
	if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
	if (value < 1024) return `${value} B`;

	const units = ['KB', 'MB', 'GB', 'TB'];
	let size = value / 1024;
	let unit = 0;

	while (size >= 1024 && unit < units.length - 1) {
		size /= 1024;
		unit += 1;
	}

	return `${size.toFixed(size >= 10 ? 0 : 1)} ${units[unit]}`;
};

/**
 * The pasteable body of a generated `.env` file.
 *
 * Both providers' downloads open with a few `#` comment lines — which provider,
 * when, and a warning not to commit it. Useful in a saved file, noise when the
 * point is to paste straight into an existing `.env`, so the leading block goes.
 *
 * Only the *leading* block: a trailing note on a `KEY=` line (Vercel writes
 * `# sensitive - value not retrievable` for a value it will never return) is
 * load-bearing and stays, otherwise the paste looks complete while silently
 * missing a value.
 */
export const envFileBody = (text: string): string => {
	const lines = String(text || '').split('\n');
	let start = 0;

	while (start < lines.length && (lines[start].startsWith('#') || !lines[start].trim())) {
		start += 1;
	}

	return `${lines.slice(start).join('\n').trim()}\n`;
};
