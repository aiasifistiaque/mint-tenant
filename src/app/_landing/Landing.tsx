'use client';

import { FC, ReactNode } from 'react';
import NextLink from 'next/link';
import { Box, Button, Flex, Grid, Link, Text } from '@chakra-ui/react';
import { ArrowRight, Globe, LayoutGrid, PlugZap, Users } from 'lucide-react';
import { useAuth } from '@/components/library';
import { DOCS_URL, HOME } from '@/components/library/config/lib/constants/panel';
import { AUTH_MONO, BRAND_GRADIENT, INK_BAND, SITE_STYLE, Wordmark, brandButton } from '@/components/library/ui/AuthFrame';

/**
 * The tenant panel's public landing page (/). The marketing website
 * (mintapp.shop) tells the whole story, so this is just the basics: what you
 * can build, how to start, and the way in — sign up or log in, or straight to
 * the dashboard (HOME) when already signed in. Drawn like the website and the
 * sign-in pages (AuthFrame's palette and type).
 */

const WEBSITE_URL = (process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://mintapp.shop').replace(/\/+$/, '');

const MAX_W = '1120px';
const PX = { base: 4, md: 8 };

/** The website's tones (mint-webpage lib/tones.ts): text in light and dark, and the dot. */
const TONES = {
	emerald: { fg: '#059669', dark: '#34d399', dot: '#10b981' },
	sky: { fg: '#0284c7', dark: '#38bdf8', dot: '#0ea5e9' },
	violet: { fg: '#7c3aed', dark: '#a78bfa', dot: '#8b5cf6' },
	amber: { fg: '#d97706', dark: '#fbbf24', dot: '#f59e0b' },
};
type Tone = keyof typeof TONES;

const BUILD: { icon: ReactNode; tone: Tone; title: string; text: string; examples: string }[] = [
	{
		icon: <LayoutGrid size={20} />,
		tone: 'emerald',
		title: 'An app for your team',
		text: 'Keep track of what your business runs on, with tables, forms and a dashboard made for it.',
		examples: 'Customers, orders, bookings, stock',
	},
	{
		icon: <Globe size={20} />,
		tone: 'sky',
		title: 'A website',
		text: 'Write your pages and their content here, and show them on your own site.',
		examples: 'A company site, a blog, a shop',
	},
	{
		icon: <PlugZap size={20} />,
		tone: 'violet',
		title: 'A backend for your app',
		text: 'Your data behind a ready API, with sign-in for your users.',
		examples: 'A mobile app, a web app',
	},
	{
		icon: <Users size={20} />,
		tone: 'amber',
		title: 'A place for your team',
		text: 'Invite people and choose what each of them can see and do.',
		examples: 'Owners, staff, partners',
	},
];

const STEPS: { title: string; text: string }[] = [
	{ title: 'Sign up', text: 'Create your account and name your business. It takes a minute.' },
	{ title: 'Start a project', text: 'Choose an app, a website or an API. Start from a template, or from scratch.' },
	{ title: 'Describe your data', text: 'Add what you keep track of, like customers or orders. MINT makes the screens for you.' },
	{ title: 'Use it with your team', text: 'Add your records, invite your team, and open it to your site when you’re ready.' },
];

const Landing = () => {
	const { isLoading, isLoggedIn } = useAuth();
	const signedIn = !isLoading && !!isLoggedIn;

	return (
		<Flex
			direction='column'
			minH='100dvh'
			bg='bg'
			css={SITE_STYLE}>
			<Header
				ready={!isLoading}
				signedIn={signedIn}
			/>
			<Box
				as='main'
				flex={1}>
				<Hero signedIn={signedIn} />
				<WhatYouBuild />
				<HowToStart />
				<FinalBand signedIn={signedIn} />
			</Box>
			<SiteFooter />
		</Flex>
	);
};

/* ---------------------------------------------------------------- pieces */

const Container: FC<{ children: ReactNode }> = ({ children }) => (
	<Box
		maxW={MAX_W}
		mx='auto'
		px={PX}
		w='full'>
		{children}
	</Box>
);

/** A small label above a heading, with a coloured dot (the website's Eyebrow). */
const Eyebrow: FC<{ children: ReactNode; tone?: Tone }> = ({ children, tone = 'emerald' }) => (
	<Flex
		as='p'
		align='center'
		gap={2}
		mb={4}
		fontFamily={AUTH_MONO}
		fontSize='11.5px'
		letterSpacing='0.16em'
		textTransform='uppercase'
		css={{ color: `${TONES[tone].fg} !important`, _dark: { color: `${TONES[tone].dark} !important` } }}>
		<Box
			as='span'
			boxSize='6px'
			borderRadius='full'
			bg={TONES[tone].dot}
		/>
		{children}
	</Flex>
);

/** A section heading in the website's light capitals. */
const Heading: FC<{ children: ReactNode; size?: 'lg' | 'xl' }> = ({ children, size = 'lg' }) => (
	<Text
		as={size === 'xl' ? 'h1' : 'h2'}
		fontSize={size === 'xl' ? { base: '40px', md: '64px' } : { base: '30px', md: '42px' }}
		fontWeight={200}
		lineHeight='1.04'
		letterSpacing='-0.012em'
		textTransform='uppercase'
		css={{ color: 'var(--chakra-colors-fg) !important' }}>
		{children}
	</Text>
);

/** Words in the brand gradient, inside a heading. */
const Accent: FC<{ children: ReactNode }> = ({ children }) => (
	<Box
		as='span'
		css={{
			fontSize: 'inherit !important',
			background: BRAND_GRADIENT,
			WebkitBackgroundClip: 'text',
			backgroundClip: 'text',
			color: 'transparent !important',
		}}>
		{children}
	</Box>
);

/** Small spaced capitals — the website's header and footer links. */
const CAPS = { fontSize: '11.5px', letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 300 } as const;

/** The way in: sign up and log in, or on to the dashboard. */
const AuthButtons: FC<{ signedIn: boolean; light?: boolean }> = ({ signedIn, light }) =>
	signedIn ? (
		<Button
			asChild
			css={{ ...brandButton, w: 'auto', px: 7 }}>
			<NextLink href={HOME}>
				Open your dashboard
				<ArrowRight size={15} />
			</NextLink>
		</Button>
	) : (
		<Flex
			gap={3}
			wrap='wrap'>
			<Button
				asChild
				css={{ ...brandButton, w: 'auto', px: 7 }}>
				<NextLink href='/auth/register'>
					Sign up free
					<ArrowRight size={15} />
				</NextLink>
			</Button>
			<Button
				asChild
				h='48px'
				px={7}
				borderRadius='full'
				variant='outline'
				css={{
					...CAPS,
					fontSize: '12px',
					fontWeight: 400,
					...(light
						? { color: '#faf8f1', borderColor: 'rgb(255 255 255 / 0.25)', bg: 'transparent', _hover: { bg: 'rgb(255 255 255 / 0.08)' } }
						: { borderColor: 'border.emphasized', bg: 'bg.panel' }),
				}}>
				<NextLink href='/auth/login'>Log in</NextLink>
			</Button>
		</Flex>
	);

/* ---------------------------------------------------------------- header */

const Header: FC<{ ready: boolean; signedIn: boolean }> = ({ ready, signedIn }) => (
	<Box
		as='header'
		position='sticky'
		top={0}
		zIndex={10}
		bg='bg'
		borderBottomWidth='1px'
		borderColor='border'>
		<Container>
			<Flex
				h='64px'
				align='center'
				gap={4}>
				<Link
					asChild
					_hover={{ textDecoration: 'none' }}>
					<NextLink
						href='/'
						aria-label='MINT home'>
						<Wordmark />
					</NextLink>
				</Link>
				<Flex
					ml='auto'
					align='center'
					gap={{ base: 2, md: 5 }}>
					<Link
						href={DOCS_URL}
						target='_blank'
						rel='noreferrer'
						display={{ base: 'none', sm: 'inline' }}
						color='fg.muted'
						_hover={{ color: 'fg', textDecoration: 'none' }}
						css={CAPS}>
						Guides
					</Link>
					{ready &&
						(signedIn ? (
							<Button
								asChild
								h='36px'
								px={4}
								borderRadius='full'
								css={{ ...CAPS, fontSize: '11px', fontWeight: 400, background: '#0d0d0d', color: 'white', _dark: { background: '#faf8f1', color: '#0d0d0d' } }}>
								<NextLink href={HOME}>Dashboard</NextLink>
							</Button>
						) : (
							<>
								<Link
									asChild
									color='fg.muted'
									_hover={{ color: 'fg', textDecoration: 'none' }}
									css={CAPS}>
									<NextLink href='/auth/login'>Log in</NextLink>
								</Link>
								<Button
									asChild
									h='36px'
									px={4}
									borderRadius='full'
									css={{ ...CAPS, fontSize: '11px', fontWeight: 400, background: BRAND_GRADIENT, color: 'white', border: 0, _hover: { filter: 'brightness(1.1)' } }}>
									<NextLink href='/auth/register'>Sign up</NextLink>
								</Button>
							</>
						))}
				</Flex>
			</Flex>
		</Container>
	</Box>
);

/* ---------------------------------------------------------------- hero */

const Hero: FC<{ signedIn: boolean }> = ({ signedIn }) => (
	<Box
		as='section'
		position='relative'
		overflow='hidden'
		css={{ backgroundImage: 'var(--auth-mesh)' }}>
		<Container>
			<Box
				py={{ base: 16, md: 28 }}
				maxW='820px'>
				<Eyebrow>Backend + admin panel</Eyebrow>
				<Heading size='xl'>
					Build the app <Accent>your business runs on.</Accent>
				</Heading>
				<Text
					mt={6}
					maxW='600px'
					fontSize={{ base: '16px', md: '18px' }}
					lineHeight='1.7'
					css={{ color: 'var(--chakra-colors-fg-muted) !important', fontSize: 'inherit' }}>
					Tell MINT what you keep track of, and get a ready app for your team: tables, forms and a dashboard. No code needed.
				</Text>
				<Box mt={9}>
					<AuthButtons signedIn={signedIn} />
				</Box>
			</Box>
		</Container>
	</Box>
);

/* ---------------------------------------------------------------- what you can build */

const WhatYouBuild = () => (
	<Box
		as='section'
		id='build'
		py={{ base: 16, md: 24 }}
		borderTopWidth='1px'
		borderColor='border'>
		<Container>
			<Eyebrow tone='sky'>What you can build</Eyebrow>
			<Heading>One place for your business.</Heading>
			<Grid
				mt={{ base: 10, md: 14 }}
				templateColumns={{ base: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' }}
				gap={4}>
				{BUILD.map(b => (
					<Flex
						key={b.title}
						direction='column'
						gap={3}
						p={6}
						bg='bg.panel'
						borderWidth='1px'
						borderColor='border'
						borderRadius='2xl'
						css={{ boxShadow: 'var(--auth-shadow)' }}>
						<Flex
							boxSize='44px'
							align='center'
							justify='center'
							borderRadius='xl'
							borderWidth='1px'
							borderColor='border'
							bg='bg.subtle'
							css={{ color: TONES[b.tone].fg, _dark: { color: TONES[b.tone].dark } }}>
							{b.icon}
						</Flex>
						<Text
							as='h3'
							mt={2}
							fontSize='15px'
							fontWeight={400}
							css={{ color: 'var(--chakra-colors-fg) !important' }}>
							{b.title}
						</Text>
						<Text
							fontSize='14.5px'
							lineHeight='1.65'
							css={{ color: 'var(--chakra-colors-fg-muted) !important' }}>
							{b.text}
						</Text>
						<Text
							mt='auto'
							pt={2}
							fontFamily={AUTH_MONO}
							fontSize='11px'
							letterSpacing='0.06em'
							css={{ color: 'var(--chakra-colors-fg-subtle) !important' }}>
							{b.examples}
						</Text>
					</Flex>
				))}
			</Grid>
		</Container>
	</Box>
);

/* ---------------------------------------------------------------- how to start */

const STEP_TONES: Tone[] = ['emerald', 'sky', 'violet', 'amber'];

const HowToStart = () => (
	<Box
		as='section'
		id='how'
		py={{ base: 16, md: 24 }}
		bg='bg.subtle'
		borderTopWidth='1px'
		borderColor='border'>
		<Container>
			<Eyebrow tone='violet'>How to start</Eyebrow>
			<Heading>Your first app in four steps.</Heading>
			<Grid
				as='ol'
				mt={{ base: 10, md: 14 }}
				listStyleType='none'
				templateColumns={{ base: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' }}
				gap={4}>
				{STEPS.map((s, i) => {
					const t = TONES[STEP_TONES[i]];
					return (
						<Flex
							as='li'
							key={s.title}
							direction='column'
							gap={3}
							p={6}
							bg='bg.panel'
							borderWidth='1px'
							borderColor='border'
							borderRadius='2xl'>
							<Flex
								align='center'
								justify='space-between'>
								<Text
									fontFamily={AUTH_MONO}
									fontSize='13px'
									css={{ color: `${t.fg} !important`, _dark: { color: `${t.dark} !important` } }}>
									0{i + 1}
								</Text>
								<Box
									h='2px'
									w='40px'
									borderRadius='full'
									bg={t.dot}
								/>
							</Flex>
							<Text
								as='h3'
								mt={2}
								fontSize='17px'
								fontWeight={400}
								css={{ color: 'var(--chakra-colors-fg) !important' }}>
								{s.title}
							</Text>
							<Text
								fontSize='14.5px'
								lineHeight='1.65'
								css={{ color: 'var(--chakra-colors-fg-muted) !important' }}>
								{s.text}
							</Text>
						</Flex>
					);
				})}
			</Grid>
			<Text
				mt={8}
				fontSize='14.5px'
				css={{ color: 'var(--chakra-colors-fg-muted) !important' }}>
				Every step has a short guide.{' '}
				<Link
					href={`${DOCS_URL}/getting-started`}
					target='_blank'
					rel='noreferrer'
					color='fg'
					textDecoration='underline'
					textUnderlineOffset='4px'
					textDecorationColor='border.emphasized'
					_hover={{ textDecorationColor: '#10b981' }}>
					Read the getting started guide
				</Link>
			</Text>
		</Container>
	</Box>
);

/* ---------------------------------------------------------------- the last band */

const FinalBand: FC<{ signedIn: boolean }> = ({ signedIn }) => (
	<Box
		as='section'
		position='relative'
		overflow='hidden'
		py={{ base: 16, md: 24 }}
		css={{ ...INK_BAND, '& p, & span, & h2': { color: '#faf8f1 !important' } }}>
		<Box
			aria-hidden
			position='absolute'
			inset={0}
			pointerEvents='none'
			css={{ backgroundImage: 'radial-gradient(rgb(255 255 255 / 0.08) 1px, transparent 1px)', backgroundSize: '24px 24px' }}
		/>
		<Container>
			<Box
				position='relative'
				maxW='720px'>
				<Text
					as='h2'
					fontSize={{ base: '30px', md: '44px' }}
					fontWeight={200}
					lineHeight='1.04'
					letterSpacing='-0.012em'
					textTransform='uppercase'>
					{signedIn ? 'Welcome back.' : 'Ready when you are.'}
				</Text>
				<Text
					mt={5}
					fontSize='16px'
					lineHeight='1.7'
					css={{ opacity: 0.75 }}>
					{signedIn ? (
						'Pick up where you left off.'
					) : (
						<>
							Sign up free and build your first app today. Want the full tour first?{' '}
							<Link
								href={WEBSITE_URL}
								target='_blank'
								rel='noreferrer'
								textDecoration='underline'
								textUnderlineOffset='4px'
								css={{ color: '#faf8f1 !important', textDecorationColor: 'rgb(255 255 255 / 0.35)' }}>
								It’s on our website
							</Link>
							.
						</>
					)}
				</Text>
				<Box mt={9}>
					<AuthButtons
						signedIn={signedIn}
						light
					/>
				</Box>
			</Box>
		</Container>
	</Box>
);

/* ---------------------------------------------------------------- footer */

const FOOTER_LINKS = [
	{ href: WEBSITE_URL, label: 'mintapp.shop', external: true },
	{ href: DOCS_URL, label: 'Guides', external: true },
	{ href: '/terms', label: 'Terms' },
	{ href: '/privacy-policy', label: 'Privacy' },
	{ href: '/system-status', label: 'Status' },
];

const SiteFooter = () => (
	<Box
		as='footer'
		borderTopWidth='1px'
		borderColor='border'
		bg='bg.panel'>
		<Container>
			<Flex
				py={8}
				gap={4}
				direction={{ base: 'column', md: 'row' }}
				align={{ base: 'flex-start', md: 'center' }}
				justify='space-between'>
				<Text
					css={{ ...CAPS, fontSize: '10.5px', color: 'var(--chakra-colors-fg-subtle) !important' }}>
					© {new Date().getFullYear()} MINT
				</Text>
				<Flex
					gap={{ base: 4, md: 6 }}
					wrap='wrap'>
					{FOOTER_LINKS.map(l =>
						l.external ? (
							<Link
								key={l.label}
								href={l.href}
								target='_blank'
								rel='noreferrer'
								color='fg.muted'
								_hover={{ color: 'fg', textDecoration: 'none' }}
								css={{ ...CAPS, fontSize: '10.5px' }}>
								{l.label}
							</Link>
						) : (
							<Link
								key={l.label}
								asChild
								color='fg.muted'
								_hover={{ color: 'fg', textDecoration: 'none' }}
								css={{ ...CAPS, fontSize: '10.5px' }}>
								<NextLink href={l.href}>{l.label}</NextLink>
							</Link>
						)
					)}
				</Flex>
			</Flex>
		</Container>
	</Box>
);

export default Landing;
