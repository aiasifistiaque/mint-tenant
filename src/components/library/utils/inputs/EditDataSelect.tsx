'use client';

import { Menu, Flex, Input, InputProps, Button } from '@chakra-ui/react';

import { useState, FC, useRef, useEffect } from 'react';

import { hiddenInputCss, searchInputCss, unselectTextCss, MAX_H, WIDTH } from './VDataMenu/styles';

import {
	DataMenuButton,
	CreateModal,
	HelperText,
	MenuContainer,
	MenuItem,
	ItemOfDataMenu,
	FormControl,
} from '../..';

import { useGetAllQuery } from '../../store';

type VDataMenuProps = InputProps & {
	isRequired?: boolean;
	placeholder?: string;
	value: any;
	helper?: string;
	dataPath: string;
	dataModel?: any;
};

const EditDataSelect: FC<VDataMenuProps> = ({
	isRequired,
	placeholder,
	value,
	helper,
	dataPath: model,
	dataModel,
	...props
}) => {
	// const { onOpen, onClose, open:isOpen } = useDisclosure();

	const menuClose = () => {
		setSearch('');
	};

	const [title, setTitle] = useState<string>(`Select option`);
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
					value: e._id,
				},
			} as any;

			props.onChange(event);
		}
		setTitle(e?.name);
	};

	const renderMenuItems = data?.doc?.map((item: any, i: number) => (
		<ItemOfDataMenu
			cursor='pointer'
			id={item?._id}
			key={i}
			onClick={() => handleChange(item)}>
			{item?.name}
		</ItemOfDataMenu>
	));

	const getNameById = (id: string | undefined) => {
		const item = data?.doc?.find((item: any) => item._id === id);
		return item?.name || id;
	};

	const inputRef = useRef<any>(null);
	const searchInputRef = useRef<any>(null);
	const btnRef = useRef<any>(null);

	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [testt, setTestt] = useState('no');

	useEffect(() => {
		if (isFetching) return;
		if (isMenuOpen)
			setTimeout(() => {
				searchInputRef?.current?.focus();
			}, 10);
	}, [isMenuOpen, searchInputRef, isFetching]);

	return (
		<>
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
			<Menu.Root
				onOpenChange={e => {
					setIsMenuOpen(e.open);
					if (!e.open) menuClose();
				}}>
				<FormControl
					isRequired={isRequired}
					gap={4}>
					<Flex
						flexDir='column'
						gap={2}
						w='full'>
						<Flex
							flexDir='column'
							gap={1}
							w='full'>
							<DataMenuButton value={value}>
								{value ? getNameById(value) : `Select option`}
							</DataMenuButton>
							<Input
								ref={inputRef}
								required={isRequired}
								value={value}
								{...hiddenInputCss}
								{...props}
							/>
						</Flex>

						{helper && <HelperText>{helper}</HelperText>}
					</Flex>
				</FormControl>

				<MenuContainer
					w={WIDTH}
					py={0}>
					<Input
						{...searchInputCss}
						ref={searchInputRef}
						value={search}
						onChange={handleSearch}
					/>

					<Menu.Separator
						py={0}
						my={0}
					/>
					{dataModel && (
						<>
							<MenuItem onClick={() => btnRef.current.click()}>Add new {model}</MenuItem>
							<Menu.Separator mb={0} />
						</>
					)}
					<Flex
						flexDir='column'
						w='100%'
						maxH={MAX_H}
						overflowY='scroll'>
						<MenuItem
							{...unselectTextCss}
							w={WIDTH}
							onClick={() => handleChange({ name: ``, _id: undefined })}>
							Unselect
						</MenuItem>
						{renderMenuItems}
					</Flex>
				</MenuContainer>
			</Menu.Root>
		</>
	);
};

export default EditDataSelect;
