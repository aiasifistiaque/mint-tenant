'use client';

import { FC, useEffect, useRef } from 'react';
import { InputProps } from '@chakra-ui/react';
import { FormControl } from '../..';
import { Input } from '.';

type InputContainerProps = InputProps & {
	label: string;
	isRequired?: boolean;
	helper?: string;
	value: string;
	placeholder?: any;
	onChange: any;
	/** An address (uid) field's source (docs/cms D2): a new record's slug follows it until typed by hand. */
	slugFrom?: string;
	// FormInput hands these to every field input; stripped before the DOM spread.
	formData?: any;
	setFormData?: any;
	setChangedData?: any;
};

/** The address a value makes — as the server makes it (dynamicModels uidOf). */
const toSlug = (v: string) =>
	v
		.normalize('NFKD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.replace(/[^\p{L}\p{M}\p{N}]+/gu, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 120);

const VSlug: FC<InputContainerProps> = ({
	label,
	isRequired,
	placeholder,
	value,
	helper,
	onChange,
	slugFrom,
	// FormInput's form-state props — not DOM attributes, so keep them out of `...props`.
	formData,
	setFormData: _setFormData,
	setChangedData: _setChangedData,
	...props
}) => {
	// A new record's address follows its source field while it's still the one made from it; an
	// existing record's never moves on its own (its address may already be linked to).
	const source = slugFrom ? formData?.[slugFrom] : undefined;
	const editing = !!formData?._id;
	const made = useRef<string | null>(null);
	useEffect(() => {
		if (!slugFrom || editing || typeof source !== 'string') return;
		const next = toSlug(source);
		if ((!value || value === made.current) && next !== value) onChange({ target: { name: props.name, value: next } });
		made.current = next;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [source]);

	const handleChange = (e: any) => {
		const lowerCaseValue = e.target.value.toLowerCase().replace(/\s/g, '-');
		onChange({
			target: {
				name: props.name,
				value: lowerCaseValue,
			},
		});
	};
	return (
		<FormControl
			isRequired={isRequired}
			label={label}
			helper={helper || (slugFrom && !editing ? 'Made from the record’s name as you type — change it to pick your own.' : undefined)}>
			<Input
				placeholder={placeholder ? placeholder : label}
				value={value ?? ''}
				onChange={handleChange}
				{...props}
			/>
		</FormControl>
	);
};

export default VSlug;
