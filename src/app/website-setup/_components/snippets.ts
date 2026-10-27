/**
 * The code on Website setup, filled in for this project: its site API
 * address, its project key and its domain. One set per framework; the same
 * calls as the site API guide (mint-docs /websites#site-api) and the MCP's
 * describe_website recipe (backend website.tools.ts), with the same
 * variable names (MINT_API, MINT_API_KEY, NEXT_PUBLIC_… and VITE_…).
 */

export type Framework = 'site' | 'html' | 'react' | 'next';

export type Filled = {
	/** The site API: <origin>/public/api */
	api: string;
	/** The backend's root, where track.js is served */
	origin: string;
	/** The project key (mint_pk_…) */
	key: string;
	/** The site's domain, without https:// */
	domain: string;
};

export type Snippet = { label: string; file?: string; code: string };

export type Step = {
	id: string;
	title: string;
	/** Plain words above the code. */
	lead: string;
	snippets: Snippet[];
	/** Short notes under the code. */
	notes?: string[];
	/** Places in the panel this step happens in. */
	links?: { label: string; href: string }[];
};

/* ----------------------------------------------------------- shared */

const trackTag = ({ origin, key }: Filled) => `<script src="${origin}/public/track.js" data-key="${key}" defer></script>`;

const robotsUrl = ({ api, key }: Filled) => `${api}/site/robots.txt?apiKey=${key}`;
const sitemapUrl = ({ api, key, domain }: Filled) => `${api}/site/sitemap.xml?apiKey=${key}&origin=https://${domain}`;

const events = `<!-- count a button's clicks -->
<button data-track="book-a-call">Book a call</button>

<script>
  // or send your own event, with details
  window.MintAnalytics?.track('signup', { plan: 'pro' });
</script>`;

const netlifyRedirects = (f: Filled, spa = false) => `# _redirects — in the folder your host publishes
/robots.txt   ${robotsUrl(f)}   200
/sitemap.xml  ${sitemapUrl(f)}   200${spa ? '\n/*            /index.html   200' : ''}`;

const vercelRewrites = (f: Filled, spa = false) => `{
  "rewrites": [
    { "source": "/robots.txt", "destination": "${robotsUrl(f)}" },
    { "source": "/sitemap.xml", "destination": "${sitemapUrl(f)}" }${spa ? ',\n    { "source": "/(.*)", "destination": "/index.html" }' : ''}
  ]
}`;

const analyticsNotes = [
	'It counts page views (also when a single-page app changes route), visitors, where they came from, and clicks on links that leave the site.',
	'Google Analytics, Tag Manager, Meta Pixel and the other tags you set in Site setup → Tracking come in through this script — don’t paste their code as well, or visits are counted twice.',
];

/* ------------------------------------------ a website built anywhere */

// docs/site-connect SC-03/08: the snippet puts each page's SEO from Website → SEO on it — only on pages
// added there; every other page keeps its own. A server prints the same answer (/site/head) for link previews.
const headUrl = ({ api, key }: Filled, path = '/about') => `${api}/site/head?apiKey=${key}&path=${path}`;

