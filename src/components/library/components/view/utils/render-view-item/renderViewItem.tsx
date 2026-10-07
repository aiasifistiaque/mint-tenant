import { Flex, Badge, Text, Link, Tag, Box } from '@chakra-ui/react';
import { TextProps, LinkProps, Grid, Heading } from '@chakra-ui/react';
import { Column, Align, Icon, FullScreenImage, ViewItemModal } from '../../../..';
import { PLACEHOLDER_IMAGE, ImageContainer } from '../../../..';
import { JSONDisplay } from '../..';
import { ExternalLink } from 'lucide-react';
import moment from 'moment';
import Price from '../../../../utils/texts/Price';
import RecordLink from '../record-link/RecordLink';
import { labelOf } from '../record-link/linked';
import { SectionObject, SectionRows } from './SectionValues';
import SecretValue from '../../../../cl/SecretValue';

const textCss: TextProps & LinkProps = {
	fontSize: '.95rem',
	wordBreak: 'break-all',
	whiteSpace: 'normal',
	overflow: 'hidden',
};

/** The last part of a file's address, readable — "File 2" when there's none. */
const fileName = (url: string, i: number) => {
	const last = String(url || '').split('?')[0].split('/').pop() || '';
	try {
		return decodeURIComponent(last) || `File ${i + 1}`;
	} catch {
		return last || `File ${i + 1}`;
	}
};

/**
 * Where a link value opens: as given with a scheme (https:, mailto:), with
 * https:// when it has none — `example.com` would otherwise open relative to
 * the admin. Nothing for empty values, placeholders or script URLs.
 */
const linkHref = (value: any): string | null => {
	if (typeof value !== 'string') return null;
	const v = value.trim();
	if (!v || v === '--' || v === 'n/a') return null;
	if (/^(javascript|data|vbscript):/i.test(v)) return null;
	return /^[a-z][a-z0-9+.-]*:/i.test(v) ? v : `https://${v.replace(/^\/+/, '')}`;
};

/** Linked records as chips; without a route to open them in, just their names. */
const linkedList = (items: any, route?: string) => (
	<Align
		py={'.5px'}
		flexWrap='wrap'
		gap={2}>
		{Array.isArray(items) &&
			items.map((item: any, i: number) =>
				route ? (
					<RecordLink
						key={item?._id || item || i}
						route={route}
						item={item}
					/>
				) : (
					<Badge key={i}>{labelOf(item) || String(item)}</Badge>
				)
			)}
	</Align>
);

/**
 * Types whose value is a list. An empty field reaches the renderer as the
 * '--' placeholder (getValue), and bad data can be anything — `.map` on
 * either crashed the whole page, so a non-list value reads as empty.
 * (`tag` isn't here: it also draws a single value as a badge.)
 */
const LIST_TYPES = [
	'section-data-array',
	'custom-section-array',
	'data-tag',
	'data-array-tag',
	'array-tag',
	'file-array',
	'custom-attribute',
	'image-array',
];
/** Types whose value is one object of its own fields. */
const OBJECT_TYPES = ['section-object'];

/** Types a single linked record's name can arrive as. */
const LINKABLE = ['string', 'text', 'read-only', 'data-menu', undefined];

/**
 * `link` — the record this value is part of ({route, record}, from
 * `linkOf`): the value then renders as a RecordLink chip naming it.
 */
