'use client';

import { Dialog, Button, Flex, Portal } from '@chakra-ui/react';
import { ReactNode, useEffect, FC, useState, useRef } from 'react';

import { AlertDialogHeader, AlertDialogContent } from '../../../..';
import ModalFooter from '../../../../modals/modal-components/CustomModalFooter';

type DeleteItemModalProps = {
	prompt?: {
		title?: string;
		body?: string;
		btnText?: string;
		successMsg?: string;
	};
	children: ReactNode;
	handler: () => void;
	loading?: boolean;
	success?: boolean;
};

const Alert: FC<DeleteItemModalProps> = ({ prompt, loading, children, success, handler }) => {
	const [isOpen, setIsOpen] = useState(false);
	const cancelRef = useRef<any>(undefined);

	const [isLoading, setIsLoading] = useState<boolean>(loading || false);

	const closeItem = () => {
		setIsOpen(false);
	};

	const openItem = () => {
		setIsOpen(true);
	};

	const handleDelete = (e: any) => {
		setIsLoading(true);
		handler();
	};

	useEffect(() => {
		if (!loading && success) {
			closeItem();
			setIsLoading(false);
		}
	}, [isLoading, success]);

	return (
		<>
			<Flex onClick={openItem}>{children}</Flex>

			<Dialog.Root
				lazyMount
				unmountOnExit
				open={isOpen}
				onOpenChange={details => setIsOpen(details.open)}
				role='alertdialog'
				initialFocusEl={() => cancelRef.current}>
				<Portal>
					{/* Chakra assigns each Portal's z-index from a shared, order-dependent
					counter, so this can tie with the row menu's (both land on 1500) and
					leave the menu showing through next to the dialog. Pinning it above
					any menu content makes the stacking deterministic. */}
					<Dialog.Backdrop zIndex={1600} />
					<Dialog.Positioner zIndex={1600}>
						<AlertDialogContent>
							<AlertDialogHeader>{prompt?.title}</AlertDialogHeader>

							<Dialog.Body>{prompt?.body}</Dialog.Body>

							<ModalFooter>
								<Button
									disabled={isLoading}
									ref={cancelRef}
									onClick={closeItem}
									px={3}
									size='sm'
									variant='outline'>
									Discard
								</Button>

								<Button
									loading={isLoading}
									loadingText='Processing'
									colorPalette='red'
									onClick={handleDelete}
									px={3}
									size='sm'>
									{prompt?.btnText || 'Proceed'}
								</Button>
							</ModalFooter>
						</AlertDialogContent>
					</Dialog.Positioner>
				</Portal>
			</Dialog.Root>
		</>
	);
};

export default Alert;
