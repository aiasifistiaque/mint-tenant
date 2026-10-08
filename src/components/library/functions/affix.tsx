'use client';

import { FC, ReactNode } from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';

/**
 * How a field's value is dressed where it's shown (settings `schema.affix`,
 * `schema.subtitle`): words or another field's value before or after it — an
 * amount as "BDT 1,200", with BDT typed or taken from the record's currency —
 * and, in the table, a second field in small type under it (the email under a
 * name). The same on every row and record; set in the page builder's advanced
 * display settings.
 */

/** Typed words, or the value of another field of the same record. */
export type AffixPart = { text?: string; field?: string };
export type Affix = { before?: AffixPart; after?: AffixPart };

const get = (doc: any, path: string) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), doc);

/** A field's value as short words: a linked record's name, a list joined, Yes/No. */
export const fieldText = (doc: any, key?: string): string => {
	if (!doc || !key) return '';
	const words = (v: any): string => {
		if (v === null || v === undefined || v === '') return '';
		if (Array.isArray(v)) return v.map(words).filter(Boolean).join(', ');
		if (typeof v === 'boolean') return v ? 'Yes' : 'No';
		if (typeof v === 'number') return v.toLocaleString();
		if (typeof v === 'object') return String(v.name || v.title || v.label || v.code || '');
		return String(v);
	};
	return words(get(doc, key));
};

const partText = (part: AffixPart | undefined, doc: any) =>
	!part ? '' : part.field ? fieldText(doc, part.field) : String(part.text ?? '');

/** The words before and after a value, for this record. */
export const affixOf = (affix: Affix | undefined, doc: any) => ({
	before: partText(affix?.before, doc),
	after: partText(affix?.after, doc),
});

/** Whether the field has any dressing at all. */
export const hasAffix = (affix?: Affix) => !!(affix?.before?.text || affix?.before?.field || affix?.after?.text || affix?.after?.field);

/**
 * The value with its words around it, and its subtitle under it. Renders the
 * value alone when there's nothing to add, so plain fields keep their markup.
 */
export const Affixed: FC<{ before?: string; after?: string; below?: string; children: ReactNode }> = ({
	before,
	after,
	below,
	children,
}) => {
	if (!before && !after && !below) return <>{children}</>;
	const line =
		before || after ? (
			<Flex
				as='span'
				display='inline-flex'
				align='baseline'
				gap={1}
				minW={0}
				flexWrap='wrap'>
				{before && (
					<Text
						as='span'
						color='fg.muted'>
						{before}
					</Text>
				)}
				<Box
					as='span'
					minW={0}>
					{children}
				</Box>
				{after && (
					<Text
						as='span'
						color='fg.muted'>
						{after}
					</Text>
				)}
			</Flex>
		) : (
			children
		);
	if (!below) return <>{line}</>;
	return (
		<Box
			as='span'
			display='flex'
			flexDirection='column'
			minW={0}>
			{line}
			<Text
				as='span'
				fontSize='xs'
				fontWeight='400'
				color='fg.muted'
				lineClamp={1}
				wordBreak='break-all'>
				{below}
			</Text>
		</Box>
	);
};
