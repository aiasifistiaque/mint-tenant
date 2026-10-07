'use client';
import { useCallback, useState, FC, ChangeEvent } from 'react';
import { InputProps, IconButton, Flex } from '@chakra-ui/react';
import { Label, Icon, HelperText, FormControl } from '../..';
import { Input } from '.';

type InputContainerProps = InputProps & {
	label: string;
	isRequired?: boolean;
	helper?: string;
	value: string[];
	placeholder?: any;
};

const VCustomAttributes: FC<InputContainerProps> = ({
	label,
	isRequired,
	placeholder,
	value,
	helper,
	...props
}) => {
	const [tag, setTag] = useState<{ label: string; value: string }>({
		label: '',
		value: '',
	});

	const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setTag(prevTag => ({ ...prevTag, [name]: value }));
	};

	const addTag = () => {
		if (!tag.label || !tag.value) return;
		const newArr = [...(Array.isArray(value) ? value : []), tag];
		if (props.onChange) {
			const event = {
				target: {
					name: props.name,
					value: newArr,
				},
			} as any;
			props.onChange(event); // Call onChange with the synthetic event
		}

		setTag({ label: '', value: '' });
	}; // Add props.onChange to the dependency array

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
					<Flex gap={2}>
						<Input
							name='label'
							value={tag?.label}
							onChange={handleChange}
							placeholder='Attribute Title'
						/>
						<Input
							name='value'
							value={tag?.value}
							onChange={handleChange}
							placeholder='Attribute Value'
						/>

						<IconButton
							onClick={addTag}
							size='sm'
							colorPalette='gray'
							aria-label='add tag'>
							<Icon name='add' />
						</IconButton>
					</Flex>

					{helper && <HelperText>{helper}</HelperText>}
				</Flex>

				<Flex
					flexWrap='wrap'
					gap={2}
					pt={2}>
					{value?.map((item: any, i: number) => (
						<Flex key={i}>
							<Flex
								colorPalette='gray'
								borderRadius='md'
								px={3}
								py={1.5}
								bg='bg.muted'
								alignItems='center'
								gap={2}>
								<Flex as='span'>
									{item?.label}: {item?.value}
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

export default VCustomAttributes;
