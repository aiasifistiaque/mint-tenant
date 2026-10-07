'use client';

import { FC, useState } from 'react';
import { IconButton, InputGroup, InputProps } from '@chakra-ui/react';
import { Eye, EyeOff } from 'lucide-react';
import { FormControl, Input } from '.';

type Props = InputProps & {
	label: string;
	isRequired?: boolean;
	helper?: string;
	value: string | number | undefined;
	placeholder?: any;
	// FormInput hands these to every field input; stripped before the DOM spread.
	formData?: any;
	setFormData?: any;
	setChangedData?: any;
};

/**
 * A password field with an eye to show what's been typed, so a long one can
 * be checked before saving. Not saved by the browser as the admin's own login
 * (`autoComplete='new-password'`).
 */
const VPassword: FC<Props> = ({
	label,
	isRequired,
	placeholder,
	value,
	helper,
	formData: _formData,
	setFormData: _setFormData,
	setChangedData: _setChangedData,
	...props
}) => {
	const [shown, setShown] = useState(false);
	return (
		<FormControl
			isRequired={isRequired}
			label={label}
			helper={helper}>
			<InputGroup
				endElementProps={{ pe: 1 }}
				endElement={
					<IconButton
						type='button'
						size='2xs'
						variant='ghost'
						color='fg.muted'
						_hover={{ color: 'fg', bg: 'bg.muted' }}
						aria-label={shown ? 'Hide password' : 'Show password'}
						aria-pressed={shown}
						title={shown ? 'Hide' : 'Show'}
						onClick={() => setShown(s => !s)}>
						{shown ? <EyeOff size={14} /> : <Eye size={14} />}
					</IconButton>
				}>
				<Input
					size='sm'
					px={3}
					pe={9}
					type={shown ? 'text' : 'password'}
					autoComplete='new-password'
					spellCheck={false}
					placeholder={placeholder ? placeholder : label}
					value={value ?? ''}
					{...props}
				/>
			</InputGroup>
		</FormControl>
	);
};

export default VPassword;