const renderContent = ({ type, children, colorPalette, path, originalType, id, link, dataModel }: any) => {
	if (link?.route && link?.record && LINKABLE.includes(type))
		return (
			<RecordLink
				route={link.route}
				item={link.record}
				label={typeof children === 'string' && children !== '--' && children !== 'n/a' ? children : undefined}
			/>
		);

	if (
		(LIST_TYPES.includes(type) && (!Array.isArray(children) || !children.length)) ||
		(OBJECT_TYPES.includes(type) && (!children || typeof children !== 'object' || Array.isArray(children)))
	)
		return <Text {...textCss}>--</Text>;

	switch (type) {
		case 'section-data-array':
			// With its row fields known: a table, with the number columns added up.
			if (Array.isArray(dataModel) && dataModel.length)
				return (
					<SectionRows
						rows={children}
						dataModel={dataModel}
					/>
				);
			return (
				<Flex
					flexWrap='wrap'
					gap={4}
					alignItems='center'>
					{children?.map((item: any, i: number) => (
						<Flex
							p={3}
							flexWrap='wrap'
							borderWidth={1}
							borderRadius={8}
							gap={4}
							key={i}>
							<JSONDisplay jsonData={item} />
						</Flex>
					))}
				</Flex>
			);
		case 'section-object':
			return (
				<SectionObject
					value={children}
					dataModel={Array.isArray(dataModel) ? dataModel : []}
				/>
			);
		case 'custom-section-array':
			return (
				<Column
					gap={0}
					w='full'
					borderWidth='1px'
					borderRadius='md'
					overflow='hidden'>
					{children.map((item: any, i: number) => (
						<Flex
							key={i}
							gap={3}
							p={3}
							align='flex-start'
							borderTopWidth={i ? '1px' : 0}>
							{item?.image && (
								<ImageContainer
									size={48}
									src={item.image}
								/>
							)}
							<Box
								flex={1}
								minW={0}>
								<Text
									fontSize='sm'
									fontWeight='600'
									wordBreak='break-word'>
									{item?.title || '--'}
								</Text>
								{item?.description && (
									<Text
										fontSize='sm'
										color='fg.muted'
										whiteSpace='pre-line'
										wordBreak='break-word'>
										{item.description}
									</Text>
								)}
							</Box>
						</Flex>
					))}
				</Column>
			);
		case 'data-tag':
		case 'data-array-tag':
			return linkedList(children, path || link?.route);
		case 'array-tag':
			return (
				<Align
					flexWrap='wrap'
					gap={2}>
					{children?.map((item: any, i: number) => (
						<Badge
							px={2}
							colorPalette='purple'
							variant='subtle'
							key={i}>
							{item?.toString()}
						</Badge>
					))}
				</Align>
			);
		case 'external-link':
		case 'uri':
		case 'url': {
			// Empty arrives as the '--' placeholder: no link, no icon.
			const href = linkHref(children);
			if (!href) return <Text {...textCss}>{typeof children === 'string' && children.trim() ? children : '--'}</Text>;
			return (
				<Link
					href={href}
					target='_blank'
					rel='noopener noreferrer'
					title='Opens in a new tab'
					color='accent.fg'
					display='inline-flex'
					alignItems='center'
					gap={1.5}
					maxW='full'>
					<Text
						{...textCss}
						color='inherit'>
						{children}
					</Text>
					<ExternalLink
						size={14}
						style={{ flexShrink: 0 }}
						aria-hidden
					/>
				</Link>
			);
		}
		case 'file':
			if (!children || children == '--') return null;
			return (
				<Flex gap={2}>
					<Link
						cursor='pointer'
						href={children || '#'}
						{...(children ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
						<Tag.Root
							size='md'
							colorPalette='gray'>
							<Tag.Label mr={1}>Download File</Tag.Label>
							<Icon
								name='download'
								size={16}
							/>
						</Tag.Root>
					</Link>
				</Flex>
			);

		case 'file-array':
			if (!Array.isArray(children) || !children.length) return null;
			return (
				<Flex
					gap={2}
					flexWrap='wrap'>
					{children.map((url: string, i: number) => (
						<Link
							key={i}
							href={url}
							target='_blank'
							rel='noopener noreferrer'>
							<Tag.Root
								size='md'
								colorPalette='gray'>
								<Tag.Label mr={1}>{fileName(url, i)}</Tag.Label>
								<Icon
									name='download'
									size={16}
								/>
							</Tag.Root>
						</Link>
					))}
				</Flex>
			);

		case 'tag':
			// Empty: the plain placeholder, not a badge reading "--".
			if (children === '--' || (Array.isArray(children) && !children.length)) return <Text {...textCss}>--</Text>;
			return (
				<Flex
					alignItems='center'
					flexWrap='wrap'
					gap={2}>
					{Array.isArray(children)
						? children.map((item: any, i: number) => (
								<Badge
									px={2}
									variant='outline'
									key={i}>
									{item?.toString()}
								</Badge>
						  ))
						: children && (
								<Badge colorPalette={colorPalette ? colorPalette(children) : 'gray'}>
									{children?.toString()}
								</Badge>
						  )}
				</Flex>
			);
		case 'checkbox':
			return (
				<Box alignItems='center'>
					{children && (
						<Badge colorPalette={colorPalette ? colorPalette(children) : 'gray'}>
							{children?.toString()}
						</Badge>
					)}
				</Box>
			);
		case 'custom-attribute':
			return (
				<Box alignItems='center'>
					<Column gap={2}>
						{children &&
							children?.length > 0 &&
							children?.map(({ label, value }: any, i: number) => (
								<Grid
									alignItems='center'
									gridTemplateColumns='1fr 2fr'
									key={i}>
									<Heading size='xs'>{label}:</Heading>
									<Text fontSize='.8rem'>{value}</Text>
								</Grid>
							))}
					</Column>
				</Box>
			);
		// On a phone a picture takes the full width under its label (ViewRow
		// stacks image rows); from md up, the fixed sizes beside the label.
		case 'image':
			return (
				<FullScreenImage
					src={children || PLACEHOLDER_IMAGE}
					w={{ base: 'full', md: 'auto' }}>
					<ImageContainer
						size={300}
						src={children || PLACEHOLDER_IMAGE}
						w={{ base: 'full', md: '300px' }}
						h={{ base: 'auto', md: '300px' }}
						aspectRatio={{ base: '4 / 3', md: 'auto' }}
					/>
				</FullScreenImage>
			);
		case 'image-array':
			return (
				<Grid
					w={{ base: 'full', md: 'auto' }}
					templateColumns={{ base: 'repeat(2, minmax(0, 1fr))', md: 'repeat(auto-fill, 100px)' }}
					gap={2}>
					{children?.map((item: string, i: number) => (
						<FullScreenImage
							src={item || PLACEHOLDER_IMAGE}
							key={i}
							w={{ base: 'full', md: 'auto' }}>
							<ImageContainer
								src={item || PLACEHOLDER_IMAGE}
								size={100}
								w={{ base: 'full', md: '100px' }}
								h={{ base: 'auto', md: '100px' }}
								aspectRatio={{ base: '1', md: 'auto' }}
							/>
						</FullScreenImage>
					))}
				</Grid>
			);
		case 'date':
			return <Text {...textCss}>{children?.toLocaleString()}</Text>;
		case 'date-only':
			return <Text {...textCss}>{children ? moment(children).format('DD-MM-YYYY') : '--'}</Text>;

		case 'textarea':
			return (
				<Text
					{...textCss}
					whiteSpace='pre-line'>
					{children}
				</Text>
			);
		case 'editor':
			return <div dangerouslySetInnerHTML={{ __html: children }} />;
		case 'basic-editor':
			return <div dangerouslySetInnerHTML={{ __html: children }} />;
		// WO-15: the remaining declared-but-unhandled ViewDataTypes.
		case 'price':
			return children === undefined || children === null || children === '' ? (
				<Text {...textCss}>--</Text>
			) : (
				<Text {...textCss}>
					<Price>{children}</Price>
				</Text>
			);
		case 'boolean':
			return <Badge colorPalette={children ? 'green' : 'red'}>{children ? 'Yes' : 'No'}</Badge>;
		case 'number':
			return <Text {...textCss}>{typeof children === 'number' ? children.toLocaleString() : children ?? '--'}</Text>;
		case 'image-text':
			return (
				<Flex
					align='center'
					gap={2}>
					<ImageContainer
						size={40}
						src={children || PLACEHOLDER_IMAGE}
					/>
					<Text {...textCss}>{typeof children === 'string' ? children : ''}</Text>
				</Flex>
			);
		case 'data-array-count':
			return <Text {...textCss}>{Array.isArray(children) ? children.length : children ?? '--'}</Text>;
		case 'password':
			return <SecretValue value={children} />;
		case 'text':
		case 'string':
			// A populated Mongoose reference (e.g. `addedBy`) can reach here as a
			// raw {_id, name, email} object when a schema's dataKey doesn't drill
			// into it — rendering it directly crashes with React error #31.
			if (children && typeof children === 'object' && !Array.isArray(children)) {
				return (
					<Text {...textCss}>{(children as any).name ?? (children as any).email ?? '--'}</Text>
				);
			}
			return <Text {...textCss}>{children ?? '--'}</Text>;
		case 'menu':
			// Menu columns are intercepted upstream (table row / view field list
			// building) before a value ever reaches here — nothing to view-render.
			return null;
		case 'object':
			return children && typeof children === 'object' && !Array.isArray(children) ? (
				<Column gap={1}>
					{Object.entries(children).map(([key, value]) => (
						<Grid
							alignItems='center'
							gridTemplateColumns='1fr 2fr'
							key={key}>
							<Heading size='xs'>{key}:</Heading>
							<Text fontSize='.8rem'>
								{value === null || value === undefined
									? '--'
									: typeof value === 'object'
									? JSON.stringify(value)
									: String(value)}
							</Text>
						</Grid>
					))}
				</Column>
			) : (
				<Text {...textCss}>--</Text>
			);
		default:
			if (originalType === 'data-menu')
				return (
					<ViewItemModal
						id={id}
						path={path}
						trigger={
							<Text
								{...textCss}
								cursor={'pointer'}
								color='accent.fg'>
								{typeof children === 'string' ? children : 'View Details'}
							</Text>
						}
					/>
				);
			return <Text {...textCss}>{typeof children === 'string' ? children : 'View Details'}</Text>;
	}
};

export default renderContent;
