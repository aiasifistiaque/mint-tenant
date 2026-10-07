'use client';

import { Menu, Flex, Input, useDisclosure, InputProps } from '@chakra-ui/react';

import { ReactNode, useState, FC, useRef } from 'react';

import {
	DataMenuButton,
	MenuContainer,
	MenuItem,
	ItemOfDataMenu,
	FormControl,
	fontOptions,
} from '../../..';

const WIDTH = '300px';
const MAX_H = '200px';

type VDataMenuProps = InputProps & {
	label: string;
	isRequired?: boolean;
	placeholder?: string;
	value: any;
	helper?: string;
	hideNew?: boolean;
	unselect?: boolean;
	// FormInput hands these to every field input; stripped before the DOM spread.
	formData?: any;
	setFormData?: any;
	setChangedData?: any;
};

const VFont: FC<VDataMenuProps> = ({
	label,
	isRequired,
	placeholder,
	value,
	helper,
	hideNew = false,
	type = 'value',
	unselect = true,
	// FormInput's form-state props — not DOM attributes, so keep them out of `...props`.
	formData: _formData,
	setFormData: _setFormData,
	setChangedData: _setChangedData,
	...props
}) => {
	const { onOpen, onClose, open: isOpen } = useDisclosure();

	const [title, setTitle] = useState<string>(`Select ${label}`);
	const [search, setSearch] = useState<string>('');

	const [options, setOptions] = useState<any>(fontOptions);

	const handleSearch = (e: any) => {
		setSearch(e.target.value);
		if (e.target.value === '') setOptions(fontOptions);
		else {
			const filteredOptions = fontOptions.filter((item: any) =>
				item.label.toLowerCase().includes(e.target.value.toLowerCase())
			);
			setOptions(filteredOptions);
		}
	};

	const closeMenu = () => {
		setSearch('');
		setOptions(fontOptions);
		onClose();
	};

	const handleChange = (e: { label: string; value: string | undefined }) => {
		if (props.onChange) {
			const event = {
				target: {
					name: props.name,
					value: e.value,
				},
			} as any;
			props.onChange(event);
		}
		setTitle(e?.label);
		onClose();
	};

	const renderMenuItems = options?.map((item: any, i: number) => (
		<ItemOfDataMenu
			fontFamily={item?.value}
			cursor='pointer'
			id={item?.value}
			key={i}
			onClick={() => handleChange(item)}>
			{item?.label}
		</ItemOfDataMenu>
	));

	const inputRef = useRef<any>(null);

	return (
		<Flex w='full'>
			<Menu.Root onOpenChange={e => (e.open ? onOpen() : closeMenu())}>
				<FormControl
					isRequired={isRequired}
					label={label}
					helper={helper}
					w='full'>
					<DataMenuButton
						isFont
						{...(value && { fontFamily: value })}
						value={value}>
						{value ? value : `Select ${label}`}
					</DataMenuButton>
					<Input
						ref={inputRef}
						required={isRequired}
						value={value}
						{...selectInputCSS}
						{...props}
					/>
				</FormControl>

				<MenuContainer w={WIDTH}>
					<Flex
						p={2}
						py={0.5}>
						<Input
							{...searchInputCSS}
							value={search}
							onChange={handleSearch}
						/>
					</Flex>
					<Menu.Separator mb={1} />

					<Menu.Separator
						mt={1}
						mb={0}
					/>
					<MenuItemScrollContainer>
						{unselect && (
							<MenuItem
								w={WIDTH}
								onClick={() => handleChange({ label: ``, value: undefined })}>
								Unselect
							</MenuItem>
						)}
						{renderMenuItems}
					</MenuItemScrollContainer>
				</MenuContainer>
			</Menu.Root>
		</Flex>
	);
};

const searchInputCSS: any = {
	borderRadius: 6,
	size: 'sm',
	placeholder: 'Search',
};

const selectInputCSS = {
	h: '1px',
	color: 'transparent',
	// focusBorderColor: 'transparent', // Chakra v2 prop — v3 forwards it to the DOM
	border: 'none',
};

const MenuItemScrollContainer = ({ children }: { children: ReactNode }) => (
	<Flex
		flexDir='column'
		w='100%'
		maxH={MAX_H}
		overflowY='scroll'>
		{children}
	</Flex>
);

export default VFont;
