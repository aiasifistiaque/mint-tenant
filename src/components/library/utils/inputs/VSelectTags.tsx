'use client';
import React, { useCallback } from 'react';
import { InputProps, Flex } from '@chakra-ui/react';

import { Label, HelperText, FormControl } from '../..';
import Dropdown from '../../cl/Dropdown';

type InputContainerProps = InputProps & {
	label: string;
	isRequired?: boolean;
	helper?: string;
	value: string[];
	placeholder?: any;
	options?: { label: string; value: string }[] | string[];
};

const VSelectTags: React.FC<InputContainerProps> = ({
	label,
	isRequired,
	placeholder,
	value,
	helper,
	options,
	...props
}) => {
	// Picking an option adds it at once. The values are the options' own, as
	// given — a model's allowed values are case-sensitive.
	const addTag = useCallback(
		(tag: string) => {
			if (!tag || value?.includes(tag)) return;
			const newArr = Array.isArray(value) ? [...value, tag] : [tag];
			props.onChange?.({ target: { name: props.name, value: newArr } } as any);
		},
		[value, props.onChange, props.name]
	);

	const deleteTag = useCallback(
		(tagToDelete: string) => {
			const newArr = value.filter(tag => tag !== tagToDelete);
			if (props.onChange) {
				const event = {
					target: {
						name: props.name,
						value: newArr,
					},
				} as any;
				props.onChange(event); // Call onChange with the synthetic event
			}
		},
		[value, props.onChange]
	); // Add value and props.onChange to the dependency array

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
					<Dropdown
						size='sm'
						borderRadius='lg'
						flex={1}
						value=''
						placeholder={placeholder || 'Add…'}
						onChange={addTag}>
						{options?.map((option: any, i: number) => (
							<option
								disabled={value?.includes(option?.value ?? option)}
								key={i}
								value={option?.value ?? option}>
								{option?.label || option?.value || option}
							</option>
						))}
					</Dropdown>

					{helper && <HelperText>{helper}</HelperText>}
				</Flex>
				<Flex
					flexWrap='wrap'
					gap={1}
					pt={2}>
					{value?.map((item: string, i: number) => (
						<Flex key={i}>
							<Flex
								px={2.5}
								py={1}
								bg='bg.muted'
								borderRadius='md'
								alignItems='center'
								gap={2}>
								<Flex
									as='span'
									fontSize='sm'>
									{(options as any[])?.find((o: any) => (o?.value ?? o) === item)?.label || item}
								</Flex>
								<Flex
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

export default VSelectTags;
