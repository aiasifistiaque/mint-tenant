import { CloseButton, Dialog } from '@chakra-ui/react';

/** The × in the dialog's top-right corner. */
const InsertModalCloseButton = () => (
	<Dialog.CloseTrigger
		asChild
		top={3}
		right={3}>
		<CloseButton size='sm' />
	</Dialog.CloseTrigger>
);

export default InsertModalCloseButton;
