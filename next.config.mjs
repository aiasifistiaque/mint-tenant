import { readdirSync } from 'fs';
import { fileURLToPath } from 'url';

// The app's top-level pages (src/app/<page>). In the tenant panel a first
// segment that isn't one of them is a project: /<project>/<page> (src/proxy.ts,
// panel.ts). Read here so the list never falls behind the folders.
const APP_PAGES = readdirSync(fileURLToPath(new URL('./src/app', import.meta.url)), { withFileTypes: true })
	.filter(d => d.isDirectory() && /^[a-z0-9]/.test(d.name))
	.map(d => d.name);

// The user guides moved to their own site (mint-docs). Same paths without the
// /user-docs prefix and the same #anchors, so every old link and bookmark lands
// on the same section (the browser keeps the #anchor across a redirect).
const DOCS_URL = (process.env.NEXT_PUBLIC_DOCS_URL || 'https://docs.mintapp.shop').replace(/\/+$/, '');

/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: false,
	env: { NEXT_PUBLIC_APP_PAGES: APP_PAGES.join(',') },
	// No image optimizer (billed per image on Vercel): plain <img> / Chakra Image only.
	images: { unoptimized: true },
	async redirects() {
		return [
			{ source: '/user-docs', destination: DOCS_URL, permanent: false },
			{ source: '/user-docs/:path*', destination: `${DOCS_URL}/:path*`, permanent: false },
		];
	},
	experimental: {
		// Turbopack's production scope hoisting (Next 16.0.10) miscompiles the
		// library barrels: a merged module imports a re-exported component via
		// the barrel's own module id, so e.g. `VInput` from '@/components/library'
		// is `barrel.default` = undefined (React #130, blank /auth/login). Which
		// export breaks moves around as imports change. Dev never hoists, so it
		// only shows after `next build`. Re-test before removing on a Next upgrade.
		turbopackScopeHoisting: false,
	},
	turbopack: {
		root: fileURLToPath(new URL('.', import.meta.url)),
		rules: {
			'*.svg': {
				loaders: ['@svgr/webpack'],
				as: '*.js',
			},
		},
	},
	webpack: (config, { webpack }) => {
		config.cache = true;

		// Handle Quill modules
		config.module.rules.push({
			test: /\.svg$/,
			use: ['@svgr/webpack'],
		});

		// Ignore specific modules that cause issues
		config.resolve.fallback = {
			...config.resolve.fallback,
			fs: false,
		};

		return config;
	},
};

export default nextConfig;
