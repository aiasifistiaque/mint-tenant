'use client';
import { useCallback, useState, FC } from 'react';
import {
	InputProps,
	Stack,
	IconButton,
	Tag,
	Wrap,
	WrapItem,
	TagLabel,
	Flex,
} from '@chakra-ui/react';
import { Label, Icon, HelperText, Align, useGetItemNameById, FormControl } from '../..';
import { VDataMenu, VInput, VSelect } from '.';

type InputContainerProps = InputProps & {
	label?: string;
	isRequired?: boolean;
	helper?: string;
	value: string[];
	placeholder?: any;
};

const VCatCollectionList: FC<InputContainerProps> = ({
	label,
	isRequired,
	placeholder,
	value,
	helper,
	...props
}) => {
	const [tag, setTag] = useState<{ type: string; id: string }>({
		type: '',
		id: '',
	});

	const handleChange = (e: any) => {
		const { name, value } = e.target;
		setTag(prevTag => ({ ...prevTag, [name]: value }));
	};

	const addTag = () => {
		if (!tag.type || !tag.id) return;

		const arr = Array.isArray(value) ? [...value] : [];

		// Check if tag already exists in the array
		// Check if tag already exists in the array using find
		if (arr.find((item: any) => item?.id == tag?.id)) {
			setTag({ type: '', id: '' });
			return; // Return early if the tag already exists
		}

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

		setTag({ type: '', id: '' });
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
			<Stack
				gap={2}
				w='full'>
				<Label>{label}</Label>

				<Stack
					gap={1}
					w='full'>
					<Flex
						gap={2}
						align='flex-end'>
						<Align
							gap={2}
							w='full'>
							<VSelect
								label='Type'
								value={tag?.type}
								name='type'
								onChange={handleChange}
								placeholder='Type'>
								<option value=''>Type</option>
								<option value='categories'>Category</option>
								<option value='collections'>Collection</option>
							</VSelect>
							{tag?.type ? (
								<VDataMenu
									model={tag?.type}
									label={tag?.type === 'categories' ? 'Category' : 'Collection'}
									value={tag?.id}
									name='id'
									onChange={handleChange}
								/>
							) : (
								<VInput
									label='Category/Collection'
									value={tag?.id}
									name='id'
									disabled={true}
								/>
							)}
						</Align>

						{/* <Input
							name='value'
							value={tag?.value}
							onChange={handleChange}
							placeholder='Attribute Value'
						/> */}

						<IconButton
							onClick={addTag}
							size='sm'
							colorPalette='gray'
							aria-label='add tag'>
							<Icon name='add' />
						</IconButton>
					</Flex>

					{helper && <HelperText>{helper}</HelperText>}
				</Stack>

				<Wrap
					gap={2}
					pt={2}>
					{value?.map((item: any, i: number) => (
						<WrapItem key={i}>
							<Tag.Root
								size='lg'
								borderRadius='md'>
								<Tag.Label>
									<TagName
										id={item?.id}
										path={item?.type}
									/>
								</Tag.Label>
								<Tag.CloseTrigger onClick={() => deleteTag(item)} />
							</Tag.Root>
						</WrapItem>
					))}
				</Wrap>
			</Stack>
		</FormControl>
	);
};

const TagName: FC<{ id: string; path: string }> = ({ id, path }) => {
	const { name, image } = useGetItemNameById({ id, path });
	return <>{name}</>;
};

export default VCatCollectionList;
