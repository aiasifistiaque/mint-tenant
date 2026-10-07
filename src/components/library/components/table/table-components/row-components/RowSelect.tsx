'use client';
import { FC, ReactNode } from 'react';
import Dropdown from '../../../../cl/Dropdown';

type InputContainerProps = any & {
	children: ReactNode;
};

/** Called with `{ target: { name, value } }`, as a native select's change event was. */
const RowSelect: FC<InputContainerProps> = ({ children, name, value, onChange, ...props }) => (
	<Dropdown
		size={{ base: 'md', md: 'sm' }}
		minW='100px'
		name={name}
		value={value}
		onChange={v => onChange?.({ target: { name, value: v } })}
		{...props}>
		{children}
	</Dropdown>
);

export default RowSelect;
