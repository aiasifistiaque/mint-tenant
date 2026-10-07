import {
	handleImage,
	handleImageArray,
	handleSwitch,
	handleNestedImage,
	handleNestedString,
	handleChange,
} from '../utils/functions/handlers';

type Params = {
	formData?: any;
	setFormData: any;
	setChangedData: any;
	type: string;
	// Optional: every branch below already falls back (`key || 'image'`), and both
	// call sites declare it as `key?: string`.
	key?: string;
};

const getOnChangeHandler = ({ type, key, formData, setFormData, setChangedData }: Params) => {
	const params = { formData, setFormData, setChangedData };
	switch (type) {
		case 'image':
			return (e: any) => handleImage({ e, dataKey: key || 'image', ...params });
		// WO-12: 'icon'/'video' were only handled by FormMain.tsx's own duplicate of
		// this switch, not this shared one (which FormPage.tsx used instead) — so
		// icon/video fields silently broke on FormPage-shaped forms. Unified here.
		case 'icon':
			return (e: any) => handleImage({ e, dataKey: key || 'icon', ...params });
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

export default getOnChangeHandler;
