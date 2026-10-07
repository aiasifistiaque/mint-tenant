'use client';
import { FC } from 'react';
import {
	Input,
	InputProps,
	Stack,
	Text,
	Flex,
	Textarea,
	TextareaProps,
	TextProps,
	Grid,
} from '@chakra-ui/react';
import { useColorMode } from '@/components/ui/color-mode';
import { Price } from '..';
import Dropdown from '../cl/Dropdown';

type InputContainerProps = {
	label: string;
	isRequired?: boolean;
	helper?: string;
	value: any;
	valueType?: 'input' | 'textarea' | 'select' | 'text' | 'price';
	options?: any;
	onChange?: any;
	placeholder?: string;
	disabled?: boolean;
	isDisabled?: boolean;
	type?: string;
};

const FONT_SIZE = '1rem';
const FONT_WEIGHT = '600';
const M = 0;

const PosInput: FC<InputContainerProps> = ({
	label,
	isRequired,
	placeholder,
	value,
	helper,
	valueType = 'input',
	options,
	...props
}) => {
	const { colorMode } = useColorMode();
	const borderColor = 'accent.solid';
	const textColor = 'fg';

	return (
		<Grid
			gridTemplateColumns='1fr 1fr'
			gap={2}
			w='full'>
			<Flex align='center'>
				<Text
					m='0'
					fontSize={FONT_SIZE}
					fontWeight={FONT_WEIGHT}>
					{label}
				</Text>
			</Flex>

			<Stack
				gap={1}
				w='full'>
				{valueType == 'text' ? (
					<Flex
						justify='space-between'
						w='full'
						align='center'
						justifyContent='flex-end'>
						<Text fontWeight='600'>{value}</Text>
					</Flex>
				) : valueType == 'price' ? (
					<Flex
						justify='space-between'
						w='full'
						align='center'
						justifyContent='flex-end'>
						<Text fontWeight='600'>
							<Price>{value}</Price>
						</Text>
					</Flex>
				) : valueType == 'textarea' ? (
					<Textarea
						height='200px'
						size='md'
						px={3}
						borderRadius='sm'
						color={textColor}
						placeholder={placeholder ? placeholder : label}
						value={value}
						disabled={props.disabled || props.isDisabled}
						onChange={props.onChange}
					/>
				) : valueType == 'select' ? (
					<Dropdown
						size='md'
						disabled={props.disabled || props.isDisabled}
						px={3}
						borderRadius='sm'
						color={textColor}
						value={value}
						onChange={v => props.onChange({ target: { value: v } } as any)}>
						{options?.map((option: any) => (
							<option
								key={option}
								value={option}>
								{option}
							</option>
						))}
					</Dropdown>
				) : (
					<Input
						size='md'
						px={3}
						borderRadius='sm'
						color={textColor}
						placeholder={placeholder ? placeholder : label}
						value={value}
						type={props.type || 'number'}
						disabled={props.disabled || props.isDisabled}
						onChange={props.onChange}
					/>
				)}
			</Stack>
		</Grid>
	);
};

export default PosInput;
