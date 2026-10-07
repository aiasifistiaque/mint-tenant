import { DEFAULT_THEME, themeById } from './palettes';
import { LEGACY_TOKENS, PAIRS, SEMANTIC, valueOf } from './roles';

// import { THEME } from '../components/library';

const THEME: 'basic' | 'fancy' = 'basic';

const RICH_BLACK = '#0E131F';
const DARK = '#0E0E0E';

const PRIMARY = 'black';

const BORDER_LIGHT = '#e4e4e4';
const BORDER_DARK = '#222';

// const SAGE = '#B5BD89';
const SAGE = 'whitesmoke';
const THIRSTLE = '#D0C4DF';

//const BLACK = '#1f1f1f';
const BLACK = '#171717';

export const colors: any = {
	// A real neutral ramp. The legacy `gray` scale below is collapsed onto a
	// handful of brand values, so Chakra's semantic layer can't derive anything
	// usable from it — the semantic tokens in theme/index.ts point here instead.
	neutral: {
		50: '#fafafa',
		100: '#f5f5f5',
		200: '#ebebeb',
		300: '#e0e0e0',
		400: '#a3a3a3',
		500: '#737373',
		600: '#525252',
		700: '#404040',
		800: '#262626',
		900: '#171717',
		950: '#0a0a0a',
	},

	// Form controls share one surface so an input, a select and a textarea read
	// as the same kind of thing.
	field: {
		bg: {
			light: '#fff',
			dark: '#0A0A0A',
		},
		border: {
			light: BORDER_LIGHT,
			dark: BORDER_DARK,
		},
		borderHover: {
			light: '#d4d4d4',
			dark: '#333',
		},
		placeholder: {
			light: '#a3a3a3',
			dark: '#6b6b6b',
		},
		focusRing: {
			light: '#171717',
			dark: '#d4d4d4',
		},
	},


	brand: {
		// 100: 'red',
		// light: '#635BFF',
		light: '#40234A',
		dark: SAGE,
		200: SAGE,
		// 300: 'blue',
		// 400: 'teal',
		//500: '#635BFF',
		// 500: '#171717',
		500: PRIMARY,
		// 600: 'darkslateblue',
		600: '#34163F',
	},

	red: {
		// 500: '#A5292f',
		// 100: 'green',
		// 200: 'blue',
		// 300: 'teal',
		// 400: 'slateblue',
		500: '#EA001C',
		600: '#EA001C',
		// 700: 'yellow',
		// 800: 'orange',
		// 900: 'tomato',
		//#EA001C
	},
	// black: test,
	// white: test,
	// blackAlpha: test,
	hover: {
		light: 'whitesmoke',
		dark: BLACK,
	},
	background: {
		100: '#f1f1f1',
		400: '#f8f6f3',
		500: '#fff',
		200: BLACK,
		blurLight: 'rgba(250, 250, 250, .4)',
		// light: THEME == 'basic' ? '#fafafa' : '#f1f1f1',
		// //dark: BLACK,
		// dark: THEME == 'basic' ? BLACK : '#121212',

		light: '#fafafa',
		cardLight: '#F5F5F5',
		cardDark: 'black',
		//dark: BLACK,
		//dark: BLACK,
		dark: 'black',
	},

	stroke: {
		light: 'transparent',
		//light: '#fff',
		dark: 'transparent',
		deepL: '#ebebeb',
		deepD: 'transparent',
	},
	pos: {
		light: '#ebebeb',
		dark: DARK,
	},

	card: {
		light: 'white',
		dark: BLACK,
	},

	header: {
		light: '#fff',
		//dark: BLACK,
		dark: 'black',
		200: 'whitesmoke',
		500: '#414552',
	},
	button: {
		primary: {
			textLight: '#fff',
			textDark: '#edededn',
			bgLight: '#fafafa',
			bgDark: PRIMARY,
			hoverLight: '#583D60',
			hoverDark: '#583D60',
		},

		secondary: {
			borderLight: BORDER_LIGHT,
			borderDark: BORDER_DARK,
			textLight: PRIMARY,
			textDark: '#fafafa',
			bgLight: '#fff',
			bgDark: '#0A0A0A',
			hoverLight: '#583D60',
			hoverDark: '#222',
		},
	},
	text: {
		// light: '#40234A',
		formLabel: {
			light: PRIMARY,
			dark: '#fafafa',
		},

		heading: {
			light: PRIMARY,
			dark: '#fafafa',
		},
		inputPlaceholder: {
			light: '#666',
			dark: '#444',
		},
		secondary: {
			light: '#666',
			dark: '#a1a1a1',
		},
		light: '#222',
		dark: '#ededed',
		shade: '#666',
		200: '#fff',
		300: '#fff',
		// 400: '#4a4a4a',
		400: 'blue',
		// 500: '#171717',
		// 500: 'blue',
		500: PRIMARY,
		selected: '#4a4a4a',
		selectedDark: SAGE,
	},
	sidebar: {
		//light: '#F3F3EF',
		light: '#fafafa',
		dark: '#000',
		header: {
			light: '#fff',
			dark: '#0a0a0a',
		},
		/**
		 * The glass version of the header, for the fixed logo strip and the
		 * sticky search box.
		 *
		 * Translucent on purpose: `backdrop-filter` has nothing to reveal behind
		 * an opaque background, which is why `styles.SIDEBAR_NAV` carried a blur
		 * for months with no visible effect. The alpha is higher than the
		 * navbar's 0.4 because sidebar rows pass *directly* beneath this strip —
		 * at the navbar's value their text stayed legible through it and read as
		 * a rendering fault rather than as glass.
		 */
		headerBlur: {
			light: 'rgba(255, 255, 255, 0.55)',
			dark: 'rgba(10, 10, 10, 0.55)',
		},
		borderBottom: {
			light: '#ebebeb',
			dark: BORDER_DARK,
		},
		selectedItemBorder: {
			light: '#ebebeb',
			dark: '#222',
		},
		selectedItemBg: {
			light: '#fff',
			dark: '#0a0a0a',
		},
		hover: {
			bgLight: '#fff',
			bgDark: 'transparent',
		},
		// Row fills: a faint wash on hover, a soft grey for the current page.
		// Themes derive both from the item text mixed into the sidebar colour
		// (applyTheme), so they stay quiet on every palette.
		itemHover: {
			light: '#f4f4f4',
			dark: '#0e0e0e',
		},
		itemActive: {
			light: '#eeeeee',
			dark: '#171717',
		},
		// The vertical line down an expanded category. It has to sit a step
		// lighter than the item text or it competes with the labels it is
		// grouping — it marks the branch, it isn't content.
		rail: {
			light: '#e4e4e4',
			dark: '#222',
		},
		// The hover underline. A step darker than the rail: the rail is a long
		// continuous line and reads fine at #e4e4e4, but a short underline under
		// one label at that value is invisible against the sidebar's own
		// near-white. Still clearly faded against the selected row's #222.
		hoverUnderline: {
			light: '#c2c2c2',
			dark: '#3d3d3d',
		},

		headerText: {
			// light: '#111',na
			// dark: '#fafafa',
			light: '#222',
			dark: '#fafafa',
		},
		bodyText: {
			// light: '#111',
			// dark: '#fafafa',
			light: '#4a4a4a',
			dark: '#a1a1a1',
			headingLight: '#222',
			headingDark: '#a1a1a1',
			selectedLight: '#222',
			selectedDark: '#fafafa',
		},

		//dark: DARK,

		darker: '#121212',
		hoverLight: '#ebebeb',
		hoverDark: '#141414',
		headingBorderDark: BORDER_DARK,
	},

	sidebarItem: {
		light: 'transparent',
		dark: 'transparent',
		lightSelect: 'transparent',
		darkSelect: '#0A0A0A',
		lightHover: 'transparent',
		darkhover: 'transparent',
		textLight: 'transparent',
		textDark: '#ededed',
	},

	menu: {
		light: '#fff',
		dark: '#0A0A0A',
		blurLight: 'rgba(255, 255, 255, 0.4)',
		blurDark: 'rgba(0, 0, 0, .8)',
		overlayDark: 'rgba(10, 10, 10, .9)',
	},
	navbar: {
		400: BLACK,
		text: {
			light: '#222',
			dark: '#ebebeb',
		},
		light: 'rgba(255, 255, 255, 0.4)',
		blurLight: 'rgba(255, 255, 255, 0.4)',
		blurDark: 'rgba(0, 0, 0, 1)',
		dark: '#0A0A0A',
		800: BLACK,
		borderBottomLight: '#ebebeb',
		borderBottomDark: BORDER_DARK,
		border: {
			light: '#ebebeb',
			dark: '#222',
		},
	},
	border: {
		//light: '#F3F3EF',
		light: BORDER_LIGHT,
		secondary_light: '#aeaeae',
		dark: '#222',
		secondary_dark: '#5a5a5a',
	},
	container: {
		light: '#fff',
		dark: '#0A0A0A',
		newLight: '#fff',
		newDark: DARK,
		borderLight: BORDER_LIGHT,
		borderDark: BORDER_DARK,
		borderDarker: '#111',
	},
	green: {
		500: '#000',
		600: '#000',
	},
	//black: { 500: BLACK, 600: BLACK, 700: BLACK, 800: BLACK, 900: BLACK, 200: BLACK },
	gray: {
		50: 'white',
		100: BORDER_LIGHT,
		200: BORDER_LIGHT, //input borders
		300: PRIMARY,
		400: PRIMARY,
		500: '#222',
		600: PRIMARY,
		700: PRIMARY,
		800: 'black', //initial bg color of the load of colormode
		900: 'black',
		950: 'black',
	},
	image: {
		50: '#ececec', //Primary For Light Mode
		100: '#ddd', //Primary Hover For Light Mode
		200: '#ccc', //Hover For Light Mode
		800: '#444',
		900: '#111', //Primary For Dark Mode
	},

	result: {
		bg: {
			light: '#fafafa',
			dark: 'black',
		},
		border: {
			light: 'transparent',
			dark: 'transparent',
		},
	},

	'table.innerBorder.light': '#ebebeb',
	'table.innerBorder.dark': BORDER_DARK,

	table: {
		light: THEME == 'basic' ? 'transparent' : '#fff',
		dark: THEME == 'basic' ? 'transparent' : DARK,
		bgLight: '#fff',
		bgDark: '#0A0A0A',

		bg: {
			light: '#fff',
			dark: '#0A0A0A',
		},
		cardBorder: {
			light: '#ebebeb',
			dark: BORDER_DARK,
		},
		innerBorder: {
			light: '#ebebeb',
			dark: BORDER_DARK,
		},
		outerBorder: {
			light: '#ebebeb',
			dark: BORDER_DARK,
		},
		head: {
			// Deliberately the same as the row background rather than a tinted
			// band: the header should read as a label row separated by its bottom
			// rule, not as a filled strip sitting on top of the data.
			//
			// It still has to be *opaque*, though — the header is `position:
			// sticky`, so a transparent one lets rows scroll through it and the
			// labels end up printed over the data.
			bgLight: '#fff',
			bgDark: '#0A0A0A',
			textDark: '#8f8f8f',
			// Column labels are small uppercase text; muted keeps them from
			// competing with the data underneath.
			textLight: '#6b6b6b',
		},
		row: {
			light: 'white',
			dark: '#0A0A0A',
			// Row hover — a tint just strong enough to track a row across wide
			// tables without reading as a selection.
			hoverLight: '#f7f7f7',
			hoverDark: '#151515',
		},
	},
	// Legacy alias for the form-control border. It used to be #ebebeb, a shade
	// lighter than every input beside it, so a select in a drawer had a visibly
	// fainter outline than the text field above it. Kept as a name (six call
	// sites still reference it) but pointed at the same value as `field.border`.
	selectBorder: {
		light: BORDER_LIGHT,
		dark: BORDER_DARK,
	},
	//ecom-commers
	white: {
		200: '#f5f5f5',
		500: '#ffffff',
		600: '#202020',
	},
	eblack: {
		200: '#202020',
	},
	etext: {
		400: '#676767',
		600: '#202020',
	},
	heading: {
		light: '#222',
		lightMuted: '#666',
		dark: '#ededed',
		darkMuted: '#888',
	},
	eborder: {
		light: '#ebebeb',
		dark: BORDER_DARK,
	},
};

//ecom-colors

/**
 * The built-in look is the MINT website's (palettes.ts, the 'default' theme):
 * every paired token the panel's chrome reads takes its role's value from
 * that palette — the same mapping applyTheme.ts uses for the other themes.
 */
const setToken = (path: string, value: string) => {
	if (path in colors) colors[path] = value;
	const keys = path.split('.');
	let node = colors;
	keys.slice(0, -1).forEach(k => {
		if (typeof node[k] !== 'object' || node[k] === null) node[k] = {};
		node = node[k];
	});
	node[keys[keys.length - 1]] = value;
};

const { light, dark } = themeById(DEFAULT_THEME);
PAIRS.forEach(([l, d, v]) => {
	setToken(l, valueOf(v, light));
	setToken(d, valueOf(v, dark));
});
LEGACY_TOKENS.forEach(token => {
	const entry = SEMANTIC.find(([t]) => t === token);
	if (entry) setToken(token, valueOf(entry[1], light));
});

export default colors;
