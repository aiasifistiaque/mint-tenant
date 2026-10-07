import { FC, ReactNode } from 'react';
import { useIsMobile } from '../../../..';
import { Drawer, Dialog } from '@chakra-ui/react';
import { useResolvedModalLayout } from './ModalLayoutContext';

type MenuModalBodyProps = {
	children: ReactNode;
	[key: string]: any;
};

const bodyCss = {
	px: { base: 4, md: 6 },
	pt: 0,
	pb: { base: 4, md: 5 },
	flex: '1',
	minH: 0,
};

const MenuModalBody: FC<MenuModalBodyProps> = ({ children, ...props }) => {
	const isMobile = useIsMobile();
	const layout = useResolvedModalLayout();

	if (layout === 'drawer') {
		return (
			<Drawer.Body
				borderTopWidth='1px'
				borderColor='border.muted'
				// No fixed cap: the sheet's own max height plus the flex column
				// decide how tall the body gets.
				overflowY='auto'
				{...bodyCss}
				// No scrollbar gutter on a phone: it cost the right edge 10px, so
				// fields sat off-centre in the sheet. Touch scrolling needs no bar.
				{...(isMobile ? { pt: 4, css: { scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } } } : {})}
				{...props}>
				{children}
			</Drawer.Body>
		);
	}

	return (
		<Dialog.Body
			overflowY='auto'
			{...bodyCss}
			{...props}>
			{children}
		</Dialog.Body>
	);
};

export default MenuModalBody;
