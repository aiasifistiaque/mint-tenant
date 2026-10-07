import { ChangeEvent } from 'react';

import { FilterInput } from '../../..';

const DatePicker = ({ value, setVal }: { value: string; setVal: (val: string) => void }) => {
	const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
		setVal(e.target.value);
	};

	return (
		<FilterInput
			date
			value={value}
			onChange={handleChange}
		/>
	);
};

export default DatePicker;
