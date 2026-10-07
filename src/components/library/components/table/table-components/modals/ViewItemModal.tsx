'use client';

import { FC } from 'react';
import { useDisclosure, Flex } from '@chakra-ui/react';
import { ViewModalDataModelProps, MenuItem, useGetSchemaQuery, convertToViewFields } from '../../../..';
import RecordDrawer from '../../../view/record/RecordDrawer';

type Props = {
	title?: string;
	id: string;
	path: string;
	dataModel?: ViewModalDataModelProps[];
	trigger?: any;
	item?: any;
	// Controlled mode: when `open` is passed, the dialog's open state is driven
	// by the caller instead of an internal useDisclosure, and no trigger is
	// rendered — used by TableMenu so the dialog lives outside the dropdown
	// menu's own mount lifecycle.
	open?: boolean;
	onClose?: () => void;
};

const ViewItemModal: FC<Props> = ({
	title,
	path,
	dataModel,
	trigger,
	id,
	item,
	open: controlledOpen,
	onClose: onControlledClose,
}) => {
	const isControlled = controlledOpen !== undefined;
	const { open: internalOpen, onOpen, onClose: internalOnClose } = useDisclosure();
	const isOpen = isControlled ? controlledOpen : internalOpen;
	const closeItem = () => (isControlled ? onControlledClose?.() : internalOnClose());

	// A menu item may fix which fields show: its own `dataModel`, or `fields`
	// picked from the schema. Otherwise the drawer shows the route's own layout.
	const { data: schemaData } = useGetSchemaQuery(path, { skip: !isOpen || !path || !!dataModel || !item?.fields });
	const fields = dataModel?.length
		? dataModel
		: item?.fields && schemaData
			? convertToViewFields({ schema: schemaData, fields: item.fields })
			: undefined;

	const renderTrigger = () => {
		if (isControlled) return null;
		if (trigger) {
			return <Flex onClick={onOpen}>{trigger}</Flex>;
		} else {
			return (
				<MenuItem
					asChild
					icon='view-outline'
					onClick={onOpen}>
					{title || 'Quick View'}
				</MenuItem>
			);
		}
	};

	return (
		<>
			{renderTrigger()}
			<RecordDrawer
				open={isOpen}
				onClose={closeItem}
				path={path}
				id={id}
				title={title}
				fields={fields}
			/>
		</>
	);
};

export default ViewItemModal;
