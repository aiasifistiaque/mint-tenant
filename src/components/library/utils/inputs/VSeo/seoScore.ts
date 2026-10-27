/**
 * The SEO editor's score (backend docs/seo SEO-01): 0–100 from checks on the
 * page's title, description, address, words and focus keyword. Plain rules,
 * run in the browser on every keystroke. The page's words come from the
 * backend's `seo-page` answer when there is one (a builder page's draft, or a
 * site built elsewhere's live HTML); checks that need what isn't known are
 * left out, not failed.
 */

export type ScoreStatus = 'good' | 'ok' | 'bad';
export type ScoreCheck = { key: string; label: string; status: ScoreStatus; advice: string; weight: number };
export type ScoreResult = { score: number; grade: ScoreStatus; checks: ScoreCheck[] };

export type ScorePage = {
	/** The page's words, in order. */
	text: string;
	headings: string[];
	/** How many <h1>s, when known (a live page). */
	h1?: number;
};

export type ScoreInput = {
	title: string;
	description: string;
	keyword: string;
	path: string;
	hasImage: boolean;
	/** The site has a share image of its own, used when the page has none. */
	siteImage?: boolean;
	noIndex: boolean;
	/** The page's words; null when they can't be known. */
	page?: ScorePage | null;
	/** Other pages' focus keywords; undefined when not known. */
	otherKeywords?: { path: string; keyword: string }[];
};

export const TITLE_RANGE = [30, 60, 70] as const;
export const DESCRIPTION_RANGE = [70, 160, 320] as const;

