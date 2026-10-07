import { FC, useEffect, useState } from 'react';

import { Flex, Heading, Input } from '@chakra-ui/react';
import { HelperText, Label, radius, FormControl } from '../../';
import { Table } from '@chakra-ui/react';

type FormDataType = {
	value: any;
	onChange: any;
	isRequired?: boolean;
	label?: string;
	helper?: string;
	isDisabled?: boolean;
	name: any;
	hasImage?: boolean;
	limit?: number;
	section?: any;
	form?: any;
};

const VVariant: FC<FormDataType> = ({
	value,
	onChange,
	isRequired = false,
	label,
	helper,
	isDisabled = false,
	name,
	limit = 999,
	form,
	section,
	...props
}) => {
	const { colors, sizes } = form || {};
	const [variants, setVariants] = useState(value || []);

	useEffect(() => {
		let variantArr: any = [];
		if (colors?.length === 0 || sizes?.length === 0) {
			value?.forEach((v: any) => variantArr.push(v)); // Keep existing variants
			setVariants(variantArr);
			onChange({
				target: {
					name,
					value: variantArr,
				},
			});
			return;
		}
		if (Array.isArray(colors) && Array.isArray(sizes)) {
			colors.forEach((color: string) => {
				sizes.forEach((size: string) => {
					const variantName = `${size}-${color}`;
					const existingVariant = value.find(
						(v: any) => v.name.toLowerCase() === variantName.toLowerCase()
					);
					if (existingVariant) {
						variantArr.push(existingVariant);
					} else {
						variantArr.push({
							name: variantName,
							price: form?.price,
							cost: form?.cost,
							stock: 0,
							sku: '',
							images: [...(form?.images ? [form?.images] : [])],

							attributes: [
								{ label: 'color', value: color },
								{ label: 'size', value: size },
							],
						});
					}
				});
			});
		}
		setVariants(variantArr);
		onChange({
			target: {
				name,
				value: variantArr,
			},
		});
	}, [form?.colors, form?.sizes]);

	const onVariantValueChange = (index: number, field: string, fieldValue: any) => {
		const updatedVariants = [...value];
		updatedVariants[index] = {
			...updatedVariants[index],
			[field]: fieldValue,
		};
		setVariants(updatedVariants);
		onChange({
			target: {
				name,
				value: updatedVariants,
			},
		});
	};

	return (
		<FormControl isRequired={isRequired}>
			<Flex
				flexDir='column'
				w='full'
				gap={2}>
				<Label fontSize='22px'>{label}</Label>
				<Flex
					flexDir='column'
					gap={4}
					my={4}>
					<Flex
						w='full'
						align='center'
						gap={6}>
						<Flex
							flexDir='column'
							gap={4}
							w='full'>
							<Heading size='sm'>Manage Product Variations</Heading>
							<Flex gap={1}>
								<Flex
									overflowX='auto'
									w='full'>
									<Table.Root
										borderRadius={radius?.MODAL}
										borderWidth={1}>
										<Table.Header>
											<Table.Row>
												<Table.ColumnHeader>Name</Table.ColumnHeader>
												<Table.ColumnHeader textAlign='right'>Cost Price</Table.ColumnHeader>
												<Table.ColumnHeader textAlign='right'>Sell Price</Table.ColumnHeader>
												<Table.ColumnHeader textAlign='right'>Stock</Table.ColumnHeader>
											</Table.Row>
										</Table.Header>
										<Table.Body>
											{value?.map((item: any, i: number) => (
												<Table.Row key={i}>
													<Table.Cell fontWeight='600'>{item?.name}:</Table.Cell>
													<Table.Cell textAlign='right'>
														<Input
															size='sm'
															value={item?.cost}
															name='cost'
															onChange={e => onVariantValueChange(i, 'cost', e.target.value)}
														/>
													</Table.Cell>
													<Table.Cell textAlign='right'>
														<Input
															size='sm'
															value={item?.price}
															name='price'
															onChange={e => onVariantValueChange(i, 'price', e.target.value)}
														/>
													</Table.Cell>
													<Table.Cell textAlign='right'>
														<Input
															size='sm'
															value={item?.stock}
															name='stock'
															onChange={e => onVariantValueChange(i, 'stock', e.target.value)}
														/>
													</Table.Cell>
												</Table.Row>
											))}
										</Table.Body>
									</Table.Root>
								</Flex>
							</Flex>
						</Flex>
					</Flex>
				</Flex>

				{helper && <HelperText>{helper}</HelperText>}
			</Flex>
		</FormControl>
	);
};

export default VVariant;
