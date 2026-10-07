'use client';
import { FC } from 'react';
import { InputProps, Checkbox, Grid, Flex, GridProps, FlexProps } from '@chakra-ui/react';
import { useGetQuery } from '../..';

type VDataMenuProps = InputProps & {
	label: string;
	isRequired?: boolean;
	placeholder?: string;
	value: any;
	helper?: string;
	model?: string;
	dataModel?: any;
	options: any;
};

const VPermissions: FC<VDataMenuProps> = ({
	label,
	isRequired,
	placeholder,
	value,
	helper,
	model,
	dataModel,
	options,
	...props
}) => {
	const { data, isFetching } = useGetQuery({ path: 'permissionlist' });

	const addPermission = (item: string, isChecked: boolean) => {
		const currentValue = value || [];

		if (isChecked) {
			if (!currentValue.includes(item)) {
				const newArr = [...currentValue, item];
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
		} else {
			const newArr = currentValue.filter((tag: string) => tag !== item);
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
	};

	// Handle "select all" checkbox for a permission group
	const handleSelectAllChange = (item: any, isChecked: boolean) => {
		const fieldValues = item.fields.map((field: any) => field.value);
		let updatedPermissions: string[];
		const currentValue = value || [];

		if (isChecked) {
			// Add all field values that aren't already selected
			const newPermissions = fieldValues.filter((val: any) => !currentValue.includes(val));
			updatedPermissions = [...currentValue, ...newPermissions];
		} else {
			// Remove all field values for this group
			updatedPermissions = currentValue.filter(
				(permission: any) => !fieldValues.includes(permission)
			);
		}
		if (props?.onChange) {
			const event = {
				target: {
					name: props.name,
					value: updatedPermissions,
				},
			} as any;

			props.onChange(event);
		}
	};

	// Check if all fields in a group are selected
	const areAllFieldsSelected = (item: any): boolean => {
		return item.fields.every((field: any) => value?.includes(field.value));
	};

	// Check if some (but not all) fields in a group are selected
	const areSomeFieldsSelected = (item: any): boolean => {
		const selectedCount = item.fields.filter((field: any) => value?.includes(field.value)).length;
		return selectedCount > 0 && selectedCount < item.fields.length;
	};

	return (
		<Grid {...containerGridCss}>
			{data &&
				data?.map((item: any, i: number) => (
					<Flex
						{...sectionColumnCss}
						borderColor={areAllFieldsSelected(item) ? 'accent.solid' : 'border'}
						_dark={{
							borderColor: areAllFieldsSelected(item) ? 'border.light' : 'border.dark',
						}}
						key={i}>
						<Checkbox.Root
							checked={areAllFieldsSelected(item)}
							indeterminate={areSomeFieldsSelected(item)}
							onCheckedChange={(e: any) => handleSelectAllChange(item, e.checked)}
							{...titleCheckboxCss}>
							<Checkbox.HiddenInput />
							<Checkbox.Control />
							<Checkbox.Label>{item?.title}</Checkbox.Label>
						</Checkbox.Root>
						<Grid {...itemGridCss}>
							{item?.fields?.map((field: any, j: number) => (
								<ItemCheckbox
									key={j}
									isSelected={value?.includes(field?.value)}
									id={field?.value}
									onCheckedChange={(e: any) => addPermission(field?.value, e.checked)}>
									{field?.label}
								</ItemCheckbox>
							))}
						</Grid>
					</Flex>
				))}
		</Grid>
	);
};

const ItemCheckbox = ({ isSelected, children, ...props }: any) => (
	<Checkbox.Root
		{...itemCheckboxCss(isSelected)}
		checked={isSelected}
		{...props}>
		<Checkbox.HiddenInput />
		<Checkbox.Control />
		<Checkbox.Label>
			{children} {isSelected ? '(+)' : ''}
		</Checkbox.Label>
	</Checkbox.Root>
);

const itemCheckboxCss = (isSelected: boolean): any => {
	return {
		px: 3,
		py: 1.5,
		borderRadius: 'full',
		border: '1px solid',
		size: 'sm',
		colorPalette: 'brand',
		fontWeight: isSelected ? '600' : '400',
		borderColor: isSelected ? 'accent.solid' : 'border',
		bg: isSelected ? 'background.light' : 'transparent',
		_dark: {
			borderColor: isSelected ? 'border.light' : 'border.dark',
			bg: isSelected ? 'background.dark' : 'transparent',
		},
	};
};

const containerGridCss: GridProps = {
	rowGap: 4,
	columnGap: 4,
	gridTemplateColumns: { base: '1fr', md: '1fr 1fr' },
	w: '100%',
};

const sectionColumnCss: FlexProps = {
	p: 4,
	gap: 3,
	flexDir: 'column',
	border: '1px solid',
	borderColor: 'border.light',
	_dark: {
		borderColor: 'border.dark',
	},
	borderRadius: 'lg',
};

const titleCheckboxCss: any = {
	colorPalette: 'brand',
	size: 'md',
	fontSize: '16px',
	fontWeight: '500',
};

const itemGridCss: GridProps = {
	gridTemplateColumns: '1fr 1fr',
	rowGap: 2,
	columnGap: 2,
	w: '100%',
};

export default VPermissions;
