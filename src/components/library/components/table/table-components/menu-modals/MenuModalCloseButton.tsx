import { Drawer, Dialog, CloseButton } from '@chakra-ui/react';
import { useResolvedModalLayout } from './ModalLayoutContext';

const buttonCss = {
	size: 'sm' as const,
	position: 'absolute' as const,
	top: '3',
	insetEnd: '3',
	borderRadius: 'full',
	color: 'fg.muted',
	_hover: { bg: 'bg.muted', color: 'fg' },
};

/** Top-right; `top` can be moved to centre it on a taller header. */
const MenuModalCloseButton = (props: Record<string, any>) => {
	const layout = useResolvedModalLayout();

	if (layout === 'drawer') {
		return (
			<Drawer.CloseTrigger asChild>
				<CloseButton
					{...buttonCss}
					{...props}
				/>
			</Drawer.CloseTrigger>
		);
	}

	return (
		<Dialog.CloseTrigger asChild>
			<CloseButton
				{...buttonCss}
				{...props}
			/>
		</Dialog.CloseTrigger>
	);
};

export default MenuModalCloseButton;
