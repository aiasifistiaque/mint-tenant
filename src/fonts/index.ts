import localFont from 'next/font/local';

// The website's type, shipped with the app: next/font/google fetches Google's
// CSS at build time, and when Google answers with its newer font addresses
// (fonts.gstatic.com/l/font?kit=…&skey=…) Next 16.0.10's Turbopack can't read
// them and the build fails. Latin only, as before; Outfit is one variable file.
export const outfit = localFont({
	src: './outfit-latin.woff2',
	weight: '100 900',
	variable: '--font-outfit',
	display: 'swap',
});

export const mono = localFont({
	src: './jetbrains-mono-latin-400.woff2',
	weight: '400',
	variable: '--font-jetbrains',
	display: 'swap',
});
