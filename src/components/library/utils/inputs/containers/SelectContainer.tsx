'use client';
import { FC, ReactNode } from 'react';
import Dropdown, { DropdownProps } from '../../../cl/Dropdown';

type InputContainerProps = Omit<DropdownProps, 'onChange' | 'value'> & {
	children: ReactNode;
	size?: 'sm' | 'md' | 'lg' | 'xs';
	name?: string;
	value?: any;
	/** Called with `{ target: { name, value } }`, as a native select's change event was. */
	onChange?: (e: any) => void;
};

const SelectContainer: FC<InputContainerProps> = ({ children, size = 'sm', name, value, onChange, ...props }) => (
	<Dropdown
		size={size}
		w='full'
		name={name}
		value={value}
		onChange={v => onChange?.({ target: { name, value: v } })}
		{...props}>
		{children}
	</Dropdown>
);

export default SelectContainer;
