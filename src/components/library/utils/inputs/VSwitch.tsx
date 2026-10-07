'use client';
import { FC } from 'react';
import { Switch } from '@chakra-ui/react';

import { Label, FormControl } from '../..';

type InputContainerProps = {
	label: string;
	isRequired?: boolean;
	helper?: string;
	value?: boolean | undefined;
	placeholder?: any;
	onChange?: any;
	name?: string;
};

const VSwitch: FC<InputContainerProps> = ({
	label,
	isRequired,
	placeholder,
	value,
	helper,
	...props
}) => {
	return (
		<FormControl
			display='flex'
			gap={4}
			alignItems='center'
			isRequired={isRequired}>
			<Label>{label}</Label>
			<Switch.Root
				checked={value}
				colorPalette='brand'
				onCheckedChange={details => {
					if (props.onChange) {
						const event = {
							target: {
								name: props.name,
								checked: details.checked,
							},
						} as any;
						props.onChange(event);
					}
				}}>
				<Switch.HiddenInput id='email-alerts' />
				<Switch.Control>
					<Switch.Thumb />
				</Switch.Control>
			</Switch.Root>
		</FormControl>
	);
};

export default VSwitch;
