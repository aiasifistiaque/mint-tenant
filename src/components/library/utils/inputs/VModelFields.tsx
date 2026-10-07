'use client';
import { useState, FC, useEffect } from 'react';
import { InputProps, Grid, Checkbox, Box, Flex } from '@chakra-ui/react';

import { Label, useGetByIdQuery, FormControl } from '../..';

type InputContainerProps = InputProps & {
	label: string;
	isRequired?: boolean;
	helper?: string;
	value: string[];
	placeholder?: any;
	lowercase?: boolean;
	section?: boolean;
	form?: any;
};

const VModelFields: FC<InputContainerProps> = ({
	label,
	isRequired,
	placeholder,
	value,
	helper,
	form,
	lowercase = true,
	section = false,
	...props
}) => {
	const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
	const [schema, setSchema] = useState<any>();

	useEffect(() => {
		if (form?.sch) {
			try {
				setSchema(form?.sch);
			} catch (error) {
				console.error('Error parsing schema JSON:', error);
			}
		}
	}, [form?.sch]);

	const { data, isFetching, isError } = useGetByIdQuery(
		{ path: `model/${schema}`, id: 'keys' },
		{ skip: !schema }
	);

	const addTag = (tag: string) => {
		if (!value?.includes(tag)) {
			let newArr = [];
			if (Array.isArray(value)) newArr = [...value, tag];
			else newArr = [tag];

			if (props.onChange) {
				const event = {
					target: {
						name: props.name,
						value: newArr,
					},
				} as any;
				props.onChange(event);
			}
		}
	};

	const deleteTag = (tagToDelete: string) => {
		const newArr = value.filter(tag => tag !== tagToDelete);
		if (props.onChange) {
			const event = {
				target: {
					name: props.name,
					value: newArr,
				},
			} as any;
			props.onChange(event);
		}
	};

	const handleDragStart = (e: React.DragEvent, index: number) => {
		setDraggedIndex(index);
		e.dataTransfer.effectAllowed = 'move';
		e.dataTransfer.setData('text/html', e.currentTarget.outerHTML);
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		e.dataTransfer.dropEffect = 'move';
	};

	const handleDrop = (e: React.DragEvent, dropIndex: number) => {
		e.preventDefault();

		if (draggedIndex === null || draggedIndex === dropIndex) {
			setDraggedIndex(null);
			return;
		}

		const newArr = [...value];
		const draggedItem = newArr[draggedIndex];

		// Remove the dragged item
		newArr.splice(draggedIndex, 1);
		// Insert it at the new position
		newArr.splice(dropIndex, 0, draggedItem);

		if (props.onChange) {
			const event = {
				target: {
					name: props.name,
					value: newArr,
				},
			} as any;
			props.onChange(event);
		}

		setDraggedIndex(null);
	};

	const handleDragEnd = () => {
		setDraggedIndex(null);
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
					flexWrap='wrap'
					mb={2}
					gap={1}
					pt={2}>
					{value?.map((item: string, i: number) => (
						<Flex key={i}>
							<Box
								draggable
								onDragStart={e => handleDragStart(e, i)}
								onDragOver={handleDragOver}
								onDrop={e => handleDrop(e, i)}
								onDragEnd={handleDragEnd}
								cursor='move'
								opacity={draggedIndex === i ? 0.5 : 1}
								transition='opacity 0.2s'
								_hover={{ transform: 'scale(1.02)' }}>
								<Flex
									px={2.5}
									py={1}
									bg='bg.muted'
									borderRadius='md'
									userSelect='none'
									alignItems='center'
									gap={2}>
									<Flex
										as='span'
										fontSize='sm'>
										{item}
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
							</Box>
						</Flex>
					))}
				</Flex>
				<Grid
					mb={2}
					gridTemplateColumns='1fr 1fr 1fr'
					gap={4}
					w='full'>
					{!isFetching &&
						data?.map((item: string, i: number) => (
							<Checkbox.Root
								key={i}
								checked={value?.includes(item)}
								onCheckedChange={e => (!value?.includes(item) ? addTag(item) : deleteTag(item))}
								{...titleCheckboxCss}>
								<Checkbox.HiddenInput />
								<Checkbox.Control />
								<Checkbox.Label>{item}</Checkbox.Label>
							</Checkbox.Root>
						))}
				</Grid>
			</Flex>
		</FormControl>
	);
};

const titleCheckboxCss: any = {
	colorPalette: 'brand',
	size: 'md',
	fontSize: '16px',
	fontWeight: '500',
};

export default VModelFields;
