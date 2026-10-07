import { IS_TENANT_PANEL } from './panel';

/**
 * Where the sign-in token is kept in localStorage. The tenant panel's keys are
 * fixed and its own — NEXT_PUBLIC_TOKEN_NAME / REFRESH_TOKEN only set the
 * super-admin panel's — so the two panels never share a session, even on one
 * origin (localhost) or when the tenant deployment copies the admin's env.
 */
export const TOKEN_NAME: string = IS_TENANT_PANEL
	? 'MINT_TENANT_TOKEN'
	: process.env.NEXT_PUBLIC_TOKEN_NAME || 'MINT_CAFE_TOKEN_TWO';

export const REFRESH_TOKEN: string = IS_TENANT_PANEL
	? 'MINT_TENANT_REFRESH_TOKEN'
	: process.env.REFRESH_TOKEN || 'THINKCRYPT_ERP_REFRESH_TOKEN_TEST_ONE';

export const STORE: string = process.env.NEXT_PUBLIC_STORE || '6587157f9b62eb0e74c9f2ef';

export const CART_NAME: string =
	process.env.NEXT_PUBLIC_CART_NAME || 'THINKCRYPT_ERP_CART_TEST_ONE';

export const PLACEHOLDER_IMAGE =
	process.env.PLACEHOLDER_IMAGE ||
	'https://img.freepik.com/free-vector/illustration-gallery-icon_53876-27002.jpg?size=626&ext=jpg&ga=GA1.1.1412446893.1704931200&semt=ais';

export const URL = {
	backend: process.env.NEXT_PUBLIC_BACKEND || 'http://localhost:5000',
	api: process.env.NEXT_PUBLIC_BACKEND || 'http://localhost:5000',
};

export const currency = {
	code: 'BDT',
	symbol: '৳',
};

const BASE_SIDEBAR_WIDTH = '248px';
const BASE_SIDEBAR_WIDTH_SMALL = '20PX';

export const BODY_PT = '72px';

export const sizes = {
	SIDEBAR_WIDTH: BASE_SIDEBAR_WIDTH,
	HOME_NAV_MAX_WIDTH: `calc(100vw - ${BASE_SIDEBAR_WIDTH})`,
	HOME_NAV_SMALL_SCREEN_WIDTH: `calc(100vw - ${'20px + 32px'})`,
	HOME_NAV_LEFT: BASE_SIDEBAR_WIDTH,
	PADDING_X_BASE: 4,
	PADDING_X_MD: 6,
	PADDING_X_LG: 6,
	POPOVER_WIDTH: '260px',
	RADIUS_MENU: 'lg',
	POS_MAX_HEIGHT: '75vh',
	POS_RATIO: '8fr 2fr',
	POS_RATIO_BASE: '6fr 1fr',
	NAV_HEIGHT: 14,
	CARD_RADIUS: '16px',
	SIDEBAR_PX: 3,
	// Drives the whole toolbar row — search field, refresh, preferences, sort and
	// the filter chips all read this, so they stay one height. 36px is Chakra's
	// `sm` control height, which is what the buttons beside the search field
	// resolve to; the row sat at 38px before that and left the field a couple of
	// pixels proud of its neighbours.
	SEARCH_BAR_HEIGHT: '36px',
	CONTROL_HEIGHT: '36px',
	CONTROL_HEIGHT_SM: '30px',
};

export const shadow = {
	MENU: '0 10px 32px -8px rgba(0, 0, 0, 0.18), 0 2px 6px -2px rgba(0, 0, 0, 0.08)',
	CARD: '0 1px 2px rgba(0, 0, 0, 0.06), 0 4px 12px -4px rgba(0, 0, 0, 0.08)',
	DASH: '0px 0px 1px rgba(0,0,0,.08), 0px 2px 2px 0px rgba(0, 0, 0, 0.04)',
	// Modals sit on a dimmed backdrop, so they need depth without the heavy
	// black halo that `2xl` casts over a light page.
	MODAL: '0 16px 48px -12px rgba(0, 0, 0, 0.22), 0 4px 12px -4px rgba(0, 0, 0, 0.1)',
	MODAL_DARK: '0 16px 48px -12px rgba(0, 0, 0, 0.7)',
	SUBTLE: '0 1px 2px rgba(0, 0, 0, 0.05)',
};

