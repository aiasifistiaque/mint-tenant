import Dropdown from '../../../cl/Dropdown';
import { SelectChild } from '../../../types';

const SelectInput = ({ children, placeholder, name, value, onChange, ...props }: SelectChild) => (
	<Dropdown
		size='sm'
		name={name}
		value={value}
		placeholder={placeholder || 'Select option'}
		onChange={v => onChange?.({ target: { name, value: v } })}
		{...props}>
		{children}
	</Dropdown>
);

export default SelectInput;
