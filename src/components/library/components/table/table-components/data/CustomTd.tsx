import { FC, Fragment } from 'react';
import {
	Table,
	Image,
	Text,
	Heading,
	ImageProps,
	Center,
	Link,
	CenterProps,
} from '@chakra-ui/react';
import { ExternalLink as ExternalLinkIcon } from 'lucide-react';

import { useIsCardView, Column, PLACEHOLDER_IMAGE, TableDataProps, theme } from '../../../..';

const { TABLE } = theme;

/**
 * Links a cell's value out when the column is an external link or a file.
 *
 * Declared out here, not inside CustomTd: a component defined in a render is a
 * new type every render, so React remounted everything in the cell each time
 * the row re-rendered — including the row menu and the edit dialog it had
 * open, which vanished as soon as the record it loaded landed in the store.
 */
const External = ({ children, text, type }: any) => {
	if (text && (type == 'external-link' || type == 'file')) {
		return (
			<Link
				target='_blank'
				href={text}>
				<>
					{type == 'file' ? <b>Go to file</b> : children}{' '}
					<ExternalLinkIcon style={{ marginLeft: '4px' }} />
				</>
			</Link>
		);
	}
	return <>{children}</>;
};

const CustomTd: FC<TableDataProps> = ({ children, src, type, heading, editable, ...props }) => {
	const isCardView = useIsCardView();

	const text = children;

	const Container = isCardView ? Column : Table.Cell;

	// On mobile the value is wrapped in a <Text> (a <p>) unless the cell renders
	// its own structure. 'tag' and 'history' both hand back elements containing
	// a <div>, which is not valid inside a <p> — the browser hoists it out, and
	// the markup React hydrates against no longer matches what it rendered.
	const TextContainer = isCardView
		? editable
			? Fragment
			: type == 'tag' || type == 'history'
			? Fragment
			: Text
		: Fragment;

	// Function to add word break opportunities on specific characters
	const formatTextForBreaking = (text: any) => {
		if (typeof text !== 'string') return text;

		// Add zero-width space after specific characters to allow breaking
		return text.replace(/([_\-/.:%@0])/g, '$1\u200B');
	};

	if (type == 'selectMenu') return <Container {...tdCss(type, heading)}>{children}</Container>;

	return (
		<>
			<Container
				{...tdCss(type, heading, isCardView)}
				{...props}>
				{type == 'image-text' && (
					<Center {...imageBoxCss}>
						<Image
							src={src || PLACEHOLDER_IMAGE}
							{...imageCss}
						/>
					</Center>
				)}

				{isCardView && heading && <Heading size='xs'>{heading}</Heading>}
				<External
					text={text}
					type={type}>
					{TextContainer === Fragment ? (
						formatTextForBreaking(text) || <i>--</i>
					) : (
						<TextContainer
							// A div, not the <p> Chakra's Text renders by default.
							// Several cells (checkbox, history, image-text) return their
							// own block structure, and the parser auto-closes a <p> when
							// it meets a <div> — so the DOM React hydrated against no
							// longer matched what it rendered. Nothing here needs to be
							// a paragraph; the styling is identical either way.
							as='div'
							color='text.light'
							_dark={{ color: 'text.dark' }}
							// This sits next to the copy icon in a row flex container
							// (see tdCss below): as a flex item it defaults to
							// `min-width: auto`, which lets long unbroken text (a URL)
							// refuse to shrink and overflow past the card's column
							// instead of wrapping.
							minW={0}>
							{formatTextForBreaking(text) || <i>--</i>}
						</TextContainer>
					)}
				</External>
			</Container>
		</>
	);
};

//CSS STARTS HERE
const PADDING_Y = TABLE.cell.paddingY;
const PADDING_X = TABLE.cell.paddingX;

const IMG_SIZE = { base: '50px', md: '40px' };

//CONTAINER CSS
const tdCss = (type: any, heading: any, isCardView?: boolean): any => {
	return {
		// A table cell caps its width so one long value can't dominate a column.
		// A card field has no such neighbour to protect — the grid track is
		// already `minmax(0, 1fr)`, so the cap only forced short values like an
		// email address to wrap early inside a card that had room for them.
		maxW: isCardView ? 'full' : type == 'image-text' ? '240px' : '160px',
		// Grid items default to `min-width: auto`, so even with `maxW` set a
		// long unbroken run (a URL, before the zero-width-space breaks below
		// even get a chance) can still force its track wider than its 1fr
		// share on the mobile card grid, pushing into the next field. `minW:
		// 0` lets the track actually shrink to that share.
		minW: 0,
		border: 'none',
		whiteSpace: 'normal',
		wordBreak: 'normal',
		overflowWrap: 'break-word',
		color: 'text.light',
		_dark: { color: 'text.dark' },
		// No cell padding inside a card: the card supplies its own, and the field
		// label above the value has none. Left on, the `md` branch fired for card
		// view on a desktop and indented every value 12px past its own label.
		py: isCardView ? 0 : PADDING_Y,
		px: isCardView ? 0 : { base: 0, md: PADDING_X },

		fontWeight: '400',
		gap: heading ? 2 : { base: 4, md: 0 },
		flexDir: heading ? 'column' : 'row',
		fontSize: {
			base: type == 'image-text' ? '1.2rem' : TABLE.cell.fontSize.base,
			md: TABLE.cell.fontSize.md,
		},

		// _notLast: {
		// 	borderRight: '1px solid',
		// 	borderColor: 'border.light',
		// 	_dark: {
		// 		borderColor: 'border.dark',
		// 	},
		// },
	};
};

const imageBoxCss: CenterProps = {
	w: IMG_SIZE,
	h: IMG_SIZE,
	minW: IMG_SIZE,
	mr: { base: 2, md: 0 },
};

//IMAGE CSS
const imageCss: ImageProps = {
	objectFit: 'contain',
	h: IMG_SIZE,
	w: IMG_SIZE,
	alt: 'img',
	bg: 'bg.muted',
};

export default CustomTd;
