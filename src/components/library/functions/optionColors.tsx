'use client';

import { FC } from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';

/**
 * Coloured tags for a choice field — a status, active / inactive, yes / no —
 * so its value reads at a glance in the table and on the record page.
 * Settings: `schema.colorTags: true` turns it on; `schema.optionColors`
 * ({ value: palette }) holds the colours someone picked. Every other option
 * gets a default — by its meaning (paid → green, void → red, pending →
 * orange) or, failing that, the next colour in turn.
 */

/** The palettes offered (Chakra colour palettes, light and dark aware). */
export const TAG_PALETTES = ['gray', 'red', 'orange', 'yellow', 'green', 'teal', 'blue', 'cyan', 'purple', 'pink'] as const;
export type TagPalette = (typeof TAG_PALETTES)[number];

const MEANING: [RegExp, TagPalette][] = [
	[/^(true|yes|active|enabled?|on|paid|done|complete(d)?|approved|success(ful)?|published|live|open|available|in.?stock|won|resolved|verified|delivered|accepted)$/i, 'green'],
	[/^(false|no|inactive|disabled?|off|archived|draft|closed|unknown|none|n\/?a)$/i, 'gray'],
	[/^(void|cancel+ed|rejected|failed|error|overdue|blocked|lost|refunded|declined|expired|deleted|out.?of.?stock|urgent|critical|high)$/i, 'red'],
	[/^(due|pending|waiting|on.?hold|hold|partial(ly.?paid)?|review|in.?review|unpaid|low.?stock|medium|warning)$/i, 'orange'],
	[/^(new|in.?progress|processing|sent|scheduled|started|ongoing|shipped|planned)$/i, 'blue'],
	[/^(low|minor|info)$/i, 'teal'],
];
const ROTATION: TagPalette[] = ['blue', 'purple', 'teal', 'pink', 'cyan', 'orange', 'yellow', 'green', 'red', 'gray'];

/** A value's default colour: by what it means, else by its place in the list. */
export const defaultTagColor = (value: any, index = 0): TagPalette => {
	const v = String(value ?? '').trim();
	const hit = MEANING.find(([rx]) => rx.test(v));
	return hit ? hit[1] : ROTATION[index % ROTATION.length];
};

type Option = { value: any; label: any };

/** A field's options as { value, label }: its own list, its model's choices, or Yes / No. */
export const choicesOf = (schema: any, extra?: { enum?: any[]; boolean?: boolean }): Option[] => {
	const raw: any[] = Array.isArray(schema?.options) && schema.options.length ? schema.options : extra?.enum || [];
	const list = raw.map(o => (o && typeof o === 'object' ? { value: o.value, label: o.label ?? o.value } : { value: o, label: o }));
	if (list.length) return list;
	if (extra?.boolean || ['checkbox', 'switch', 'boolean'].includes(schema?.type))
		return [
			{ value: true, label: 'Yes' },
			{ value: false, label: 'No' },
		];
	return [];
};

/** The colour a value is shown in: the one picked in the settings, else its default. */
export const tagColorOf = (value: any, field: { options?: any[]; optionColors?: Record<string, string> }): string => {
	const key = String(value);
	const picked = field?.optionColors?.[key];
	if (picked) return picked;
	const options = choicesOf(field);
	const i = options.findIndex(o => String(o.value) === key);
	return defaultTagColor(value, i < 0 ? 0 : i);
};

const labelFor = (value: any, field: any) => {
	const o = choicesOf(field).find(x => String(x.value) === String(value));
	if (o) return String(o.label);
	if (typeof value === 'boolean') return value ? 'Yes' : 'No';
	return String(value);
};

/**
 * One status tag: a rounded pill tinted in its colour, with a coloured border,
 * coloured text in capitals and a dot in front that draws the eye. Colours are each
 * palette's `.fg` / `.subtle` — the theme maps gray and green `.solid` onto
 * the brand black, so those can't be used for a real colour.
 */
export const StatusTag: FC<{ color: string; children: any; size?: 'xs' | 'sm' | 'md' }> = ({ color, children, size = 'sm' }) => {
	const fg = color === 'gray' ? 'fg.muted' : `${color}.fg`;
	const dims = size === 'md' ? { px: 3, h: '28px', fs: '13px', dot: '8px' } : size === 'xs' ? { px: 2, h: '20px', fs: '11px', dot: '6px' } : { px: 2.5, h: '24px', fs: '12px', dot: '7px' };
	return (
		<Flex
			as='span'
			display='inline-flex'
			align='center'
			gap={1.5}
			h={dims.h}
			px={dims.px}
			borderRadius='full'
			borderWidth='1.5px'
			borderColor={fg}
			bg={color === 'gray' ? 'bg.muted' : `${color}.subtle`}
			maxW='full'
			flexShrink={0}>
			<Box
				as='span'
				flexShrink={0}
				w={dims.dot}
				h={dims.dot}
				borderRadius='full'
				bg={fg}
			/>
			<Text
				as='span'
				fontSize={dims.fs}
				fontWeight='600'
				lineHeight='1'
				textTransform='uppercase'
				letterSpacing='0.04em'
				color={fg}
				whiteSpace='nowrap'
				truncate>
				{children}
			</Text>
		</Flex>
	);
};

/** The value (or each value of a list) as a coloured tag. Nothing for an empty value. */
export const OptionTags: FC<{ value: any; field: any; size?: 'xs' | 'sm' | 'md' }> = ({ value, field, size = 'sm' }) => {
	const values = (Array.isArray(value) ? value : [value]).filter(v => v !== undefined && v !== null && v !== '' && v !== '--');
	if (!values.length) return null;
	return (
		<Flex
			as='span'
			display='inline-flex'
			gap={1.5}
			flexWrap='wrap'>
			{values.map((v, i) => (
				<StatusTag
					key={`${String(v)}-${i}`}
					size={size}
					color={tagColorOf(v, field)}>
					{labelFor(v, field)}
				</StatusTag>
			))}
		</Flex>
	);
};
