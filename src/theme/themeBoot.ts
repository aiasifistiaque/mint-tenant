/**
 * Where the active theme's stylesheet lives, and the script that replays it
 * before first paint. Kept free of imports: app/layout.tsx is a server
 * component and only needs these strings, not the Chakra system that
 * applyTheme.ts builds the stylesheet from.
 */

export const THEME_STYLE_ID = 'admin-theme';
export const THEME_CSS_KEY = 'admin-theme-css';

/** Replays the last theme before React loads, so a reload doesn't flash the default colours. */
export const THEME_BOOT_SCRIPT = `try{var c=localStorage.getItem('${THEME_CSS_KEY}');if(c){var s=document.createElement('style');s.id='${THEME_STYLE_ID}';s.textContent=c;document.head.appendChild(s)}}catch(e){}`;
