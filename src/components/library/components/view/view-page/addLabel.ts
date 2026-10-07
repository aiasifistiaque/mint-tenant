/**
 * A view tab's add button text when the route builder leaves it blank:
 * "Documents" → "Add document", "Categories" → "Add category". The builder
 * shows the same text as its placeholder, so what it shows is what the page
 * gets.
 */
const singular = (word: string) =>
	/ies$/i.test(word) ? word.replace(/ies$/i, 'y') : /(ss|us)$/i.test(word) ? word : word.replace(/s$/i, '');

export const defaultAddLabel = (tabName: string) => {
	const name = tabName.trim();
	if (!name) return 'Add new';
	const words = name.split(/\s+/);
	words[words.length - 1] = singular(words[words.length - 1]);
	return `Add ${words.join(' ').toLowerCase()}`;
};