const existing = (f: Filled): Step[] => [
	{
		id: 'snippet',
		title: 'Paste the snippet',
		lead: 'One line in the <head> of every page — as high as your site lets you. It counts visits for Analytics and puts each page’s SEO from this panel on it.',
		snippets: [{ label: 'snippet', file: 'every page — in <head>', code: `<script src="${f.origin}/public/track.js" data-key="${f.key}" data-seo></script>` }],
		notes: [
			'WordPress: a header-code plugin (e.g. WPCode → Header), or your theme’s header.php just before </head>.',
			'Webflow: Site settings → Custom code → Head code. Wix: Settings → Custom code → Head, all pages. Squarespace: Settings → Advanced → Code injection → Header.',
			'Shopify: Online Store → Themes → Edit code → theme.liquid, just before </head>. Hand-written sites: the <head> of each page, or your shared header file.',
			'Google Analytics, Tag Manager and pixels set in Site setup → Tracking come in through it too — don’t paste their code as well.',
		],
	},
	{
		id: 'pages',
		title: 'Add the pages Mint should handle',
		lead: 'Add a page with its address as it shows in the browser (/about) and set it to Published, then give it SEO on Website → SEO. Only those pages get their SEO from here — every other page keeps its own, untouched.',
		snippets: [],
		links: [
			{ label: 'Website → Pages', href: '/t/pages' },
			{ label: 'Website → SEO', href: '/t/seo' },
			{ label: 'Site setup → SEO (defaults)', href: '/site-setup?tab=seo' },
		],
		notes: [
			'On a page you add, what you fill in replaces the page’s own tags. A field you leave empty keeps the page’s own; Site setup → SEO’s defaults only fill in tags the page doesn’t have.',
			'/about, /about/ and /about.html are the same page.',
			'Changes show on the site within a minute — no deploy.',
		],
	},
	{
		id: 'check',
		title: 'See what a page gets',
		lead: 'Open this address with a page’s path at the end. "found": false means the page isn’t added, and the snippet leaves it alone.',
		snippets: [{ label: 'what Mint sends', file: 'in your browser', code: headUrl(f) }],
		links: [{ label: 'Site setup → Check the site', href: '/site-setup?tab=check' }],
	},
	{
		id: 'server',
		title: 'For link previews: print it on your server',
		lead: 'Google runs the snippet, so it sees the SEO. WhatsApp, Facebook, LinkedIn and X previews (and most other crawlers) only read the HTML your server sends. If your site has a server you can edit, print the same tags there — empty for pages you haven’t added, so yours stay.',
		snippets: [
			{
				label: 'PHP',
				file: 'mint-seo.php — then in <head>',
				code: `<?php
// mint-seo.php — this page's SEO from Mint, or '' when the page isn't added there
function mint_seo() {
  $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
  $url = '${f.api}/site/head?format=html&apiKey=${f.key}&path=' . urlencode($path);
  $html = @file_get_contents($url, false, stream_context_create(['http' => ['timeout' => 2]]));
  return $html ?: '';
}

// in your <head>:
// <?php require_once __DIR__ . '/mint-seo.php'; $seo = mint_seo(); ?>
// <?php if ($seo) { echo $seo; } else { ?>
//   <title>Your own title</title>
//   <meta name="description" content="Your own description">
// <?php } ?>`,
			},
			{
				label: 'Node / Express',
				file: 'mintSeo.js',
				code: `// mintSeo.js — this page's SEO from Mint as <head> tags, or '' when the page isn't added there
const cache = new Map();

export async function mintSeo(path) {
  const hit = cache.get(path);
  if (hit && hit.until > Date.now()) return hit.html;
  const url = '${f.api}/site/head?format=html&apiKey=${f.key}&path=' + encodeURIComponent(path);
  const html = await fetch(url, { signal: AbortSignal.timeout(2000) })
    .then(r => (r.ok ? r.text() : ''))
    .catch(() => '');
  cache.set(path, { html, until: Date.now() + 60_000 });
  return html;
}

// app.get('*', async (req, res) => res.render('page', { mintSeo: await mintSeo(req.path) }));
// in the template's <head>:  <%- mintSeo || '<title>Your own title</title>' %>`,
			},
			{
				label: 'Next.js',
				file: 'app/…/page.tsx — generateMetadata',
				code: `import type { Metadata } from 'next';

// This page's SEO from Mint; null when the page isn't added there.
async function mintSeo(path: string) {
  const url = \`\${process.env.MINT_API}/site/head?apiKey=\${process.env.MINT_API_KEY}&path=\${encodeURIComponent(path)}\`;
  const h = await fetch(url, { next: { revalidate: 60 } }).then(r => (r.ok ? r.json() : null)).catch(() => null);
  return h?.found ? h.seo : null;
}

export async function generateMetadata(): Promise<Metadata> {
  const s = await mintSeo('/about'); // this page's path
  if (!s) return { title: 'Your own title', description: 'Your own description' };
  return {
    title: { absolute: s.title },
    description: s.description,
    alternates: s.canonical ? { canonical: s.canonical } : undefined,
    robots: s.noIndex ? { index: false, follow: !s.noFollow } : undefined,
    openGraph: { title: s.ogTitle, description: s.ogDescription, url: s.canonical, siteName: s.siteName, images: s.image ? [{ url: s.image, alt: s.ogImageAlt }] : [] },
    twitter: { card: s.twitterCard, title: s.twitterTitle, description: s.twitterDescription, images: s.twitterImage ? [s.twitterImage] : [] },
  };
}`,
			},
		],
		notes: [
			'Keep the snippet in the page as well — it counts the visits, and keeps the SEO right when a single-page app changes pages.',
			'The answer is cached for a minute; if this project can’t be reached, the code falls back to your own tags.',
		],
	},
	{
		id: 'robots',
		title: 'Optional: robots.txt and sitemap.xml from here',
		lead: 'The sitemap lists the published pages you added on Website → Pages. Use it only if your site doesn’t make its own.',
		snippets: [
			{ label: 'Netlify _redirects', file: 'on Netlify', code: netlifyRedirects(f) },
			{ label: 'vercel.json', file: 'on Vercel', code: vercelRewrites(f) },
		],
		notes: ['Another host: open both addresses below and upload them as files — robots.txt: ' + robotsUrl(f) + ' · sitemap.xml: ' + sitemapUrl(f)],
	},
];

