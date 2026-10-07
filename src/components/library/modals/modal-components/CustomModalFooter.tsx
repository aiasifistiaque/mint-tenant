import { FC, ReactNode } from 'react';
import { Dialog } from '@chakra-ui/react';
import { styles } from '../../config';

type CustomModalFooterProps = {
	children?: ReactNode;
	[key: string]: any;
};

/**
 * The footer every modal uses — the actions, right-aligned on a tinted ledge
 * under a hairline. Put the buttons straight in (DiscardButton, then the
 * primary Button, both size sm); the spacing is here, so no wrapper is
 * needed. Its look is `styles.MODAL_FOOTER`: change it there and every
 * modal follows.
 */
const CustomModalFooter: FC<CustomModalFooterProps> = ({ children, ...props }) => (
	<Dialog.Footer
		{...(styles.MODAL_FOOTER as any)}
		{...props}>
		{children}
	</Dialog.Footer>
);

export default CustomModalFooter;
