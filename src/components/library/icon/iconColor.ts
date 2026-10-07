import { system } from '@/theme';

// `text.selected`, `red.500`, `fg.muted` — a Chakra colour token rather than a
// CSS colour (`red`, `#333`, `currentColor`, `inherit`).
const TOKEN = /^[a-zA-Z]+(\.[a-zA-Z0-9]+)+$/;

/**
 * A colour for an icon's CSS `color`. The icon components hand colours to
 * plain SVG, which can't read Chakra token names: a token becomes its CSS
 * variable, so it follows the colour mode and the admin's colour theme.
 * Anything else passes through; nothing means inherit the text colour.
 */
const iconColor = (color?: string) => {
	if (!color) return undefined;
	return TOKEN.test(color) ? system.token.var(`colors.${color}`, color) : color;
};

export default iconColor;