/* ------------------------------------------------------- plain HTML */

const html = (f: Filled): Step[] => [
	{
		id: 'keys',
		title: 'Put the keys in one file',
		lead: 'A plain HTML site has no build step, so there is no .env file. The address and the project key go in one small script that every page loads. The project key is publishable — it is made to be seen in a page.',
		snippets: [
			{
				label: 'site.js',
				file: 'site.js — next to your pages',
				code: `// site.js — reads this project's site API
const MINT_API = '${f.api}';
const MINT_KEY = '${f.key}'; // the project key — fine in a page

async function mint(path) {
  const url = MINT_API + path + (path.includes('?') ? '&' : '?') + 'apiKey=' + MINT_KEY;
  const res = await fetch(url);
  return res.ok ? res.json() : null;
}

const getSite = () => mint('/site');
const getPage = path => mint('/pages/by-path?path=' + encodeURIComponent(path));
const list = (route, query = '') => mint('/' + route + '?' + query);
const block = (page, slug) => page && page.contents.find(c => c.slug === slug);`,
			},
		],
		notes: ['Never put a server key (mint_sk_…) in a page or in site.js — anyone can read them.'],
	},
	{
		id: 'connect',
		title: 'Connect a page',
		lead: 'Mark the places your content goes with data-block="<slug>" — the slug of a piece on the page in Contents — and load site.js. The page fills itself from this project.',
		snippets: [
			{
				label: 'about.html',
				file: 'about.html',
				code: `<header>
  <strong data-site="name"></strong>
  <nav data-site="menu"></nav>
</header>

<main>
  <h1 data-block="hero"></h1>
  <p data-block="intro"></p>
</main>

<script src="/site.js"></script>
<script>
  document.addEventListener('DOMContentLoaded', async () => {
    // /about.html → /about, /index.html → /
    const path = location.pathname.replace(/(index)?\\.html$/, '').replace(/\\/$/, '') || '/';
    const [site, page] = await Promise.all([getSite(), getPage(path)]);

    if (site) {
      document.querySelectorAll('[data-site="name"]').forEach(el => (el.textContent = site.settings.siteName));
      const nav = document.querySelector('[data-site="menu"]');
      site.menu.forEach(item => {
        const a = document.createElement('a');
        a.href = item.path;
        a.textContent = item.name;
        nav.appendChild(a);
      });
    }
    if (!page) return; // no published page at this path

    document.querySelectorAll('[data-block]').forEach(el => {
      const piece = block(page, el.dataset.block);
      if (piece) el.textContent = piece.content;
    });
    applySeo(page.seo, site && site.settings); // step 4
  });
</script>`,
			},
		],
		notes: [
			'A piece’s other words are on it too: subContent, btnText + url, image, list, card, richContent.',
			'A list of records (products, posts…) comes from its model: list(\'products\', \'limit=12&sort=-createdAt\') — turn the model’s API on first (API → Endpoints).',
		],
	},
	{
		id: 'analytics',
		title: 'Add analytics',
		lead: 'Paste this into the <head> of every page.',
		snippets: [
			{ label: 'analytics snippet', file: 'every page — in <head>', code: trackTag(f) },
			{ label: 'events', file: 'optional — count what matters', code: events },
		],
		notes: analyticsNotes,
	},
	{
		id: 'seo',
		title: 'Set up SEO',
		lead: 'Search engines and link previews read what is in the HTML first, so write each page’s title, description and share image in its <head>. To edit them here instead (Website → SEO), add applySeo to site.js — Google runs it, but WhatsApp, Facebook and LinkedIn previews only see the HTML.',
		snippets: [
			{
				label: 'head tags',
				file: 'every page — in <head>',
				code: `<title>About us — Your site</title>
<meta name="description" content="What this page is about, in one or two sentences.">
<link rel="canonical" href="https://${f.domain}/about">
<meta property="og:title" content="About us">
<meta property="og:image" content="https://${f.domain}/share.jpg">`,
			},
			{
				label: 'applySeo',
				file: 'site.js — add at the end',
				code: `function setMeta(attr, name, content) {
  if (!content) return;
  let el = document.head.querySelector('meta[' + attr + '="' + name + '"]');
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function applySeo(seo, settings = {}) {
  const s = seo || {};
  const title = s.title || settings.metaTitle;
  if (title) document.title = settings.titleTemplate ? settings.titleTemplate.replace('%s', title) : title;
  setMeta('name', 'description', s.description || settings.metaDescription);
  setMeta('property', 'og:title', title);
  setMeta('property', 'og:image', s.image || settings.ogImage);
  if (s.noIndex) setMeta('name', 'robots', 'noindex');
}`,
			},
			{ label: 'Netlify _redirects', file: 'robots.txt and sitemap.xml — on Netlify', code: netlifyRedirects(f) },
			{ label: 'vercel.json', file: 'robots.txt and sitemap.xml — on Vercel', code: vercelRewrites(f) },
		],
		notes: [
			'robots.txt and sitemap.xml come from this project — they follow Site setup → SEO and list every published page. Another host: open both addresses, save them as files and upload them again when you add pages.',
		],
	},
];

