import { radius } from '../../../';
import { InputProps } from '@chakra-ui/react';

export const MAX_H = '260px';

export const WIDTH = { base: '300px', md: '340px' };

export const hiddenInputCss: InputProps = {
	h: '1px',
	color: 'transparent',
	// focusBorderColor: 'transparent',
	border: 'none',
};

export const searchCss: InputProps = {
	borderRadius: 0,
	size: 'sm',
	px: 4,
	h: '40px',
	// focusBorderColor: 'transparent',
	border: 'none',
	placeholder: 'Search',
};

export const searchInputCss: InputProps = {
	borderRadius: 0,
	size: 'sm',
	px: 4,
	h: '40px',
	// focusBorderColor: 'transparent',
	border: 'none',
	placeholder: 'Search',
	borderTopRadius: radius?.MENU,
	borderColor: 'transparent',
	_focus: { borderColor: 'transparent', border: 'none' },
	_dark: { _placeholder: { color: 'text.dark' } },
};

export const unselectTextCss: any = {
	fontWeight: '400',
	fontSize: '12px',
	textStyle: 'italic',
	w: WIDTH,
};
