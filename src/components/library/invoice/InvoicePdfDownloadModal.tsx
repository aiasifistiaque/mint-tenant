'use client';
import { useState, FC } from 'react';
import { Box, Button, Checkbox, HStack, Image, Text, VStack } from '@chakra-ui/react';
import Link from 'next/link';

import { useDownloadInvoicePdfMutation, useGetSelfQuery } from '..';
import { Dialog, DialogHeader, DialogBody, DialogCloseButton, DialogFooter } from '..';
import { INVOICE_DESIGNS, DEFAULT_INVOICE_DESIGN } from './invoiceDesigns';

type InvoicePdfDownloadModalProps = {
	isOpen: boolean;
	onClose: () => void;
	id: string;
	code?: string;
	status?: string;
};

const InvoicePdfDownloadModal: FC<InvoicePdfDownloadModalProps> = ({ isOpen, onClose, id, code, status }) => {
	// The signature embedded on the PDF is always the downloading admin's own
	// (set on their Settings screen), never a shared org-wide one.
	const { data: self, isFetching: isSelfLoading } = useGetSelfQuery({}, { skip: !isOpen });
	const [downloadPdf, downloadResult] = useDownloadInvoicePdfMutation();

	const [signed, setSigned] = useState(true);
	// Layout only — every design renders the same invoice fields, so switching
	// here never changes what the PDF says.
	const [design, setDesign] = useState(DEFAULT_INVOICE_DESIGN);

	const hasSignature = !!self?.signature;
	const canPaid = status === 'paid';

	const handleDownload = (type: 'bill' | 'receipt') => {
		downloadPdf({ id, code, signed: signed && hasSignature, type, design });
	};

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(e: any) => !e.open && onClose()}
			size='md'>
			<DialogHeader>Download PDF</DialogHeader>
			<DialogCloseButton />

			<DialogBody>
				<VStack
					align='stretch'
					gap={4}>
					<VStack
						align='stretch'
						gap={2}>
						<Text
							fontSize='xs'
							color='fg.muted'>
							Design
						</Text>
						<HStack gap={2}>
							{INVOICE_DESIGNS.map(option => {
								const selected = option.id === design;
								return (
									<Box
										key={option.id}
										as='button'
										flex='1'
										textAlign='left'
										p={3}
										borderRadius='md'
										border='1px solid'
										borderColor={
											selected ? 'accent.solid' : 'border'
										}
										onClick={() => setDesign(option.id)}>
										<Text
											fontSize='sm'
											fontWeight='semibold'>
											{option.label}
										</Text>
										<Text
											fontSize='xs'
											color='fg.muted'>
											{option.description}
										</Text>
									</Box>
								);
							})}
						</HStack>
					</VStack>

					<Checkbox.Root
						checked={signed}
						onCheckedChange={e => setSigned(!!e.checked)}>
						<Checkbox.HiddenInput />
						<Checkbox.Control />
						<Checkbox.Label>Include signature (mark as signed)</Checkbox.Label>
					</Checkbox.Root>

					{signed && (
						<Box
							borderRadius='md'
							border='1px solid'
							borderColor={{ _light: 'border.light', _dark: 'border.dark' }}
							p={3}>
							{isSelfLoading ? (
								<Text fontSize='sm'>Checking your signature…</Text>
							) : hasSignature ? (
								<VStack align='stretch'>
									<Text
										fontSize='xs'
										color='fg.muted'>
										Your signature
									</Text>
									<Image
										src={self?.signature as string}
										alt='Your signature'
										maxH='60px'
										objectFit='contain'
									/>
								</VStack>
							) : (
								<VStack
									align='stretch'
									gap={1}>
									<Text fontSize='sm'>You haven&apos;t added a signature yet.</Text>
									<Link href='/settings'>
										<Text
											fontSize='sm'
											color='accent.fg'
											textDecoration='underline'>
											Add one in Settings
										</Text>
									</Link>
								</VStack>
							)}
						</Box>
					)}
				</VStack>
			</DialogBody>

			<DialogFooter>
				<Button
					variant='outline'
					size='sm'
					px={3}
					onClick={onClose}>
					Close
				</Button>
				{canPaid && (
					<Button
						variant='outline'
						size='sm'
						px={3}
						loading={downloadResult.isLoading}
						onClick={() => handleDownload('receipt')}>
						Download Receipt
					</Button>
				)}
				<Button
					size='sm'
					px={3}
					loading={downloadResult.isLoading}
					onClick={() => handleDownload('bill')}>
					Download Bill
				</Button>
			</DialogFooter>
		</Dialog>
	);
};

export default InvoicePdfDownloadModal;