/* ------------------------------------------------------ React (Vite) */

const react = (f: Filled): Step[] => [
	{
		id: 'keys',
		title: 'Put the keys in .env',
		lead: 'Make a file called .env in the project’s root, next to package.json. Vite only gives the browser variables that start with VITE_ — that’s what these two are for.',
		snippets: [
			{
				label: '.env',
				file: '.env — in the project root',
				code: `VITE_MINT_API=${f.api}
VITE_MINT_API_KEY=${f.key}`,
			},
		],
		notes: [
			'Restart npm run dev after changing .env.',
			'On your host (Vercel, Netlify: Settings → Environment variables) add the same two, then redeploy — Vite writes them into the build.',
			'Create React App: the same, named REACT_APP_MINT_API and REACT_APP_MINT_API_KEY, read with process.env.REACT_APP_….',
			'Never put a server key (mint_sk_…) in .env with VITE_: everything a Vite build holds is public.',
		],
	},
	{
		id: 'connect',
		title: 'Connect',
		lead: 'One file that calls the site API, and a hook that loads it into a component.',
		snippets: [
			{
				label: 'src/lib/mint.js',
				file: 'src/lib/mint.js',
				code: `const API = import.meta.env.VITE_MINT_API;
const KEY = import.meta.env.VITE_MINT_API_KEY;

export async function mint(path) {
  const res = await fetch(\`\${API}\${path}\${path.includes('?') ? '&' : '?'}apiKey=\${KEY}\`);
  return res.ok ? res.json() : null;
}

export const getSite = () => mint('/site');
export const getPage = path => mint(\`/pages/by-path?path=\${encodeURIComponent(path)}\`);
export const list = (route, query = '') => mint(\`/\${route}?\${query}\`);
export const block = (page, slug) => page?.contents?.find(c => c.slug === slug);`,
			},
			{
				label: 'src/lib/useMint.js',
				file: 'src/lib/useMint.js',
				code: `import { useEffect, useState } from 'react';

// undefined while loading, null when there's nothing there
export function useMint(load, deps = []) {
  const [data, setData] = useState(undefined);
  useEffect(() => {
    let live = true;
    setData(undefined);
    load().then(d => live && setData(d));
    return () => { live = false; };
  }, deps);
  return data;
}`,
			},
		],
		notes: ['Using TanStack Query or SWR? Call the same mint() functions from it instead of useMint.'],
	},
	{
		id: 'show',
		title: 'Show a page',
		lead: 'One route renders every page made here: it asks for the page at the current path and draws its pieces by slug.',
		snippets: [
			{
				label: 'src/Page.jsx',
				file: 'src/Page.jsx — <Route path="*" element={<Page />} />',
				code: `import { useLocation } from 'react-router-dom';
import { block, getPage } from './lib/mint';
import { useMint } from './lib/useMint';
import { useSeo } from './lib/useSeo';

export default function Page() {
  const { pathname } = useLocation();
  const page = useMint(() => getPage(pathname), [pathname]);
  useSeo(page?.seo);

  if (page === undefined) return <p>Loading…</p>;
  if (page === null) return <h1>Page not found</h1>;

  const hero = block(page, 'hero');
  return (
    <main>
      <h1>{hero?.content}</h1>
      <p>{hero?.subContent}</p>
      {hero?.btnText && <a href={hero.url}>{hero.btnText}</a>}
    </main>
  );
}`,
			},
		],
		notes: ['The header’s menu and site name: useMint(getSite) once in your layout — site.menu is [{ name, path }].'],
	},
	{
		id: 'analytics',
		title: 'Add analytics',
		lead: 'Paste this into the <head> of index.html (in the project root). It counts every route change on its own — nothing to add to the router.',
		snippets: [
			{ label: 'analytics snippet', file: 'index.html — in <head>', code: trackTag(f) },
			{ label: 'events', file: 'optional — count what matters', code: events },
		],
		notes: analyticsNotes,
	},
	{
		id: 'seo',
		title: 'Set up SEO',
		lead: 'Each page’s title, description and share image come from Website → SEO through this hook. A Vite app is drawn in the browser: Google reads it, but link previews (WhatsApp, Facebook, LinkedIn) only see index.html — so put the site’s default title, description and share image there too.',
		snippets: [
			{
				label: 'src/lib/useSeo.js',
				file: 'src/lib/useSeo.js',
				code: `import { useEffect } from 'react';

function setMeta(attr, name, content) {
  if (!content) return;
  let el = document.head.querySelector(\`meta[\${attr}="\${name}"]\`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export function useSeo(seo) {
  useEffect(() => {
    if (!seo) return;
    if (seo.title) document.title = seo.title;
    setMeta('name', 'description', seo.description);
    setMeta('property', 'og:title', seo.title);
    setMeta('property', 'og:image', seo.image);
    setMeta('name', 'robots', seo.noIndex ? 'noindex' : 'index, follow');
  }, [seo]);
}`,
			},
			{ label: 'vercel.json', file: 'vercel.json — robots.txt, sitemap.xml and the app’s routes on Vercel', code: vercelRewrites(f, true) },
			{ label: 'Netlify _redirects', file: 'public/_redirects — the same on Netlify', code: netlifyRedirects(f, true) },
		],
		notes: ['Pages that must rank or look good when shared are better on Next.js (next tab): it renders them on the server.'],
	},
];

