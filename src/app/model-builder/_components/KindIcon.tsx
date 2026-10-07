'use client';

import { FC } from 'react';
import { Flex } from '@chakra-ui/react';
import {
	AlignLeft,
	Calculator,
	Calendar,
	File,
	Files,
	Globe,
	Hash,
	Image,
	Images,
	KeyRound,
	Link2,
	ListChecks,
	LucideIcon,
	Mail,
	Palette,
	Pilcrow,
	Rows3,
	SquareStack,
	Tags,
	ToggleRight,
	Type,
	Video,
} from 'lucide-react';
import { FieldKind, KINDS } from './modelKinds';

/**
 * A field kind's picture: one icon per kind, tinted by its group (Text, Values,
 * Choices…), so a long list of fields can be read at a glance — the same tile
 * in the fields list, the "Add a field" picker and the form preview.
 */

export const KIND_ICONS: Record<FieldKind, LucideIcon> = {
	text: Type,
	textarea: AlignLeft,
	editor: Pilcrow,
	email: Mail,
	url: Globe,
	color: Palette,
	password: KeyRound,
	number: Hash,
	formula: Calculator,
	boolean: ToggleRight,
	date: Calendar,
	select: ListChecks,
	multiselect: ListChecks,
	tags: Tags,
	image: Image,
	images: Images,
	file: File,
	files: Files,
	video: Video,
	reference: Link2,
	references: Link2,
	section: SquareStack,
	sectionlist: Rows3,
};

/** Chakra palettes, so the tint follows light and dark mode and every theme. */
export const GROUP_PALETTE: Record<string, string> = {
	Text: 'blue',
	Values: 'teal',
	Choices: 'purple',
	Media: 'pink',
	Links: 'orange',
	Sections: 'cyan',
};

export const kindPalette = (kind: FieldKind) => GROUP_PALETTE[KINDS.find(k => k.value === kind)?.group || ''] || 'gray';

const KindIcon: FC<{ kind: FieldKind; size?: number }> = ({ kind, size = 28 }) => {
	const Icon = KIND_ICONS[kind] || Type;
	const p = kindPalette(kind);
	return (
		<Flex
			align='center'
			justify='center'
			flexShrink={0}
			w={`${size}px`}
			h={`${size}px`}
			borderRadius='md'
			bg={`${p}.subtle`}
			color={`${p}.fg`}>
			<Icon
				size={Math.round(size * 0.5)}
				strokeWidth={1.75}
			/>
		</Flex>
	);
};

export default KindIcon;
