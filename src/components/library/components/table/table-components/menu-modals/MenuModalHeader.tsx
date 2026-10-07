import { FC, ReactNode } from 'react';
import { Box, Drawer, Dialog, Flex } from '@chakra-ui/react';
import { useResolvedModalLayout } from './ModalLayoutContext';

type MenuModalHeaderProps = {
	children: ReactNode;
	description?: ReactNode;
	/** An icon in a tile before the title — what kind of dialog this is. */
	icon?: ReactNode;
	/** Sits inline after the title: a status, a count. */
	badge?: ReactNode;
	/**
	 * A hairline under the header. The drawer always has one (its body draws
	 * it); a centred dialog gets it only when asked, since most small dialogs
	 * read better without.
	 */
	divider?: boolean;
	[key: string]: any;
};

// Padding sets the header height. The old fixed 52px fought the 24px padding
// beside it and clipped anything that wrapped.
const headerCss = {
	px: { base: 4, md: 6 },
	pt: { base: 4, md: 5 },
	pb: { base: 3, md: 4 },
	gap: 1,
	flexDir: 'column' as const,
	alignItems: 'flex-start' as const,
};

const titleCss = {
	color: 'text.light',
	_dark: { color: 'text.dark' },
	fontWeight: '600',
	fontSize: '16px',
	letterSpacing: '-0.01em',
	lineHeight: '1.4',
	minW: 0,
	// The drawer's title stretches by default, pushing a badge to the far edge.
	flex: '0 1 auto',
};

const descriptionCss = {
	color: 'fg.muted',
	fontSize: '13px',
	lineHeight: '1.5',
	fontWeight: '400',
};

const MenuModalHeader: FC<MenuModalHeaderProps> = ({ children, description, icon, badge, divider, ...props }) => {
	const layout = useResolvedModalLayout();
	const Part = layout === 'drawer' ? Drawer : Dialog;

	const text = (
		<>
			<Flex
				align='center'
				gap={2}
				minW={0}
				maxW='full'>
				<Part.Title {...titleCss}>{children}</Part.Title>
				{badge}
			</Flex>
			{description && <Part.Description {...descriptionCss}>{description}</Part.Description>}
		</>
	);

	return (
		<Part.Header
			{...headerCss}
			{...(divider && layout !== 'drawer' && { borderBottomWidth: '1px', borderColor: 'border.muted' })}
			// Clear of the close button.
			pr={{ base: 12, md: 14 }}
			w='full'
			{...props}>
			{icon ? (
				<Flex
					align='center'
					gap={3}
					w='full'
					minW={0}>
					<Flex
						flexShrink={0}
						w='36px'
						h='36px'
						align='center'
						justify='center'
						borderRadius='lg'
						borderWidth='1px'
						borderColor='border'
						bg='bg.subtle'
						color='fg.muted'>
						{icon}
					</Flex>
					<Box
						minW={0}
						flex={1}>
						{text}
					</Box>
				</Flex>
			) : (
				text
			)}
		</Part.Header>
	);
};

export default MenuModalHeader;
