import { FC, ReactNode } from 'react';
import { useIsMobile } from '../../../..';
import { styles } from '../../../../config';
import { Drawer, Dialog } from '@chakra-ui/react';
import { useResolvedModalLayout } from './ModalLayoutContext';

type MenuModalFooterProps = {
	children: ReactNode;
	[key: string]: any;
};

// The shared modal footer look (styles.MODAL_FOOTER), in a drawer too —
// inset like this modal's header and body.
const footerCss = { ...(styles.MODAL_FOOTER as any), px: { base: 4, md: 6 } };

const MenuModalFooter: FC<MenuModalFooterProps> = ({ children, ...props }) => {
	const isMobile = useIsMobile();
	const layout = useResolvedModalLayout();

	if (layout === 'drawer') {
		return (
			<Drawer.Footer
				{...footerCss}
				// Clear of the home indicator on phones without a button.
				{...(isMobile ? { pt: 3, pb: 'max(16px, env(safe-area-inset-bottom))' } : {})}
				{...props}>
				{children}
			</Drawer.Footer>
		);
	}

	return (
		<Dialog.Footer
			{...footerCss}
			{...props}>
			{children}
		</Dialog.Footer>
	);
};

export default MenuModalFooter;
