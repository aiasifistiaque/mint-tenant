import { Drawer, Popover, Button, Flex, Portal } from '@chakra-ui/react';

import { FC, ReactNode } from 'react';
import { Column } from '../../../..';
import { DrawerContentContainer, PopoverContentContainer } from '.';

type MenuModalProps = {
	children: ReactNode;
	trigger: any;
	onOpen: any;
	onClose: any;
	isOpen: any;
	isMobile: boolean;
	handleClick: any;
	/**
	 * Secondary actions (e.g. "Clear all", "Select all") for the left of the
	 * footer. Passing it switches the footer from the lone full-width Apply to a
	 * split bar: these on the left, Cancel + Apply on the right.
	 */
	footerStart?: ReactNode;
	width?: string;
	/** Greys out Apply, e.g. while a filter's inputs are half filled in. */
	applyDisabled?: boolean;
};

const PopModal: FC<MenuModalProps> = ({
	children,
	trigger,
	onClose,
	isOpen,
	onOpen,
	isMobile,
	handleClick,
	footerStart,
	width,
	applyDisabled,
}) => {
	if (isMobile) {
		return (
			<>
				{trigger}
				<Drawer.Root
					lazyMount
					unmountOnExit
					placement='bottom'
					onOpenChange={e => !e.open && onClose()}
					open={isOpen}>
					<Portal>
						<Drawer.Backdrop />
						<Drawer.Positioner>
							<DrawerContentContainer>
								{children}
								<Drawer.Footer
									px={4}
									py={3}
									pb={5}
									borderTopWidth={1}
									borderColor='border.muted'
									bg='bg.subtle'
									justifyContent={footerStart ? 'space-between' : undefined}>
									{footerStart && <Flex gap={1}>{footerStart}</Flex>}
									<Button
										w={footerStart ? 'auto' : 'full'}
										px={footerStart ? 8 : undefined}
										size='md'
										disabled={applyDisabled}
										onClick={handleClick}>
										Apply
									</Button>
								</Drawer.Footer>
							</DrawerContentContainer>
						</Drawer.Positioner>
					</Portal>
				</Drawer.Root>
			</>
		);
	}

	return (
		<Popover.Root
			onOpenChange={e => {
				if (e.open) onOpen();
				else onClose();
			}}
			open={isOpen}>
			<Popover.Trigger asChild>
				<span>{trigger}</span>
			</Popover.Trigger>
			<Popover.Positioner>
				<PopoverContentContainer {...(width && { w: width, maxW: width })}>
					<Popover.Arrow />
					<Column gap={0}>
						{children}
						{footerStart ? (
							<Flex
								mt={1.5}
								px={2}
								py={2}
								gap={1}
								w='full'
								align='center'
								borderTopWidth={1}
								borderColor='border.muted'>
								{footerStart}
								<Flex
									ml='auto'
									gap={1.5}>
									<Button
										size='xs'
										h='28px'
										px={2.5}
										variant='ghost'
										onClick={onClose}>
										Cancel
									</Button>
									<Button
										size='xs'
										h='28px'
										px={3}
										disabled={applyDisabled}
										onClick={handleClick}>
										Apply
									</Button>
								</Flex>
							</Flex>
						) : (
							<Flex
								px={4}
								pt={3}
								pb={4}
								w='full'>
								{/* Solid, not the muted outline chip used elsewhere in the
								    toolbar — this is the primary action of the popup. */}
								<Button
									w='full'
									size='sm'
									disabled={applyDisabled}
									onClick={handleClick}>
									Apply
								</Button>
							</Flex>
						)}
					</Column>
				</PopoverContentContainer>
			</Popover.Positioner>
		</Popover.Root>
	);
};

export default PopModal;
