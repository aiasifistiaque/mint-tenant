import { ReactNode } from 'react';
import { Badge, Box, Flex, Image, Text } from '@chakra-ui/react';

/**
 * A related record's value, drawn by the column's `kind` (sent by
 * `/get/view` and its tabs): an image as the image, not its URL; a linked
 * record by its name; a date as a date.
 */

const IMAGE_URL = /^(https?:)?\/\/.+\.(png|jpe?g|gif|webp|svg|avif|bmp)(\?.*)?$/i;

/** As plain text — sorting, cards' headings, anything that can't hold markup. */
export const cellText = (value: any): string => {
	if (value === null || value === undefined || value === '') return '—';
	if (Array.isArray(value)) return value.length ? value.map(cellText).join(', ') : '—';
	if (typeof value === 'object') return value.name || value.title || value.code || value.email || value._id || '—';
	if (typeof value === 'boolean') return value ? 'Yes' : 'No';
	if (typeof value === 'number') return value.toLocaleString();
	if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) return new Date(value).toLocaleDateString();
	if (typeof value === 'string' && /<\/?[a-z][\s\S]*>/i.test(value)) return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
	return String(value);
};

const imagesOf = (value: any): string[] =>
	(Array.isArray(value) ? value : [value]).filter((v): v is string => typeof v === 'string' && !!v.trim());

export const isImageKind = (kind?: string) => kind === 'image' || kind === 'images';

/** The first picture in a value, for a card. */
export const firstImage = (value: any): string | undefined => imagesOf(value)[0];

const Thumb = ({ src, size }: { src: string; size: string }) => (
	<Image
		src={src}
		alt=''
		boxSize={size}
		minW={size}
		borderRadius='sm'
		objectFit='cover'
		bg='bg.muted'
		loading='lazy'
	/>
);

/** As a table cell. */
export const cellNode = (value: any, kind?: string): ReactNode => {
	const looksLikeImage = typeof value === 'string' && IMAGE_URL.test(value);
	if (isImageKind(kind) || looksLikeImage) {
		const srcs = imagesOf(value);
		if (!srcs.length) return <Text color='fg.subtle'>—</Text>;
		return (
			<Flex
				gap={1}
				align='center'>
				{srcs.slice(0, 3).map((src, i) => (
					<Thumb
						key={i}
						src={src}
						size='36px'
					/>
				))}
				{srcs.length > 3 && (
					<Text
						fontSize='xs'
						color='fg.muted'>
						+{srcs.length - 3}
					</Text>
				)}
			</Flex>
		);
	}
	if (kind === 'boolean' && typeof value === 'boolean')
		return (
			<Badge
				size='sm'
				colorPalette={value ? 'green' : 'gray'}>
				{value ? 'Yes' : 'No'}
			</Badge>
		);
	if (kind === 'color' && typeof value === 'string' && value)
		return (
			<Flex
				align='center'
				gap={2}>
				<Box
					boxSize='14px'
					borderRadius='sm'
					borderWidth='1px'
					bg={value}
				/>
				<Text fontSize='sm'>{value}</Text>
			</Flex>
		);
	if ((kind === 'tags' || kind === 'refs') && Array.isArray(value) && value.length)
		return (
			<Flex
				gap={1}
				flexWrap='wrap'>
				{value.slice(0, 4).map((v, i) => (
					<Badge
						key={i}
						size='sm'
						variant='subtle'>
						{cellText(v)}
					</Badge>
				))}
				{value.length > 4 && (
					<Text
						fontSize='xs'
						color='fg.muted'>
						+{value.length - 4}
					</Text>
				)}
			</Flex>
		);
	return (
		<Text
			fontSize='sm'
			truncate
			textAlign={kind === 'number' ? 'right' : undefined}>
			{cellText(value)}
		</Text>
	);
};
