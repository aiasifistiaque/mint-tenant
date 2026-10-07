'use client';
import { FC } from 'react';
import { Textarea, TextareaProps } from '@chakra-ui/react';
import { FormControl, styles } from '../..';

type InputContainerProps = TextareaProps & {
	label: string;
	isRequired?: boolean;
	helper?: string;
	placeholder?: any;
	// FormInput hands these to every field input; stripped before the DOM spread.
	formData?: any;
	setFormData?: any;
	setChangedData?: any;
};

const MIN_H = '180px';

const VTextarea: FC<InputContainerProps> = ({
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
	return (
		<FormControl
			isRequired={isRequired}
			label={label}
			helper={helper}>
			<Textarea
				onKeyDown={e => {
					if (e.key === 'Enter' && !e.shiftKey) {
						e.stopPropagation();
					}
				}}
				minH={MIN_H}
				size='sm'
				{...(styles.FIELD as TextareaProps)}
				py={2.5}
				lineHeight='1.6'
				resize='vertical'
				placeholder={placeholder ? placeholder : label}
				value={value}
				{...props}
			/>
		</FormControl>
	);
};

export default VTextarea;
