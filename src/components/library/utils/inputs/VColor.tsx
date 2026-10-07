'use client';

import { FC, useEffect, useRef, useState } from 'react';
import { InputProps, Flex, Input, Box } from '@chakra-ui/react';
import { FormControl } from '.';
import { Icon } from '../../icon';
import { useColorMode } from '@/components/ui/color-mode';

type InputContainerProps = InputProps & {
	label: string;
	isRequired?: boolean;
	helper?: string;
	value: string | undefined;
	placeholder?: any;
	// FormInput hands these to every field input; stripped before the DOM spread.
	formData?: any;
	setFormData?: any;
	setChangedData?: any;
};

const VColor: FC<InputContainerProps> = ({
	label,
	isRequired,
	placeholder,
	value,
	helper,
	// FormInput's form-state props — not DOM attributes, so keep them out of `...props`.
	formData: _formData,
	setFormData: _setFormData,
	setChangedData: _setChangedData,
	...props
}) => {
	const [prevValue, setPrevValue] = useState(value);
	const onEyeClick = () => {
		if (value == 'transparent') {
			let changedValue;
			if (prevValue == 'transparent') {
				changedValue = '#000000';
			} else {
				changedValue = prevValue;
			}
			if (props.onChange) {
				const event = {
					target: {
						name: props.name,
						value: changedValue,
					},
				} as any;
				props.onChange(event);
			}
		} else {
			setPrevValue(value);
			if (props.onChange) {
				const event = {
					target: {
						name: props.name,
						value: 'transparent',
					},
				} as any;
				props.onChange(event);
			}
		}
	};

	useEffect(() => {
		if (value != 'transparent') {
			setPrevValue(value);
		}
	}, [value]);

	const ref = useRef<any>(null);
	const { colorMode } = useColorMode();

	return (
		<FormControl
			isRequired={isRequired}
			label={label}
			helper={helper}>
			<Flex
				gap={2}
				position='relative'
				alignItems='center'
				{...inputGroupCss(colorMode)}>
				<Box
					position='absolute'
					left={3}
					onClick={onEyeClick}
					cursor='pointer'
					zIndex={1}>
					<Flex cursor='pointer'>
						<Icon
							name={value == 'transparent' ? 'eye-off' : 'eye'}
							size={20}
						/>
					</Flex>
				</Box>
				<Input
					{...inputCss}
					placeholder={placeholder ? placeholder : label}
					value={value}
					{...props}
					type='text'
				/>
				<Box
					position='absolute'
					right={3}
					onClick={() => ref.current?.click()}
					cursor='pointer'
					zIndex={1}>
					<Flex
						borderWidth={1}
						borderColor='container.borderLight'
						w='24px'
						h='24px'
						bgColor={value || 'transparent'}
						borderRadius='full'
					/>
				</Box>
			</Flex>
			<Flex
				w='95%'
				borderBottomRadius='lg'
				bg={'transparent'}
				mx='auto'
				justify='flex-end'>
				<Input
					borderColor='transparent'
					ref={ref}
					w='0px'
					h='0px'
					type='color'
					placeholder={placeholder ? placeholder : label}
					value={value}
					{...props}
				/>
			</Flex>
		</FormControl>
	);
};

const inputGroupCss = (colorMode: string): any => ({
	borderRadius: 'lg',
	borderColor: 'border',
	borderWidth: 1,
});

const inputCss: any = {
	h: '32px',
	px: 3,
	paddingLeft: 10,
	paddingRight: 10,
	borderLeftRadius: 'lg',
	borderColor: 'transparent',
};

export default VColor;
