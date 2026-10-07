import { Handler } from '.';

const handleImageDeleteFromArray = ({
	e,
	dataKey,
	formData,
	setFormData,
	setChangedData,
}: Handler & { dataKey: string }) => {
	setChangedData((prevState: any) => {
		const updatedData = Array.isArray(prevState[dataKey])
			? prevState[dataKey].filter((item: any) => item !== e)
			: [];
		return { ...prevState, [dataKey]: updatedData };
	});

	setFormData((prevState: any) => {
		const updatedData = Array.isArray(prevState[dataKey])
			? prevState[dataKey].filter((item: any) => item !== e)
			: [];
		return { ...formData, [dataKey]: updatedData };
	});
};

export default handleImageDeleteFromArray;