export const padding = {
	BASE: sizes.PADDING_X_BASE,
	MD: sizes.PADDING_X_MD,
	LG: sizes.PADDING_X_LG,
	// Clears the fixed sidebar header (h: NAV_HEIGHT = 56px).
	BODY_TOP: '56px',
	// Sits on top of BODY_TOP to drop the sidebar's search field onto the top
	// edge of the first block in the main column rather than onto the navbar:
	// 4px MainBody `pt` + 12px of page padding. It belongs to the search field's
	// own sticky wrapper, not to the body, so the wrapper's opaque background
	// covers this band too and rows scrolling past never show through it.
	SIDEBAR_SEARCH_TOP: '16px',
	CONTAINER: {
		BASE: 4,
		MD: 8,
		LG: 8,
	},
};

export const zIndex = {
	NAV: 999,
	SIDEBAR: 998,
};

// One radius ramp. The old values ran 4px for containers and buttons against
// 10px for menus, so nested chrome never shared a corner.
// The marketing website's corners: rounded panels (16px), soft dialogs and
// menus, pill buttons, 12px fields.
export const radius = {
	CONTAINER: '16px',
	MODAL: '20px',
	MENU: '16px',
	MENU_INNER: '10px',

	BUTTON: '9999px',
	INPUT: '12px',
	SELECT_CONTAINER: '12px',
	FILTER: '9999px',
	PILL: '9999px',
};