const norm = (s: string) =>
	(s || '')
		.toLowerCase()
		.normalize('NFKC')
		.replace(/[\s\-_–—·|:,.!?'"“”‘’()]+/g, ' ')
		.trim();

const countOf = (haystack: string, needle: string) => {
	if (!needle) return 0;
	let n = 0;
	let i = haystack.indexOf(needle);
	while (i !== -1) {
		// Whole words only: "car" isn't in "scary".
		const before = i === 0 || haystack[i - 1] === ' ';
		const after = i + needle.length === haystack.length || haystack[i + needle.length] === ' ';
		if (before && after) n++;
		i = haystack.indexOf(needle, i + needle.length);
	}
	return n;
};
const has = (haystack: string, needle: string) => countOf(norm(haystack), needle) > 0;

const wordsOf = (s: string) => (s || '').split(/\s+/).filter(w => /[\p{L}\p{N}]/u.test(w));

const lengthCheck = (key: string, what: string, value: string, [min, max, hard]: readonly [number, number, number], weight: number): ScoreCheck => {
	const n = value.trim().length;
	if (!n) return { key, label: `${what} is missing`, status: 'bad', advice: `Write a ${what.toLowerCase()} of ${min}–${max} characters.`, weight };
	if (n < min) return { key, label: `${what} is short (${n} characters)`, status: n < min / 2 ? 'bad' : 'ok', advice: `Aim for ${min}–${max} characters, so it says more.`, weight };
	if (n <= max) return { key, label: `${what} length is good (${n} characters)`, status: 'good', advice: '', weight };
	return n <= hard
		? { key, label: `${what} may be cut off (${n} characters)`, status: 'ok', advice: `Google shows about ${max}; put what matters first.`, weight }
		: { key, label: `${what} is too long (${n} characters)`, status: 'bad', advice: `Google cuts it off after about ${max} characters.`, weight };
};

/** Average sentence length, for English pages only. */
const readability = (text: string): ScoreCheck | null => {
	const letters = text.match(/\p{L}/gu) || [];
	const latin = text.match(/[a-z]/gi) || [];
	if (letters.length < 200 || latin.length / letters.length < 0.8) return null;
	const sentences = text.split(/[.!?]+\s/).map(wordsOf).filter(w => w.length > 2);
	if (sentences.length < 3) return null;
	const avg = Math.round(sentences.reduce((n, s) => n + s.length, 0) / sentences.length);
	if (avg <= 20) return { key: 'readability', label: `Sentences are easy to read (${avg} words on average)`, status: 'good', advice: '', weight: 4 };
	return {
		key: 'readability',
		label: `Sentences are long (${avg} words on average)`,
		status: avg <= 25 ? 'ok' : 'bad',
		advice: 'Shorter sentences, under 20 words, are easier to read on a phone.',
		weight: 4,
	};
};

export const seoScore = (i: ScoreInput): ScoreResult => {
	const checks: ScoreCheck[] = [];
	const add = (c: ScoreCheck | null) => c && checks.push(c);
	const keyword = norm(i.keyword);
	const page = i.page && (i.page.text || i.page.headings.length) ? i.page : null;
	const words = page ? wordsOf(page.text) : [];
	const isHome = i.path === '/' || i.path === '';
	const isTemplate = /\[|\{\{/.test(i.path) || /\{\{/.test(i.title);

	add(
		i.noIndex
			? { key: 'indexed', label: 'The page is hidden from search engines', status: 'bad', advice: 'It can’t rank at all. Allow indexing (the Indexing tab) if this page should be found.', weight: 10 }
			: { key: 'indexed', label: 'Search engines may show the page', status: 'good', advice: '', weight: 10 }
	);
	add(lengthCheck('title', 'Title', i.title, TITLE_RANGE, 8));
	add(lengthCheck('description', 'Description', i.description, DESCRIPTION_RANGE, 8));

	if (!keyword) {
		add({ key: 'keyword', label: 'No focus keyword', status: 'bad', advice: 'Pick the one phrase people would search to find this page; the checks below then look for it.', weight: 30 });
	} else {
		const title = norm(i.title);
		const at = title.indexOf(keyword);
		add(
			at === -1 || !has(i.title, keyword)
				? { key: 'kw-title', label: 'The keyword isn’t in the title', status: 'bad', advice: 'Put the keyword in the title, near the start.', weight: 12 }
				: at <= title.length * 0.4
				? { key: 'kw-title', label: 'The keyword starts the title', status: 'good', advice: '', weight: 12 }
				: { key: 'kw-title', label: 'The keyword is late in the title', status: 'ok', advice: 'Move it nearer the start; the end of a long title gets cut off.', weight: 12 }
		);
		add(
			has(i.description, keyword)
				? { key: 'kw-description', label: 'The keyword is in the description', status: 'good', advice: '', weight: 8 }
				: { key: 'kw-description', label: 'The keyword isn’t in the description', status: 'bad', advice: 'Google shows the searched words in bold, so the description stands out.', weight: 8 }
		);
		if (!isHome && !isTemplate) {
			let address = i.path;
			try {
				address = decodeURIComponent(i.path);
			} catch {
				/* as it is */
			}
			const inAddress = has(address.replace(/[/_.-]+/g, ' '), keyword);
			const someWords = keyword.split(' ').filter(w => w.length > 2 && norm(address).includes(w)).length;
			add(
				inAddress
					? { key: 'kw-address', label: 'The keyword is in the address', status: 'good', advice: '', weight: 6 }
					: {
							key: 'kw-address',
							label: 'The keyword isn’t in the address',
							status: someWords ? 'ok' : 'bad',
							advice: `An address like /${keyword.replace(/ /g, '-')} helps. If you change it, add a redirect from the old one.`,
							weight: 6,
					  }
			);
		}
		if (page?.headings.length) {
			add(
				has(page.headings[0], keyword)
					? { key: 'kw-heading', label: 'The keyword is in the main heading', status: 'good', advice: '', weight: 8 }
					: page.headings.slice(1).some(h => has(h, keyword))
					? { key: 'kw-heading', label: 'The keyword is in a heading, but not the main one', status: 'ok', advice: `The main heading is “${page.headings[0]}”.`, weight: 8 }
					: { key: 'kw-heading', label: 'The keyword isn’t in the headings', status: 'bad', advice: `Use it in the main heading (now “${page.headings[0]}”).`, weight: 8 }
			);
		}
		if (words.length >= 50) {
			const text = norm(page!.text);
			const opening = norm(words.slice(0, 100).join(' '));
			add(
				countOf(opening, keyword)
					? { key: 'kw-opening', label: 'The keyword is in the opening words', status: 'good', advice: '', weight: 6 }
					: { key: 'kw-opening', label: 'The keyword isn’t in the first 100 words', status: 'bad', advice: 'Say early what the page is about.', weight: 6 }
			);
			const times = countOf(text, keyword);
			const density = (times * keyword.split(' ').length * 100) / words.length;
			const pct = density.toFixed(1);
			add(
				!times
					? { key: 'kw-density', label: 'The page’s words never use the keyword', status: 'bad', advice: 'Use it a few times where it reads naturally.', weight: 6 }
					: density < 0.5
					? { key: 'kw-density', label: `The keyword is rare (${times}×, ${pct}%)`, status: 'ok', advice: 'Use it a little more, where it reads naturally.', weight: 6 }
					: density <= 3
					? { key: 'kw-density', label: `The keyword is used ${times}× (${pct}%)`, status: 'good', advice: '', weight: 6 }
					: { key: 'kw-density', label: `The keyword is used too often (${times}×, ${pct}%)`, status: density > 5 ? 'bad' : 'ok', advice: 'Over about 3% reads as stuffing to search engines; use other words too.', weight: 6 }
			);
		}
		if (i.otherKeywords) {
			const same = i.otherKeywords.filter(k => norm(k.keyword) === keyword).map(k => k.path);
			add(
				same.length
					? { key: 'kw-unique', label: 'Another page has the same keyword', status: 'bad', advice: `${same.slice(0, 3).join(', ')}${same.length > 3 ? ` and ${same.length - 3} more` : ''} — pages competing for one phrase both rank lower. Give each its own.`, weight: 6 }
					: { key: 'kw-unique', label: 'No other page uses this keyword', status: 'good', advice: '', weight: 6 }
			);
		}
	}

	if (page) {
		const n = words.length;
		add(
			n >= 300
				? { key: 'length', label: `The page has ${n} words`, status: 'good', advice: '', weight: 10 }
				: { key: 'length', label: `The page has only ${n} words`, status: n >= 150 ? 'ok' : 'bad', advice: 'Pages with 300 words or more usually rank better; say more about what a visitor gets.', weight: 10 }
		);
		if (typeof page.h1 === 'number')
			add(
				page.h1 === 1
					? { key: 'h1', label: 'The page has one main heading', status: 'good', advice: '', weight: 4 }
					: page.h1 === 0
					? { key: 'h1', label: 'The page has no main heading (h1)', status: 'bad', advice: 'Search engines read the main heading to learn what the page is about.', weight: 4 }
					: { key: 'h1', label: `The page has ${page.h1} main headings (h1)`, status: 'ok', advice: 'One main heading is clearer.', weight: 4 }
			);
		add(readability(page.text));
	}

	add(
		i.hasImage
			? { key: 'image', label: 'A share image is set', status: 'good', advice: '', weight: 6 }
			: i.siteImage
			? { key: 'image', label: 'Shared links use the site’s image', status: 'ok', advice: 'A picture of this page (1200×630, under Social) gets more clicks than the site’s logo image.', weight: 6 }
			: { key: 'image', label: 'No share image', status: 'bad', advice: 'Facebook, WhatsApp and X show a link with no picture. Add one under Social (1200×630).', weight: 6 }
	);

	const total = checks.reduce((n, c) => n + c.weight, 0);
	const earned = checks.reduce((n, c) => n + c.weight * (c.status === 'good' ? 1 : c.status === 'ok' ? 0.5 : 0), 0);
	const score = total ? Math.round((earned * 100) / total) : 0;
	const order: Record<ScoreStatus, number> = { bad: 0, ok: 1, good: 2 };
	return {
		score,
		grade: score >= 80 ? 'good' : score >= 50 ? 'ok' : 'bad',
		checks: checks.sort((a, b) => order[a.status] - order[b.status] || b.weight - a.weight),
	};
};
