'use client';

import { FC, useState } from 'react';
import { Box, Button, Flex, Text } from '@chakra-ui/react';
import { Check, Copy } from 'lucide-react';
import { BACKEND } from '@/components/library/config/lib/constants/panel';
import { useProjectKey } from '@/components/library/tenant/useProjectKey';

/**
 * How a site finds one content (backend docs/cms D1): by its slug. A site
 * made with the site builder binds its words to the slug; your own site or
 * app reads it from the public API — the one content by its slug, or a whole
 * page's contents in order. Both addresses carry the project key (?apiKey=,
 * docs/api-builder D14). Shown under the slug in the content's form.
 */

/** The public API's address: the backend's root, without /tenant/api. */
const apiBase = () => `${BACKEND.replace(/\/tenant\/api\/?$/, '')}/public/api`;

export const CopyText: FC<{ text: string; label: string }> = ({ text, label }) => {
	const [copied, setCopied] = useState(false);
	return (
		<Button
			size='2xs'
			variant='ghost'
			flexShrink={0}
			aria-label={label}
			title={label}
			onClick={e => {
				e.stopPropagation();
				navigator.clipboard?.writeText(text);
				setCopied(true);
				setTimeout(() => setCopied(false), 1500);
			}}>
			{copied ? <Check size={12} /> : <Copy size={12} />}
		</Button>
	);
};

const Line: FC<{ label: string; text: string; copy: string }> = ({ label, text, copy }) => (
	<Flex
		align='center'
		gap={2}
		minW={0}>
		<Text
			fontSize='11.5px'
			color='fg.muted'
			flexShrink={0}
			w='92px'>
			{label}
		</Text>
		<Box
			as='code'
			flex={1}
			minW={0}
			fontSize='11.5px'
			fontFamily='mono'
			whiteSpace='nowrap'
			overflow='hidden'
			textOverflow='ellipsis'
			title={text}>
			{text}
		</Box>
		<CopyText
			text={text}
			label={copy}
		/>
	</Flex>
);

const ContentAddress: FC<{ slug: string; pagePath?: string | null }> = ({ slug, pagePath }) => {
	const key = useProjectKey() || '<project key>';
	const base = apiBase();
	return (
		<Flex
			direction='column'
			gap={1}
			mt={2}
			p={2.5}
			borderWidth='1px'
			borderColor='border.muted'
			borderRadius='md'
			bg='bg.subtle'>
			<Line
				label='Slug'
				text={slug}
				copy='Copy the slug'
			/>
			<Line
				label='This content'
				text={`${base}/web-contents/by-slug/${slug}?apiKey=${key}`}
				copy='Copy the address of this content'
			/>
			{pagePath && (
				<Line
					label='Its whole page'
					text={`${base}/pages/by-path?path=${encodeURIComponent(pagePath)}&apiKey=${key}`}
					copy='Copy the address of its page'
				/>
			)}
			<Text
				fontSize='11.5px'
				color='fg.muted'>
				Your own site or app reads it from these addresses once it’s published; a site made with the site builder finds it by the slug.
			</Text>
		</Flex>
	);
};

export default ContentAddress;
