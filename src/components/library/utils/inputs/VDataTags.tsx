'use client';
import React, { useCallback, useState } from 'react';
import { InputProps, IconButton, Flex } from '@chakra-ui/react';

import { useGetSelectDataQuery, FormControl } from '../../';
import { Label, SelectContainer, HelperText, Icon } from '../..';

type InputContainerProps = InputProps & {
	label: string;
	isRequired?: boolean;
	helper?: string;
	value: string[];
	model: string;
	placeholder?: any;
	item?: any;
	valueKey?: string;
	/** @deprecated use valueKey */
	valKey?: string;
	labelKey?: string;
};

const VDataTags: React.FC<InputContainerProps> = ({
	label,
	isRequired,
	placeholder,
	value,
	helper,
	model,
	item,
	// valKey = '_id',
	// labelKey = 'name',
	...props
}) => {
	const [tag, setTag] = useState<string>('');
	const { data } = useGetSelectDataQuery(model);

	// WO-05: valueKey is what createFormFields emits; valKey kept as a deprecated fallback.
	const valKey = item?.valueKey || item?.valKey || '_id';
	const labelKey = item?.labelKey || 'name';

	const addTag = useCallback(() => {
		if (tag && tag?.length > 0 && !value?.includes(tag)) {
			let newArr = [];
			if (Array.isArray(value)) newArr = [...value, tag];
			else newArr = [tag];

			if (props.onChange) {
				const event = {
					target: {
						name: props?.name,
						value: newArr,
					},
				} as any;
				props.onChange(event); // Call onChange with the synthetic event
			}
		}
		setTag('');
	}, [tag, props.onChange]); // Add props.onChange to the dependency array

	const handleChange = useCallback((e: any) => {
		// const lowerCaseValue = e.target.value.toLowerCase().replace(/\s/g, '-');
		setTag(e.target.value);
	}, []);

	const deleteTag = useCallback(
		(tagToDelete: string) => {
			const newArr = value.filter(tag => tag !== tagToDelete);
			if (props.onChange) {
				const event = {
					target: {
						name: props?.name,
						value: newArr,
					},
				} as any;
				props.onChange(event); // Call onChange with the synthetic event
			}
		},
		[value, props.onChange]
	); // Add value and props.onChange to the dependency array

	const getNameById = (id: string) => {
		const ite = data?.doc?.find((item: any) => item[valKey] === id);
		const addOnValue = item?.modelAddOn && ite?.[item?.modelAddOn];
		const addOnText = addOnValue ? `(${addOnValue})` : '';

		const displayValue = valKey == '_id' ? ite?.[labelKey] : id;

		return `${displayValue}${addOnText}` || id;
	};

	return (
		<FormControl
			isRequired={isRequired}
			gap={4}>
			<Flex
				flexDir='column'
				gap={2}
				w='full'>
				<Label>{label}</Label>

				<Flex
					flexDir='column'
					gap={1}
					w='full'>
					<Flex
						align='center'
						gap={2}>
						<SelectContainer
							value={tag}
							onChange={handleChange}>
							<option value=''>Select {model}</option>
							{data &&
								data?.doc?.map((ite: any, i: number) => (
									<option
										disabled={value?.includes(ite[valKey])}
										key={i}
										value={ite[valKey]}>
										{ite[labelKey]}
									</option>
								))}
						</SelectContainer>

						<IconButton
							onClick={addTag}
							size='sm'
							variant='outline'
							// colorPalette='gray'
							aria-label='add tag'>
							<Icon
								name='add'
								size={20}
							/>
						</IconButton>
					</Flex>

					{helper && <HelperText>{helper}</HelperText>}
				</Flex>
				<Flex
					flexWrap='wrap'
					gap={1}
					pt={2}>
					{value?.map((item: string, i: number) => (
						<Flex key={i}>
							<Flex
								colorPalette='gray'
								px={2.5}
								py={1}
								bg='bg.muted'
								borderRadius='md'
								alignItems='center'
								gap={2}>
								<Flex
									as='span'
									fontSize='sm'>
									{getNameById(item)}
								</Flex>
								<Flex
									color='fg'
									as='button'
									onClick={() => deleteTag(item)}
									cursor='pointer'
									fontSize='lg'
									opacity={0.7}
									_hover={{ opacity: 1 }}>
									×
								</Flex>
							</Flex>
						</Flex>
					))}
				</Flex>
			</Flex>
		</FormControl>
	);
};

export default VDataTags;
