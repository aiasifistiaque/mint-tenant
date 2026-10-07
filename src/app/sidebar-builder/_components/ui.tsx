'use client';

import { FC, ReactNode } from 'react';
import { Box, Flex, Input, Link, Text } from '@chakra-ui/react';
import { ExternalLink } from 'lucide-react';
import { iconNames } from 'lucide-react/dynamic';
import { LucideIcon } from '@/components/library';
import { docsPath } from '@/components/library/config/lib/constants/panel';

/** The sidebar builder guide. Section ids are the anchors below. */
export const GUIDE = docsPath('/docs/sidebar-builder');

/** Lucide's own catalogue — the names typed into an icon field come from here. */
export const ICON_CATALOGUE = 'https://lucide.dev/icons/';

/** A link into the guide, opened beside the builder rather than in place of it. */
export const DocLink: FC<{ section: string; label?: string }> = ({ section, label = 'How this works' }) => (
	<Link
		href={`${GUIDE}#${section}`}
		target='_blank'
		rel='noopener noreferrer'
		display='inline-flex'
		alignItems='center'
		gap={1}
		fontSize='xs'
		color='fg.muted'
		flexShrink={0}
		_hover={{ color: 'fg', textDecoration: 'underline' }}>
		{label}
		<ExternalLink size={11} />
	</Link>
);

export const Label: FC<{ children: ReactNode; hint?: ReactNode; required?: boolean }> = ({ children, hint, required }) => (
	<Box mb={1.5}>
		<Text
			fontSize='xs'
			fontWeight='600'>
			{children}
			{required && (
				<Text
					as='span'
					color='red.fg'
					ml={0.5}>
					*
				</Text>
			)}
		</Text>
		{hint && (
			<Text
				fontSize='xs'
				color='fg.muted'>
				{hint}
			</Text>
		)}
	</Box>
);

// The names only — the map DynamicIcon already ships for the sidebar, so
// checking against it adds nothing to the page.
const KNOWN = new Set<string>(iconNames);
export const isIconName = (name: string) => KNOWN.has(name);

/**
 * An icon is a Lucide name typed in, not picked from a grid: drawing the
 * full icon set to browse would weigh the page down for a field that's set
 * once. The catalogue opens in a new tab; copy a name from there. The one
 * glyph shown is loaded on its own, the same way the sidebar loads it — and
 * only for a real name, since DynamicIcon keeps the last good glyph (and
 * logs an error) when handed a misspelt one.
 */
export const IconField: FC<{ value: string; onChange: (v: string) => void; hint?: ReactNode }> = ({ value, onChange, hint }) => {
	const name = value.trim();
	const valid = isIconName(name);
	return (
		<Box>
			<Label hint={hint}>Icon</Label>
			<Flex
				gap={2}
				align='center'>
				<Flex
					w='32px'
					h='32px'
					flexShrink={0}
					align='center'
					justify='center'
					borderWidth='1px'
					borderColor='border'
					borderRadius='md'
					color='fg'>
					{valid ? (
						<LucideIcon
							key={name}
							name={name}
							size={16}
							color='currentColor'
						/>
					) : (
						<Text
							fontSize='xs'
							color='fg.subtle'>
							—
						</Text>
					)}
				</Flex>
				<Input
					size='sm'
					fontFamily='mono'
					value={value}
					placeholder='e.g. folder, users, settings'
					onChange={e => onChange(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
				/>
			</Flex>
			{name && !valid && (
				<Text
					fontSize='xs'
					color='orange.fg'
					mt={1}>
					Not a Lucide icon name yet — check the spelling on lucide.dev.
				</Text>
			)}
			<Flex
				mt={1.5}
				gap={3}
				flexWrap='wrap'>
				<Link
					href={ICON_CATALOGUE}
					target='_blank'
					rel='noopener noreferrer'
					display='inline-flex'
					alignItems='center'
					gap={1}
					fontSize='xs'
					color='fg.muted'
					_hover={{ color: 'fg', textDecoration: 'underline' }}>
					Browse icon names on lucide.dev
					<ExternalLink size={11} />
				</Link>
				<DocLink
					section='icons'
					label='How to pick one'
				/>
			</Flex>
		</Box>
	);
};
