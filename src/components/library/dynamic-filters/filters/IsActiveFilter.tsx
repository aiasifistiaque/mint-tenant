'use client';
import { ReactNode, FC, ChangeEvent, useState } from 'react';

import { Popover, useDisclosure } from '@chakra-ui/react';

import { FilterButton, PopoverContainer, PopoverHeader, Column, FilterSelect } from '../..';
import { useColorMode } from '@/components/ui/color-mode';

type IsActiveFilterProps = {
	trigger: ReactNode;
	value: string;
	onChange: any;
};

const IsActiveFilter: FC<IsActiveFilterProps> = ({ trigger, value, onChange }) => {
	const { onOpen, onClose, open: isOpen } = useDisclosure();
	const { colorMode } = useColorMode();

	const [val, setVal] = useState<string | undefined>(value);

	const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
		setVal(e.target.value);
	};
	const open = () => {
		setVal(value);
		onOpen();
	};

	const popClose = () => {
		setVal('');
		onClose();
	};

	const handleClick = () => {
		onChange(val);
		popClose();
	};
	return (
		<Popover.Root
			onOpenChange={({ open }) => (open ? onOpen() : onClose())}
			open={isOpen}>
			<Popover.Trigger asChild>{trigger}</Popover.Trigger>
			<Popover.Positioner>
				<PopoverContainer>
					<Popover.Arrow
						bg='menu.light'
						_dark={{ bg: 'menu.dark' }}
					/>
					<PopoverHeader>Filter by status</PopoverHeader>
					<Popover.Body>
						<Column gap={3}>
							<FilterSelect
								value={val}
								onChange={handleChange}>
								<option value='true'>True</option>
								<option value='false'>False</option>
							</FilterSelect>
							<FilterButton onClick={handleClick}>Apply</FilterButton>
						</Column>
					</Popover.Body>
				</PopoverContainer>
			</Popover.Positioner>
		</Popover.Root>
	);
};

export default IsActiveFilter;
