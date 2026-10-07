'use client';

import { Menu, Flex, Input, useDisclosure, Button, Portal, CloseButton } from '@chakra-ui/react';

import { useState, FC, useRef, useEffect } from 'react';

import {
	DataMenuButton,
	CreateModal,
	MenuContainer,
	MenuItem,
	ItemOfDataMenu,
	useGetAllQuery,
	FormControl,
	Scroll,
	CreateServerModal,
	sizes,
	Icon,
	radius,
} from '../../..';

import { VDataMenuProps } from './types';
import { hiddenInputCss, searchInputCss, unselectTextCss, MAX_H, WIDTH } from './styles';
import { TicketIcon } from 'lucide-react';

const VDataMenu: FC<VDataMenuProps> = ({
	label,
	item,
	isRequired,
	placeholder,
	value,
	helper,
	model,
	dataModel,
	hideNew = false,
	field,
	type = 'value',
	dataKey = '_id',
	menuKey = 'name',
	menuAddOnKey,
	unselect = true,
	...props
}) => {
	const { onOpen, onClose, open: isOpen } = useDisclosure();

	const closeMenu = () => {
		setSearch('');
		onClose();
	};

	const [title, setTitle] = useState<string>(`Select ${label}`);
	const [search, setSearch] = useState<string>('');

	const { data, isFetching, isError, error, isSuccess } = useGetAllQuery({
		path: model,
		limit: '999',
		sort: 'name',
		search,
	});

	const handleSearch = (e: any) => {
		setSearch(e.target.value);
	};

	const handleChange = (e: any) => {
		if (props.onChange) {
			const event = {
				target: {
					name: props.name,
					value: type == 'object' ? e : e?.[dataKey],
				},
			} as any;
			props.onChange(event);
		}
		setTitle(e?.name);
		onClose();
	};

	const renderMenuItems = data?.doc?.map((item: any, i: number) => (
		<ItemOfDataMenu
			cursor='pointer'
			id={item?._id}
			key={i}
			gap={2}
			fontWeight={value == item?._id ? '700' : '400'}
			justify='space-between'
			onClick={() => handleChange(item)}>
			{item?.[menuKey]} {menuAddOnKey && `(${item?.[menuAddOnKey]})`}{' '}
			{value == item?._id && (
				<Icon
					name='check'
					size={16}
				/>
			)}
		</ItemOfDataMenu>
	));

	const getNameById = (id: string | undefined) => {
		const item = data?.doc?.find((item: any) => item._id === id);
		return item?.name || id;
	};

	const inputRef = useRef<any>(null);
	const btnRef = useRef<any>(null);
	const addItemRef = useRef<any>(null);

	useEffect(() => {
		if (isOpen) {
			if (inputRef.current) inputRef.current.focus();
		}
	}, [isOpen, onOpen, onClose]);

	const menuBody = (
		<>
			<Flex
				p={1}
				justify='space-between'
				py={0.5}>
				<Input
					{...searchInputCss}
					css={{
						'--focus-color': 'transparent',
					}}
					value={search}
					onChange={handleSearch}
				/>

				<CloseButton
					size='xs'
					onClick={() => setSearch('')}
				/>
			</Flex>
			<Menu.Separator
				mb={1}
				_dark={{ borderColor: 'border.dark' }}
			/>
			{dataModel && (
				<>
					<MenuItem onClick={() => btnRef.current.click()}>Add new {model}</MenuItem>
					<Menu.Separator
						mt={1}
						mb={0}
						_dark={{ borderColor: 'border.dark' }}
					/>
				</>
			)}
			{item?.addItem && (
				<>
					<MenuItem
						fontWeight='700'
						onClick={() => addItemRef.current.click()}>
						(+) Add New Item
					</MenuItem>
					<Menu.Separator
						mt={1}
						mb={0}
						_dark={{ borderColor: 'red' }}
					/>
				</>
			)}

			<Scroll maxH={MAX_H}>
				{unselect && (
					<MenuItem
						{...unselectTextCss}
						onClick={() => handleChange({ name: ``, _id: undefined })}>
						<i>Unselect</i>
					</MenuItem>
				)}
				{renderMenuItems}
			</Scroll>
		</>
	);

	return (
		<Flex w='full'>
			{dataModel && (
				<CreateModal
					data={dataModel}
					path={model}
					trigger={
						<Button
							display='none'
							ref={btnRef}>
							Add new {model}
						</Button>
					}
					type='post'
				/>
			)}
			{item?.addItem && (
				<CreateServerModal
					onNewItemAdd={(item: any) => handleChange(item)}
					path={model}
					trigger={
						<Button
							display='none'
							ref={addItemRef}>
							Add New Item
						</Button>
					}
				/>
			)}
			<Menu.Root>
				<FormControl
					asChild
					isRequired={isRequired}
					label={label}
					helper={helper}
					w='full'>
					<Menu.Trigger asChild>
						<Flex
							align='center'
							justify='space-between'
							w='full'
							boxShadow='sm'
							borderRadius={sizes.RADIUS_MENU}
							borderWidth={1}
							colorPalette='gray'
							cursor='default'
							h='36px'
							textAlign='left'
							fontSize='.9rem'
							pl={3}
							pr={2}
							borderColor={{
								_light: 'selectBorder.light',
								_dark: 'selectBorder.dark',
							}}
							color={{
								_light: 'text.light',
								_dark: 'text.dark',
							}}>
							{value ? getNameById(value) : `Select ${label}`}
							<Icon
								name='select'
								size={20}
							/>
						</Flex>

						{/* <DataMenuButton value={value}></DataMenuButton> */}
					</Menu.Trigger>
					<Input
						ref={inputRef}
						required={isRequired}
						value={value}
						{...hiddenInputCss}
						{...props}
					/>
				</FormControl>

				<Menu.Positioner>
					<Menu.Content
						boxShadow='md'
						p={2}
						px={2}
						gap={2}
						borderRadius={radius?.MENU}
						bg={{ base: 'menu.light', _dark: 'menu.dark' }}
						borderWidth={1}
						borderColor={{ base: 'border.light', _dark: 'border.dark' }}
						{...props}>
						{menuBody}
					</Menu.Content>
				</Menu.Positioner>

				{/* <MenuContainer w={WIDTH}>{menuBody}</MenuContainer> */}
			</Menu.Root>
		</Flex>
	);
};

export default VDataMenu;
