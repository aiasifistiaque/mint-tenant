'use client';

import { FC } from 'react';
import { useDisclosure } from '@chakra-ui/react';
import { MenuItem } from '../../../..';
import TotalsDialog from '../totals/TotalsDialog';

type Props = {
	title?: string;
	path: string;
	/** The selected rows' ids. */
	items: string[];
	[key: string]: any;
};

/**
 * The bulk menu's "Sum fields" (`type: 'calculate'`): the same calculator as
 * the selection bar's button — any number field, Total / Average / Lowest /
 * Highest / Count, across the selected rows.
 */
const CalculateModal: FC<Props> = ({ title, path, items }) => {
	const { open, onOpen, onClose } = useDisclosure();

	return (
		<>
			<MenuItem onClick={onOpen}>{title || 'Calculate'}</MenuItem>
			<TotalsDialog
				open={open}
				onClose={onClose}
				path={path}
				ids={items || []}
				config={{ title: title || 'Calculate' }}
			/>
		</>
	);
};

export default CalculateModal;
