import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/provider/AppProvider';

import 'swiper/css';
import { JetBrains_Mono, Outfit } from 'next/font/google';
import Script from 'next/script';
import { THEME_BOOT_SCRIPT } from '@/theme/themeBoot';

// The marketing website's type (mint-webpage): Outfit for everything, light
// weights; JetBrains Mono for labels. theme/index.ts reads the variables.
const outfit = Outfit({ subsets: ['latin'], weight: ['200', '300', '400', '500'], variable: '--font-outfit', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400'], variable: '--font-jetbrains', display: 'swap' });

export const metadata: Metadata = {
	// Pages set their own part ('Sign in' → 'Sign in · MINT'); panel pages set the
	// tab's title from Layout, with the project's name (panel.ts tabTitle).
	title: { default: 'MINT', template: '%s · MINT' },
	description: 'Your MINT workspace — projects, data, websites and APIs.',
};

export const viewport = {
	width: 'device-width',
	initialScale: 1,
	maximumScale: 1,
	userScalable: false,
	// The browser's own chrome (phones' address bar) in the page's colour, as on the website.
	themeColor: [
		{ media: '(prefers-color-scheme: light)', color: '#fbfbfd' },
		{ media: '(prefers-color-scheme: dark)', color: '#0d0d0d' },
	],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	// next-themes sets `className`/`style` on this tag after mount to match the
	// resolved color mode, which will never match the plain server markup —
	// that's expected, not a bug, so hydration warnings for this one element
	// are suppressed rather than "fixed" by faking SSR theme detection.
	// See https://github.com/pacocoursey/next-themes#with-app
	return (
		<html
			lang='en'
			className={`${outfit.variable} ${mono.variable}`}
			suppressHydrationWarning>
			{/* React Scan */}
			<head>
				{/* <script src='https://unpkg.com/react-scan/dist/auto.global.js' /> */}
				{/* rest of your scripts go under */}
				{/* The admin's colour theme, replayed from the last visit before
				    first paint (see theme/applyTheme.ts). next/script rather than a
				    bare <script>: React treats a plain one here as a hydration
				    mismatch. */}
				<Script
					id='admin-theme-boot'
					strategy='beforeInteractive'>
					{THEME_BOOT_SCRIPT}
				</Script>
			</head>
			<body>
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}
