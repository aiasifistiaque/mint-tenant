import { Handler } from '.';

const handleSwitch = ({ e, setFormData, setChangedData, formData }: Handler) => {
	setFormData({ ...formData, [e.target.name]: e.target.checked });
	setChangedData((prevState: any) => ({ ...prevState, [e.target.name]: e.target.checked }));
};

export default handleSwitch;