/* ----------------------------------------------------------- Next.js */

const next = (f: Filled): Step[] => [
	{
		id: 'keys',
		title: 'Put the keys in .env.local',
		lead: 'Make a file called .env.local in the project’s root. Server components read the first two; the NEXT_PUBLIC_ pair is only needed if a client component calls the API itself.',
		snippets: [
			{
				label: '.env.local',
				file: '.env.local — in the project root',
				code: `MINT_API=${f.api}
MINT_API_KEY=${f.key}

# Only if client components call the API too
NEXT_PUBLIC_MINT_API=${f.api}
NEXT_PUBLIC_MINT_API_KEY=${f.key}

# Only if your server calls endpoints that need a server key — never NEXT_PUBLIC_
# MINT_SERVER_KEY=mint_sk_…`,
			},
		],
		notes: [
			'On Vercel: Project → Settings → Environment Variables — add the same names for Production and Preview, then redeploy.',
			'.env.local stays out of git (Next’s .gitignore already lists it).',
		],
	},
	{
		id: 'connect',
		title: 'Connect',
		lead: 'One file on the server that calls the site API. Answers are kept for 60 seconds, so edits here show on the site within a minute.',
		snippets: [
			{
				label: 'lib/mint.ts',
				file: 'lib/mint.ts',
				code: `const API = process.env.MINT_API!;
const KEY = process.env.MINT_API_KEY!; // the project key

export async function mint<T = any>(path: string): Promise<T | null> {
  const res = await fetch(\`\${API}\${path}\${path.includes('?') ? '&' : '?'}apiKey=\${KEY}\`, { next: { revalidate: 60 } });
  return res.ok ? res.json() : null;
}

export const getSite = () => mint('/site');
export const getPage = (path: string) => mint(\`/pages/by-path?path=\${encodeURIComponent(path)}\`);
export const list = (route: string, query = '') => mint(\`/\${route}?\${query}\`);
export const block = (page: any, slug: string) => page?.contents?.find((c: any) => c.slug === slug);`,
			},
		],
	},
	{
		id: 'show',
		title: 'Show a page — with its SEO',
		lead: 'One route renders every page made here, and puts each page’s SEO (Website → SEO) in its head on the server — what search engines and link previews read.',
		snippets: [
			{
				label: 'app/[[...slug]]/page.tsx',
				file: 'app/[[...slug]]/page.tsx',
				code: `import { notFound } from 'next/navigation';
import { block, getPage } from '@/lib/mint';

type Props = { params: Promise<{ slug?: string[] }> };
const pathOf = async ({ params }: Props) => '/' + ((await params).slug || []).join('/');

export async function generateMetadata(props: Props) {
  const seo = (await getPage(await pathOf(props)))?.seo;
  if (!seo) return {};
  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    alternates: seo.canonical ? { canonical: seo.canonical } : undefined,
    openGraph: { images: seo.image ? [seo.image] : [] },
    robots: seo.noIndex ? { index: false } : undefined,
  };
}

export default async function Page(props: Props) {
  const page = await getPage(await pathOf(props));
  if (!page) notFound();
  const hero = block(page, 'hero');
  return (
    <main>
      <h1>{hero?.content}</h1>
      <p>{hero?.subContent}</p>
    </main>
  );
}`,
			},
		],
	},
	{
		id: 'analytics',
		title: 'Add analytics',
		lead: 'Add the script once, in the root layout. It counts every route change on its own. The layout also gives every page the site’s default SEO and favicon from Site setup.',
		snippets: [
			{
				label: 'app/layout.tsx',
				file: 'app/layout.tsx',
				code: `import Script from 'next/script';
import { getSite } from '@/lib/mint';

export async function generateMetadata() {
  const s = (await getSite())?.settings || {};
  return {
    metadataBase: new URL('https://${f.domain}'),
    title: { default: s.metaTitle || s.siteName, template: s.titleTemplate || \`%s — \${s.siteName}\` },
    description: s.metaDescription,
    icons: s.favicon ? { icon: s.favicon } : undefined,
    openGraph: { images: s.ogImage ? [s.ogImage] : [] },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Script src="${f.origin}/public/track.js" data-key="${f.key}" strategy="afterInteractive" />
      </body>
    </html>
  );
}`,
			},
			{ label: 'events', file: 'optional — count what matters', code: events },
		],
		notes: analyticsNotes,
	},
	{
		id: 'seo',
		title: 'robots.txt and sitemap.xml',
		lead: 'Two route handlers pass them on from this project — they follow Site setup → SEO and list every published page.',
		snippets: [
			{
				label: 'app/robots.txt/route.ts',
				file: 'app/robots.txt/route.ts',
				code: `export const revalidate = 300;

export async function GET() {
  const res = await fetch(\`\${process.env.MINT_API}/site/robots.txt?apiKey=\${process.env.MINT_API_KEY}\`);
  return new Response(await res.text(), { headers: { 'Content-Type': 'text/plain' } });
}`,
			},
			{
				label: 'app/sitemap.xml/route.ts',
				file: 'app/sitemap.xml/route.ts',
				code: `export const revalidate = 300;

export async function GET() {
  const res = await fetch(\`\${process.env.MINT_API}/site/sitemap.xml?apiKey=\${process.env.MINT_API_KEY}&origin=https://${f.domain}\`);
  return new Response(await res.text(), { headers: { 'Content-Type': 'application/xml' } });
}`,
			},
		],
		notes: ['Already have app/robots.ts or app/sitemap.ts? Remove them — Next can’t serve both.'],
	},
];

export const FRAMEWORKS: { value: Framework; label: string; about: string; steps: (f: Filled) => Step[] }[] = [
	{
		value: 'site',
		label: 'Existing website',
		about: 'A website that’s already built — WordPress, Webflow, Wix, Shopify, a site by an agency, anything. Paste one line, then choose which pages take their SEO from here.',
		steps: existing,
	},
	{ value: 'html', label: 'Plain HTML', about: 'HTML pages and a little JavaScript — no build step.', steps: html },
	{ value: 'react', label: 'React (Vite)', about: 'A React app built with Vite (or Create React App), drawn in the browser.', steps: react },
	{ value: 'next', label: 'Next.js', about: 'React rendered on the server — the best for SEO.', steps: next },
];
