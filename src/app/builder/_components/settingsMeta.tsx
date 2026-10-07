'use client';

import { FC } from 'react';
import {
	AlignLeft,
	Braces,
	Calculator,
	Calendar,
	Clock,
	Eye,
	File,
	Files,
	Hash,
	Image,
	Images,
	KeyRound,
	Link,
	Link2,
	List,
	ListChecks,
	LucideIcon,
	Palette,
	Pilcrow,
	Rows3,
	Search,
	SlidersHorizontal,
	Smile,
	SquareStack,
	Tags,
	ToggleRight,
	Type,
	Video,
} from 'lucide-react';
import { ToneIcon } from './areas';
import { INPUTS } from './inputTypes';

/**
 * Words and pictures for the Fields & rules tab (SettingsEditor): each form
 * input's icon and colour (the input groups' colours match the model
 * builder's kind groups), the storage types in plain words, and the rules a
 * field can have with what each one does — so a row reads as "Due date, asked
 * as a Date, required" instead of a row of switches named after a file.
 */

const INPUT_ICON: Record<string, LucideIcon> = {
	text: Type,
	textarea: AlignLeft,
	editor: Pilcrow,
	'basic-editor': Pilcrow,
	slug: Link,
	password: KeyRound,
	'read-only': Eye,
	'view-only': Eye,
	number: Hash,
	formula: Calculator,
	slider: SlidersHorizontal,
	checkbox: ToggleRight,
	switch: ToggleRight,
	date: Calendar,
	time: Clock,
	color: Palette,
	select: ListChecks,
	'select-tag': ListChecks,
	tag: Tags,
	'case-tag': Tags,
	image: Image,
	'image-array': Images,
	file: File,
	'file-array': Files,
	video: Video,
	icon: Smile,
	'data-menu': Link2,
	'data-select': Link2,
	'data-tag': Link2,
	'nested-data-menu': Link2,
	seo: Search,
	'custom-attribute': Braces,
	'section-data-array': Rows3,
	'section-object': SquareStack,
	'array-string': List,
};

/** The same colours as the model builder's kind groups (KindIcon). */
const GROUP_PALETTE: Record<string, string> = {
	Text: 'blue',
	Values: 'teal',
	Choices: 'purple',
	Media: 'pink',
	'Links to records': 'orange',
	Structured: 'cyan',
};

/** With no input chosen, the one the storage type gets. */
const INPUT_FOR_TYPE: Record<string, string> = {
	string: 'text',
	email: 'text',
	uri: 'text',
	text: 'textarea',
	number: 'number',
	boolean: 'switch',
	date: 'date',
	'date-only': 'date',
	tag: 'tag',
	'array-string': 'tag',
	array: 'array-string',
	'array-number': 'array-string',
	'array-object': 'section-data-array',
	object: 'section-object',
};

export const inputOf = (f: { type?: string; schema?: any; [prop: string]: any }) => f.schema?.type || INPUT_FOR_TYPE[f.type || 'string'] || 'text';

export const inputLabel = (input?: string) => INPUTS.find(i => i.value === input)?.label || input || 'Text';

export const InputIcon: FC<{ input: string; size?: number }> = ({ input, size = 28 }) => {
	const group = INPUTS.find(i => i.value === input)?.group || '';
	return (
		<ToneIcon
			icon={INPUT_ICON[input] || Type}
			palette={GROUP_PALETTE[group] || 'gray'}
			size={size}
		/>
	);
};

/** How the value is stored and checked, in plain words — the values stay the settings file's. */
export const DATA_TYPE_LABEL: Record<string, string> = {
	string: 'Text',
	email: 'Email address (checked)',
	uri: 'Web address (checked)',
	text: 'Long text',
	number: 'Number',
	boolean: 'Yes / No',
	date: 'Date and time',
	'date-only': 'Date',
	tag: 'Tags',
	'array-string': 'List of texts',
	'array-number': 'List of numbers',
	array: 'List',
	'array-object': 'List of groups (rows)',
	object: 'Group of values',
	mixed: 'Anything (not checked)',
	profit: 'Profit',
	formula: 'Calculated (formula)',
};

/**
 * The rules, in the order the details list them. `inline` ones also sit in
 * the row as switches — the two people change most.
 */
export const RULES: { prop: string; label: string; hint: string; palette: string; inline?: boolean }[] = [
	{ prop: 'required', label: 'Required', hint: 'Must be filled in when a record is added.', palette: 'orange', inline: true },
	{ prop: 'edit', label: 'Can be changed later', hint: 'People can edit it after the record is created.', palette: 'blue', inline: true },
	{ prop: 'unique', label: 'No duplicates', hint: 'A second record with the same value is refused.', palette: 'purple' },
	{ prop: 'search', label: 'Searchable', hint: 'The table’s search box finds records by it.', palette: 'teal' },
	{ prop: 'sort', label: 'Sortable', hint: 'The table can be sorted by it.', palette: 'cyan' },
	{ prop: 'trim', label: 'Trim spaces', hint: 'Spaces before and after the value are removed.', palette: 'gray' },
	{ prop: 'exclude', label: 'Hidden everywhere', hint: 'Never shown or sent anywhere — not even to you.', palette: 'red' },
];

/** The table's cell types in plain words; an unknown one is shown as it's named. */
const CELL_LABEL: Record<string, string> = {
	text: 'Text',
	string: 'Text',
	number: 'Number',
	price: 'Price',
	date: 'Date and time',
	'date-only': 'Date',
	time: 'Time',
	boolean: 'Yes / No',
	checkbox: 'Tick box',
	tag: 'Tags',
	'image-text': 'Picture with its name',
	file: 'File',
	'external-link': 'Link',
	'data-array': 'Linked records',
	'data-array-count': 'Number of linked records',
	password: 'Hidden (dots)',
};

export const cellLabel = (cell: string) => CELL_LABEL[cell] || cell.replace(/[-_]/g, ' ').replace(/^./, c => c.toUpperCase());

/** Inputs whose value has a length or a size to limit. */
export const LIMITED_INPUTS = ['text', 'textarea', 'editor', 'basic-editor', 'slug', 'number', 'slider'];
