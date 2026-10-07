'use client';
import { FC } from 'react';
import { useDisclosure } from '@chakra-ui/react';
import { MenuItem } from '..';
import InvoicePdfDownloadModal from './InvoicePdfDownloadModal';

type DownloadInvoicePdfMenuItemProps = {
	id: string;
	doc?: any;
	title?: string;
};

const DownloadInvoicePdfMenuItem: FC<DownloadInvoicePdfMenuItemProps> = ({ id, doc, title }) => {
	const { open, onOpen, onClose } = useDisclosure();

	return (
		<>
			<MenuItem
				closeOnSelect={false}
				icon='download'
				onClick={onOpen}>
				{title || 'Download PDF'}
			</MenuItem>
			<InvoicePdfDownloadModal
				isOpen={open}
				onClose={onClose}
				id={id}
				code={doc?.code}
				status={doc?.status}
			/>
		</>
	);
};

export default DownloadInvoicePdfMenuItem;
