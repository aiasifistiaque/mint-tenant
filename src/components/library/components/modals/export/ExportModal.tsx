'use client';

import { Button, useDisclosure, Text, Checkbox, Grid } from '@chakra-ui/react';
import { useEffect, useState, useCallback } from 'react';
import { useColorMode } from '@/components/ui/color-mode';

import {
	formatFieldName,
	useAppSelector,
	MenuModal,
	MenuModalHeader,
	MenuModalBody,
	MenuModalCloseButton,
	MenuModalFooter,
	DiscardButton,
	Icon,
	useExportMutation,
	ConfirmButton,
	useIsMobile,
} from '../../..';
import Dropdown from '../../../cl/Dropdown';

const ExportModal = ({ path, ids }: { path: string; ids?: string[] }) => {
	const { open: isOpen, onOpen, onClose } = useDisclosure();
	const { fields = [], preferences = [] } = useAppSelector(state => state.table);
	const [selected, setSelected] = useState<string[]>([]);
	const isMobile = useIsMobile();

	const [trigger, result] = useExportMutation();

	const [type, setType] = useState('csv');

	const handleSubmit = (e: any) => {
		e.preventDefault();
		trigger({
			path: path,
			body: selected,
			type: type,
		});
	};

	const closeModal = () => {
		setType('csv');
		setSelected(preferences);
		onClose();
	};

	useEffect(() => {
		setSelected(preferences);
	}, [preferences]);

	useEffect(() => {
		if (result?.isSuccess) {
			closeModal();
		}
	}, [result]);

	const handleCheckboxChange = useCallback((e: any, field: any) => {
		if (e.checked) {
			setSelected(prevSelected => [...prevSelected, field]);
		} else {
			setSelected(prevSelected => prevSelected.filter(item => item !== field));
		}
	}, []);

	const checkboxes = fields.map((field: string, i: number) => (
		<Checkbox.Root
			size={{ base: 'lg', md: 'sm' }}
			key={i}
			checked={selected?.includes(field)}
			onCheckedChange={e => handleCheckboxChange(e, field)}>
			<Checkbox.HiddenInput />
			<Checkbox.Control>
				<Checkbox.Indicator />
			</Checkbox.Control>
			<Checkbox.Label fontWeight='500'>{formatFieldName(field)}</Checkbox.Label>
		</Checkbox.Root>
	));

	const { colorMode } = useColorMode();
	const iconColor = 'accent.contrast';

	return (
		<>
			<Button
				onClick={onOpen}
				size='sm'
				px={3}
				variant='outline'>
				<Icon name='export-doc' />
				{!isMobile && 'Export'}
			</Button>

			<MenuModal
				placement={{ base: 'bottom', md: 'center' }}
				forceModal
				isOpen={isOpen}
				onClose={closeModal}>
				<MenuModalHeader>Select Export Fields</MenuModalHeader>
				<MenuModalCloseButton />
				<MenuModalBody>
					<Grid
						py={2}
						gridTemplateColumns={{ base: '1fr 1fr', md: '1fr 1fr' }}
						gap={4}
						rowGap={4}>
						{checkboxes}
					</Grid>
					<Grid
						alignItems='center'
						py={2}
						gridTemplateColumns={{ base: '1fr 1fr', md: '1fr 1fr' }}
						gap={4}
						rowGap={4}>
						<Text fontWeight='600'>Export As:</Text>
						<Dropdown
							_light={{
								borderColor: 'container.borderLight',
								bg: 'container.newLight',
							}}
							size='sm'
							value={type}
							onChange={v => setType(v)}>
							<option value='csv'>CSV</option>
							<option value='pdf'>Pdf</option>
						</Dropdown>
					</Grid>
				</MenuModalBody>
				<MenuModalFooter>
					{selected?.length < 2 ? (
						<Text color='red'>Please select at least 2 fields</Text>
					) : selected?.length > 5 && type == 'pdf' ? (
						<Text color='red'>You can only export up to 5 fields to PDF</Text>
					) : (
						<>
							<DiscardButton onClick={closeModal}>Discard</DiscardButton>
							<ConfirmButton
								onClick={handleSubmit}
								loading={result?.isLoading}>
								<Icon
									name='export-doc'
									size={14}
									color={iconColor}
								/>
								Export
							</ConfirmButton>
						</>
					)}
				</MenuModalFooter>
			</MenuModal>
		</>
	);
};

export default ExportModal;
