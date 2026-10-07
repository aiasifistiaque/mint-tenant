import { FC, ReactNode } from 'react';
import Dropdown, { DropdownProps } from '../../../cl/Dropdown';

type FilterSelectProps = Omit<DropdownProps, 'onChange' | 'value'> & {
	children: ReactNode;
	name?: string;
	value?: any;
	/** Called with `{ target: { name, value } }`, as a native select's change event was. */
	onChange?: (e: any) => void;
};

const FilterSelect: FC<FilterSelectProps> = ({ children, name, value, onChange, ...props }) => (
	<Dropdown
		size='sm'
		w='full'
		name={name}
		value={value}
		onChange={v => onChange?.({ target: { name, value: v } })}
		{...props}>
		{children}
	</Dropdown>
);

export default FilterSelect;