export const styles = {
	backdropFilter: 'blur(5px)',
	BACKDROP_FILTER: 'blur(5px)',
	BLUR_CONTAINER: {
		backdropFilter: 'blur(10px)',
		bg: 'navbar.blurLight',
	},
	MODAL_BLUR: {
		bg: 'menu.blurLight',
		_dark: { bg: 'menu.blurDark' },
		backdropFilter: 'blur(10px)',
	},
	NAVBAR: {
		h: sizes.NAV_HEIGHT || 12,
		alignItems: 'center',
		bg: 'navbar.light',
		backdropFilter: 'blur(5px)',
		borderBottomWidth: 1,
		zIndex: zIndex.NAV || 999,
		borderBottomColor: 'navbar.border.light',
		color: 'navbar.text.light',
		_dark: {
			color: 'navbar.text.dark',
			bg: 'navbar.dark',
			borderBottomColor: 'navbar.border.dark',
		},
	},
	SIDEBAR_NAV: {
		h: sizes.NAV_HEIGHT || 12,
		alignItems: 'center',
		// Glass, like the page navbar: a translucent fill with the content
		// behind it blurred. The fill has to be translucent for the filter to do
		// anything — this carried `blur(5px)` over an opaque `sidebar.header`
		// for a long time and rendered as a plain white bar.
		bg: 'sidebar.headerBlur.light',
		backdropFilter: 'blur(16px)',
		borderBottomWidth: 1,
		zIndex: zIndex.NAV || 999,
		borderColor: 'sidebar.borderBottom.light',
		_dark: {
			bg: 'sidebar.headerBlur.dark',
			borderColor: 'sidebar.borderBottom.dark',
		},
	},
	bigInput: {
		borderRadius: radius.INPUT,
		_light: {
			borderColor: 'container.borderLight',
		},
	},
	color: {
		MODAL_OVERLAY: {
			// A near-white scrim over a near-white page did no separating at all.
			LIGHT: 'rgba(17, 17, 17, 0.44)',
			DARK: 'rgba(0, 0, 0, 0.7)',
		},
	},
	// Shared form-control surface. Spread this instead of restating border,
	// radius and focus colours on each input.
	//
	// 13px, matching the table cells and the Heroku panels' body text. At 14px
	// the drawer's inputs sat a step larger than the data they were editing,
	// which is what made a form opened over a table read as a different app.
	FIELD: {
		bg: 'field.bg',
		color: 'fg',
		borderWidth: 1,
		borderColor: 'field.border',
		borderRadius: radius.INPUT,
		fontSize: '13px',
		transitionProperty: 'border-color, box-shadow, background-color',
		transitionDuration: '150ms',
		transitionTimingFunction: 'cubic-bezier(.4, 0, .2, 1)',
		_placeholder: { fontSize: '13px', color: 'field.placeholder' },
		_hover: { borderColor: 'field.borderHover' },
		_focusVisible: {
			borderColor: 'field.focusRing',
			boxShadow: '0 0 0 1px var(--chakra-colors-field-focus-ring)',
			outline: 'none',
		},
		_disabled: { bg: 'bg.subtle', opacity: 0.6, cursor: 'not-allowed' },
	},
	BORDER: {
		_light: {
			borderColor: 'container.borderLight',
			borderWidth: 1,
		},
		borderRadius: radius.CONTAINER,
	},
	// Every button in a modal or drawer footer — Cancel / Discard and the
	// Save / Confirm / Create beside it — so the pair is always one size.
	// DiscardButton, ModalSubmitButton and ConfirmButton use it; a footer's own
	// Button spreads it (`{...styles.MODAL_BUTTON}`). Taller on phones, where the
	// primary button spans the sheet.
	MODAL_BUTTON: {
		size: 'sm',
		h: { base: '40px', md: '36px' },
		minW: '84px',
		px: 4,
		fontSize: '13px',
		fontWeight: '400',
		borderRadius: radius.BUTTON,
	},
	// Every modal's footer (ModalFooter): a hairline, a tinted ledge, the
	// actions on the right — padded like the header, and no more.
	MODAL_FOOTER: {
		w: 'full',
		gap: 2,
		px: 4,
		py: 3,
		borderTopWidth: 1,
		borderColor: 'border.muted',
		bg: 'bg.subtle',
		justifyContent: 'flex-end',
		alignItems: 'center',
		flexWrap: 'wrap',
		// Buttons put straight in a footer come out one size too, even one a
		// dialog styled by hand (size xs, px 2…) — the mismatched pairs were all
		// hand-sized primaries next to a DiscardButton.
		css: {
			'& > button': {
				h: { base: '40px', md: '36px' },
				minW: '84px',
				px: 4,
				fontSize: '13px',
				fontWeight: '500',
			},
		},
	},
	MODAL: {
		bg: 'menu.light',
		borderWidth: 1,
		borderColor: 'border.muted',
		_dark: {
			bg: 'menu.dark',
			borderColor: 'border',
			boxShadow: shadow.MODAL_DARK,
		},
		borderRadius: radius.MODAL,
		boxShadow: shadow.MODAL,
		overflow: 'hidden',
		// Chakra's inside-scroll default is `calc(100% - 120px)`; go to the full
		// 90% of the viewport so long forms get the room before they scroll.
		maxH: '90vh',
	},
	DRAWER: {
		bg: 'menu.light',
		_dark: {
			bg: 'menu.dark',
		},
		// As tall as its content, up to 85% of the visible screen: `size='full'`
		// otherwise pins the sheet at 100dvh, and `vh` counts the area behind a
		// phone's address bar — either way the sheet ran to the top edge.
		h: 'auto',
		maxH: '85dvh',
		userSelect: 'none',
		borderTopRadius: '20px',
		boxShadow: shadow.MODAL,
	},
	// The desktop "modal layout: drawer" preference — a right-hand panel
	// instead of the bottom sheet above, so full height and no top radius.
	DRAWER_END: {
		bg: 'menu.light',
		// A hairline against the page, the same one the panels and tables use.
		// The shadow alone left the drawer's edge indistinct over a light page.
		borderLeftWidth: 1,
		borderColor: 'border',
		_dark: {
			bg: 'menu.dark',
			borderColor: 'border',
		},
		h: '100vh',
		maxH: '100vh',
		boxShadow: shadow.MODAL,
	},
	CONTAINER: {
		RADIUS: {
			borderRadius: radius.CONTAINER,
		},
		SHADOW: {
			boxShadow: shadow.DASH,
		},
		BG: {
			bg: 'container.newLight',
			_dark: {
				bg: 'menu.dark',
			},
		},
		BORDER: {
			borderWidth: 1,
			borderColor: 'container.borderLight',
			_dark: {
				borderColor: 'container.borderDark',
			},
		},
	},
	STAT_CONTAINER: {
		borderRadius: radius.CONTAINER,
		alignItems: 'center',
		w: 'full',
		p: 4,
		bg: 'container.newLight',
		borderColor: 'container.borderLight',
		borderWidth: 1,
		boxShadow: shadow.DASH,
		_dark: {
			bg: 'menu.dark',
			borderColor: 'container.borderDark',
		} as any,
	},
};

// export const color = {
// 	MODDAL_OVERLAY: {
// 		LIGHT: 'rgba(250, 250, 250, .8)',
// 	},
// };

export const BASE_LIMIT = 16;

export const THEME: 'basic' | 'fancy' = 'basic';
