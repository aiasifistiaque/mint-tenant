import { InputProps, TextareaProps } from '@chakra-ui/react';
import { FC, useEffect } from 'react';

import VInput from '../../../utils/inputs/VInput';
import { InputDataType } from '../../../types';
import { useGetByIdQuery } from '../../../store/services/commonApi';
import { getFieldTypeDescriptor } from '@/components/library/fields/registry';
// WO-10 side effect: populates the registry. Importing it here (FormInput's
// only consumer today) is enough — see descriptors/index.ts for the dev-mode
// completeness check that guards against a type with no descriptor.
import '@/components/library/fields/registry/descriptors';

type Option = {
	label: string;
	value: string | number | boolean | readonly string[] | undefined;
};

type FormInputProps = InputProps &
	TextareaProps &
	any &
	any & {
		label: string;
		value: any;
		isRequired: boolean;
		type: InputDataType;
		options?: Option[];
		model?: string;
		dataModel?: any;
		item?: any;
		formData?: any;
		setFormData?: any;
		setChangedData?: any;
		helper?: string;
	};

// WO-11: FormInput.tsx used to be a 720-line / 55-case switch. It now just
// resolves a descriptor from the registry (WO-09/WO-10) and renders its input
// component — the per-type prop wiring that used to live in each case now
// lives in that type's descriptor adapter under fields/registry/descriptors/.
const FormInput: FC<FormInputProps> = ({
	isRequired,
	type = 'text',
	formData,
	setFormData,
	setChangedData,
	options,
	dataModel,
	item,
	helper,
	...props
}) => {
	const {
		path: fetchPath = null,
		id: fetchId = null,
		fields: fetchFields = null,
	} = item?.fetch ? item.fetch(formData) : {};

	const { data, isFetching, isSuccess } = useGetByIdQuery(
		{ path: fetchPath, id: fetchId },
		{ skip: !item?.fetch || !fetchPath || !fetchId }
	);

	useEffect(() => {
		if (isSuccess && !isFetching) {
			let newData: any = {};
			fetchFields.forEach((field: any) => {
				newData[field?.as] = data[field?.key];
			}, data);
			setFormData((prev: any) => ({ ...formData, ...newData }));
		}
	}, [isFetching]);

	const descriptor = getFieldTypeDescriptor(type);
	// Unregistered type (shouldn't happen — assertSchema warns at schema-authoring
	// time) falls back to a plain text input, matching FormInput's old `default`.
	const InputComponent = descriptor?.input || VInput;

	// `options`/`dataModel` are real call sites' way of saying `item?.options`/
	// `item?.dataModel` (FormMain.tsx passes both, always equal) — folding them
	// into `item` here, instead of also forwarding them as separate top-level
	// props, is deliberate: a descriptor whose adapter doesn't consume them
	// would otherwise re-spread them via its own `...props`, silently
	// overriding another explicit prop the adapter sets first in JSX (found via
	// the /docs/inputs demo route: 'font-size' crashed because its hardcoded
	// numeric `options` got clobbered this way).
	const resolvedItem = {
		...item,
		...(options !== undefined && { options: item?.options ?? options }),
		...(dataModel !== undefined && { dataModel: item?.dataModel ?? dataModel }),
	};

	return (
		<InputComponent
			isRequired={isRequired}
			type={type}
			formData={formData}
			setFormData={setFormData}
			setChangedData={setChangedData}
			item={resolvedItem}
			{...props}
		/>
	);
};

export default FormInput;
