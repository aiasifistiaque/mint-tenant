import React, { FC } from 'react';
import {
	getFieldValue,
	handleChange,
	handleImage,
	handleSwitch,
	handleImageArray,
	handleNestedImage,
	handleNestedString,
	FullEditor,
} from '../../..';

type FormMainType = {
	fields: any;
	formData: any;
	setFormData: any;
	setChangedData: any;
	isModal?: boolean;
	dataKey: string;
};

const EditorForm: FC<FormMainType> = ({
	fields,
	formData,
	setFormData,
	setChangedData,
	dataKey,
	isModal = false,
}) => {
	const getOnChangeHandler = (type: string, key?: string) => {
		const params = { formData, setFormData, setChangedData };

		switch (type) {
			case 'image':
				return (e: any) => handleImage({ e, dataKey: key || 'image', ...params });
			case 'video':
				return (e: any) => handleImage({ e, dataKey: key || 'image', ...params });
			case 'switch':
			case 'image-array':
				return (e: any, type?: string) =>
					handleImageArray({ e, dataKey: key || 'image', type, ...params });
			case 'checkbox':
				return (e: any) => handleSwitch({ e, ...params });
			case 'nested-image':
				return (e: any) => handleNestedImage({ e, dataKey: key || 'image', ...params });
			case 'nested-string':
				return (e: any) => handleNestedString({ e, ...params });
			case 'nested-select':
				return (e: any) => handleNestedString({ e, ...params });
			case 'nested-data-menu':
				return (e: any) => handleNestedString({ e, ...params });

			default:
				return (e: any) => handleChange({ e, ...params });
		}
	};

	return (
		<FullEditor
			onChange={getOnChangeHandler('editor')}
			name={dataKey}
			value={getFieldValue({ formData, name: dataKey })}
		/>
	);
};

export default EditorForm;
