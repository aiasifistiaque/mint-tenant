type GetFontSize = {
	css: any;
	display: 'sm' | 'md' | 'lg' | 'xl';
};

type ReturnType = {
	base: String;
	md: String;
};

const getFontSize = ({ css, display }: GetFontSize): ReturnType => {
	const base = css?.fontSize?.base;
	const md = display == 'sm' ? css?.fontSize?.base : css?.fontSize?.md;

	return {
		base: `${base}px`,
		md: `${md}px`,
	};
};

export default getFontSize;
