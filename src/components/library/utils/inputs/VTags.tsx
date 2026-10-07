'use client';
import { useCallback, useState, FC } from 'react';
import { Input, InputProps, IconButton, Flex } from '@chakra-ui/react';

import { Label, Icon, HelperText, FormControl, inputContainerCss } from '../..';
import { useColorMode } from '@/components/ui/color-mode';

type InputContainerProps = InputProps & {
	label: string;
	isRequired?: boolean;
	helper?: string;
	value: string[];
	placeholder?: any;
	lowercase?: boolean;
	section?: boolean;
};

const VTags: FC<InputContainerProps> = ({
	label,
	isRequired,
	placeholder,
	value,
	helper,
	lowercase = true,
	section = false,
	...props
}) => {
	const { colorMode } = useColorMode();
	const borderColor = 'accent.solid';
	const [tag, setTag] = useState<string>('');

	const handleChange = useCallback((e: any) => {
		if (section) {
			setTag(e.target.value);
		} else {
			if (lowercase) {
				const lowerCaseValue = e.target.value.toLowerCase().replace(/\s/g, '-');
				setTag(lowerCaseValue);
			} else {
				const lowerCaseValue = e.target.value.replace(/\s/g, '-');
				setTag(lowerCaseValue);
			}
		}
	}, []);

	const addTag = useCallback(() => {
		if (tag && tag.length > 0 && !value?.includes(tag)) {
			// const newArr = [...value, tag];
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
				props.onChange(event); // Call onChange with the synthetic event
			}
		}
		setTag('');
	}, [tag, props.onChange]); // Add props.onChange to the dependency array

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
					<Flex
						position='relative'
						alignItems='center'>
						<Input
							value={tag}
							onChange={handleChange}
							{...inputContainerCss}
							pr={0}
							placeholder={placeholder ? placeholder : label}
						/>
						{/* Spans the field rather than assuming its pixel height, so the
						    icon stays centred now that controls are 36px. */}
						<Flex
							position='absolute'
							right={2}
							h='full'
							alignItems='center'>
							<IconButton
								onClick={addTag}
								size='xs'
								color='accent.contrast'
								aria-label='add tag'>
								<Icon
									name='add'
									color='inherit'
								/>
							</IconButton>
						</Flex>
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
								px={2.5}
								py={1}
								bg={{ _light: 'transparent', _dark: 'bg.muted' }}
								border='1px solid'
								borderColor={{ _light: 'border.light', _dark: 'border.dark' }}
								borderRadius='md'
								alignItems='center'
								gap={2}>
								<Flex
									fontWeight='600'
									as='span'
									fontSize='xs'>
									{' '}
									{item}
								</Flex>
								<Flex
									as='button'
									onClick={() => deleteTag(item)}
									cursor='pointer'
									fontSize='lg'
									color={{ _light: 'text.light', _dark: 'text.dark' }}
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

export default VTags;
