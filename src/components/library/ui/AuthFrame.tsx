import { FC, ReactNode, useId } from 'react';
import { Box, Flex, FlexProps, Grid, SystemStyleObject, Text } from '@chakra-ui/react';
import { JetBrains_Mono, Outfit } from 'next/font/google';

/**
 * The signed-out pages' frame — sign in, two-step verification, sign up and
 * its onboarding questions, forgot / reset password, invitations — drawn like
 * the marketing website (mint-webpage): its palette, Outfit with light
 * uppercase headings, the brand gradient, and the deep-ink band with the
 * logo on the left from a laptop up.
 *
 * Deliberately literal colours: these pages are MINT's front door, so they
 * look the same whatever colour theme an account picked (applyTheme.ts).
 * They're set as the Chakra token variables the inputs, dropdowns and buttons
 * read, scoped to this frame, so every field inside takes the website's look
 * and the rest of the panel is untouched. Keep the values in step with
 * mint-webpage/src/app/globals.css.
 */

// Headings and text: Outfit, slim and geometric. Labels: JetBrains Mono.
const outfit = Outfit({ subsets: ['latin'], weight: ['200', '300', '400', '500'], display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400'], display: 'swap' });

export const AUTH_FONT = outfit.style.fontFamily;
export const AUTH_MONO = mono.style.fontFamily;

/** The website's palette as the token variables Chakra's parts read. */
const TOKENS: SystemStyleObject = {
	'--chakra-colors-bg': '#fbfbfd',
	'--chakra-colors-bg-panel': '#ffffff',
	'--chakra-colors-bg-subtle': '#f4f5f9',
	'--chakra-colors-bg-muted': '#eceef4',
	'--chakra-colors-bg-emphasized': '#e2e5ee',
	'--chakra-colors-fg': '#0b0d14',
	'--chakra-colors-fg-muted': '#555b6e',
	'--chakra-colors-fg-subtle': '#9298a8',
	'--chakra-colors-border': '#e6e8ef',
	'--chakra-colors-border-muted': '#eceef4',
	'--chakra-colors-border-emphasized': '#d5d8e2',
	'--chakra-colors-field-bg': '#ffffff',
	'--chakra-colors-field-border': '#d5d8e2',
	'--chakra-colors-field-border-hover': '#b9bdcb',
	'--chakra-colors-field-placeholder': '#9298a8',
	'--chakra-colors-field-focus-ring': '#8b5cf6',
	'--chakra-colors-accent-solid': '#0d0d0d',
	'--chakra-colors-accent-contrast': '#ffffff',
	'--chakra-colors-accent-fg': '#0b0d14',
	'--chakra-colors-accent-subtle': '#eceef4',
	'--chakra-colors-accent-muted': '#e2e5ee',
	'--chakra-colors-accent-focus-ring': '#8b5cf6',
	'--auth-shadow': '0 2px 4px rgb(16 24 40 / 0.04), 0 30px 80px -20px rgb(40 30 90 / 0.22)',
	'--auth-mesh':
		'radial-gradient(40% 50% at 12% 14%, rgb(16 185 129 / 0.14), transparent 70%), radial-gradient(35% 45% at 92% 8%, rgb(168 85 247 / 0.12), transparent 70%), radial-gradient(40% 50% at 70% 92%, rgb(6 182 212 / 0.1), transparent 70%)',
	_dark: {
		// thinkcrypt.dev's neutral black, like the website — no blue tint.
		'--chakra-colors-bg': '#0d0d0d',
		'--chakra-colors-bg-panel': '#1b1b1b',
		'--chakra-colors-bg-subtle': '#121212',
		'--chakra-colors-bg-muted': '#1f1f1f',
		'--chakra-colors-bg-emphasized': '#2a2a2a',
		'--chakra-colors-fg': '#faf8f1',
		'--chakra-colors-fg-muted': '#b3b0a7',
		'--chakra-colors-fg-subtle': '#75736d',
		'--chakra-colors-border': '#2a2a2a',
		'--chakra-colors-border-muted': '#232323',
		'--chakra-colors-border-emphasized': '#333333',
		'--chakra-colors-field-bg': '#121212',
		'--chakra-colors-field-border': '#333333',
		'--chakra-colors-field-border-hover': '#4a4a4a',
		'--chakra-colors-field-placeholder': '#75736d',
		'--chakra-colors-field-focus-ring': '#a78bfa',
		'--chakra-colors-accent-solid': '#faf8f1',
		'--chakra-colors-accent-contrast': '#0d0d0d',
		'--chakra-colors-accent-fg': '#faf8f1',
		'--chakra-colors-accent-subtle': '#1f1f1f',
		'--chakra-colors-accent-muted': '#2a2a2a',
		'--chakra-colors-accent-focus-ring': '#a78bfa',
		'--auth-shadow': '0 2px 4px rgb(0 0 0 / 0.5), 0 30px 80px -20px rgb(0 0 0 / 0.85)',
		'--auth-mesh':
			'radial-gradient(40% 50% at 12% 14%, rgb(16 185 129 / 0.12), transparent 70%), radial-gradient(35% 45% at 92% 8%, rgb(168 85 247 / 0.14), transparent 70%), radial-gradient(40% 50% at 70% 92%, rgb(6 182 212 / 0.08), transparent 70%)',
	},
};

/** The type inside the frame: light body, quiet spaced-capital labels, no bold. */
const TYPE: SystemStyleObject = {
	fontFamily: AUTH_FONT,
	fontWeight: 300,
	color: 'fg',
	'& p, & span': { fontFamily: 'inherit' },
	'& strong, & b': { fontWeight: 500 },
	'& label': {
		fontFamily: AUTH_MONO,
		fontSize: '10.5px',
		fontWeight: 400,
		letterSpacing: '0.14em',
		textTransform: 'uppercase',
		color: 'fg.muted',
	},
	'& input, & textarea, & button': { fontFamily: 'inherit' },
	'& input, & textarea': { fontWeight: 300, fontSize: '15px' },
	// Softer corners on fields, like the website's inputs.
	'& input:not([type=checkbox]):not([type=radio]), & textarea, & button[data-part=trigger]': { borderRadius: '12px' },
};

/** The brand gradient, as on the website's buttons and accent words. */
export const BRAND_GRADIENT = 'linear-gradient(110deg, #10b981 0%, #06b6d4 40%, #6366f1 75%, #a855f7 100%)';

/** The frame's main action: the website's brand button — a gradient pill in small spaced capitals. */
export const brandButton: SystemStyleObject = {
	h: '48px',
	w: 'full',
	borderRadius: 'full',
	background: BRAND_GRADIENT,
	color: 'white',
	fontSize: '12px',
	fontWeight: 400,
	letterSpacing: '0.16em',
	textTransform: 'uppercase',
	border: 0,
	boxShadow: '0 10px 30px -8px rgb(99 102 241 / 0.6)',
	transition: 'filter .2s, transform .2s',
	_hover: { background: BRAND_GRADIENT, filter: 'brightness(1.1)' },
	_active: { transform: 'scale(0.98)' },
	_disabled: { opacity: 0.55, filter: 'none', cursor: 'not-allowed' },
};

/** A small label above a heading, with a coloured dot (the website's Eyebrow). */
export const Eyebrow: FC<{ children: ReactNode; color?: string; dot?: string }> = ({ children, color = '#059669', dot = '#10b981' }) => (
	<Flex
		as='p'
		align='center'
		gap={2}
		fontFamily={AUTH_MONO}
		fontSize='11px'
		letterSpacing='0.16em'
		textTransform='uppercase'
		color={color}
		_dark={{ color: '#34d399' }}>
		<Box
			as='span'
			boxSize='6px'
			borderRadius='full'
			bg={dot}
		/>
		{children}
	</Flex>
);

/**
 * The mark: an "M" in one stroke on the brand gradient, with the AI's spark
 * (mint-webpage Logo). Each copy has its own gradient ids: the page draws two
 * (the band's and the phone header's), and a shared id would resolve to the
 * hidden one's gradient, which doesn't paint.
 */
export const MintMark: FC<{ size?: number }> = ({ size = 28 }) => {
	const id = useId().replace(/:/g, '');
	return (
	<svg
		width={size}
		height={size}
		viewBox='0 0 32 32'
		aria-hidden>
		<defs>
			<linearGradient
				id={`${id}-g`}
				x1='2'
				y1='2'
				x2='30'
				y2='30'
				gradientUnits='userSpaceOnUse'>
				<stop stopColor='#10b981' />
				<stop
					offset='0.45'
					stopColor='#06b6d4'
				/>
				<stop
					offset='1'
					stopColor='#7c3aed'
				/>
			</linearGradient>
			<linearGradient
				id={`${id}-s`}
				x1='16'
				y1='0'
				x2='16'
				y2='18'
				gradientUnits='userSpaceOnUse'>
				<stop
					stopColor='#fff'
					stopOpacity='0.28'
				/>
				<stop
					offset='1'
					stopColor='#fff'
					stopOpacity='0'
				/>
			</linearGradient>
		</defs>
		<rect
			width='32'
			height='32'
			rx='9.5'
			fill={`url(#${id}-g)`}
		/>
		<rect
			width='32'
			height='32'
			rx='9.5'
			fill={`url(#${id}-s)`}
		/>
		<path
			d='M9.5 22.5V10.5L16 17L22.5 10.5V22.5'
			fill='none'
			stroke='#fff'
			strokeWidth='2.6'
			strokeLinecap='round'
			strokeLinejoin='round'
		/>
		<path
			d='M16 6.6Q16.45 9.05 18.9 9.5Q16.45 9.95 16 12.4Q15.55 9.95 13.1 9.5Q15.55 9.05 16 6.6Z'
			fill='#fff'
		/>
	</svg>
	);
};

/** The mark and the name in wide capitals. */
export const Wordmark: FC<{ light?: boolean }> = ({ light }) => (
	<Flex
		align='center'
		gap={2.5}>
		<MintMark size={28} />
		<Text
			as='span'
			fontFamily={AUTH_FONT}
			fontSize='15px'
			fontWeight={300}
			letterSpacing='0.34em'
			textTransform='uppercase'
			color={light ? '#faf8f1' : 'fg'}>
			Mint
		</Text>
	</Flex>
);

/** What MINT is, on the brand band — the website's pitch in three lines, one colour each. */
const POINTS = [
	{ text: 'Describe your data — get tables, forms, filters and a dashboard.', color: '#34d399' },
	{ text: 'Open it to your own site or app, with an API and customer sign-in.', color: '#38bdf8' },
	{ text: 'Build it from blocks, or let your own AI build it for you.', color: '#a78bfa' },
];

const Check: FC<{ color: string }> = ({ color }) => (
	<svg
		width='13'
		height='13'
		viewBox='0 0 256 256'
		aria-hidden>
		<polyline
			points='40 144 96 200 224 72'
			fill='none'
			stroke={color}
			strokeWidth='24'
			strokeLinecap='round'
			strokeLinejoin='round'
		/>
	</svg>
);

/** The deep-ink band on the left from a laptop up (the website's `mesh-ink` sections). */
const BrandBand: FC = () => (
	<Flex
		display={{ base: 'none', lg: 'flex' }}
		position='relative'
		overflow='hidden'
		direction='column'
		justify='space-between'
		gap={12}
		px={{ lg: 12, xl: 16 }}
		py={12}
		color='#faf8f1'
		css={{
			background:
				'radial-gradient(45% 60% at 10% 0%, rgb(16 185 129 / 0.28), transparent 70%), radial-gradient(40% 60% at 95% 10%, rgb(168 85 247 / 0.3), transparent 70%), radial-gradient(50% 60% at 60% 110%, rgb(6 182 212 / 0.22), transparent 70%), #0d0d0d',
			_dark: {
				background:
					'radial-gradient(45% 60% at 10% 0%, rgb(16 185 129 / 0.22), transparent 70%), radial-gradient(40% 60% at 95% 10%, rgb(168 85 247 / 0.24), transparent 70%), radial-gradient(50% 60% at 60% 110%, rgb(6 182 212 / 0.16), transparent 70%), #060508',
			},
			// Spans and paragraphs here keep the band's light text over the page's `fg`.
			'& p, & span': { color: 'inherit' },
		}}>
		{/* A faint dotted grid. */}
		<Box
			aria-hidden
			position='absolute'
			inset={0}
			pointerEvents='none'
			css={{
				backgroundImage: 'radial-gradient(rgb(255 255 255 / 0.08) 1px, transparent 1px)',
				backgroundSize: '24px 24px',
			}}
		/>
		<Box position='relative'>
			<Wordmark light />
		</Box>

		<Box
			position='relative'
			maxW='480px'>
			<Flex
				as='p'
				align='center'
				gap={2}
				mb={6}
				fontFamily={AUTH_MONO}
				fontSize='11.5px'
				letterSpacing='0.16em'
				textTransform='uppercase'
				css={{ color: '#34d399 !important' }}>
				<Box
					as='span'
					boxSize='6px'
					borderRadius='full'
					bg='#10b981'
				/>
				Backend as a service
			</Flex>
			<Text
				as='h2'
				fontSize={{ lg: '40px', xl: '48px' }}
				fontWeight={200}
				lineHeight='1.04'
				letterSpacing='-0.012em'
				textTransform='uppercase'
				css={{ color: '#faf8f1 !important' }}>
				The backend for every business.{' '}
				<Box
					as='span'
					display='block'
					css={{
						// The panel's global rule sets every span to 15px.
						fontSize: 'inherit !important',
						background: BRAND_GRADIENT,
						WebkitBackgroundClip: 'text',
						backgroundClip: 'text',
						color: 'transparent !important',
					}}>
					Admin panel included.
				</Box>
			</Text>
			<Flex
				as='ul'
				direction='column'
				gap={3.5}
				mt={10}
				listStyleType='none'>
				{POINTS.map(p => (
					<Flex
						as='li'
						key={p.text}
						align='center'
						gap={3}>
						<Flex
							boxSize='28px'
							flexShrink={0}
							align='center'
							justify='center'
							borderRadius='full'
							borderWidth='1px'
							borderColor='rgb(255 255 255 / 0.1)'
							css={{ background: 'linear-gradient(180deg, rgb(255 255 255 / 0.07) 0%, rgb(255 255 255 / 0.02) 100%)' }}>
							<Check color={p.color} />
						</Flex>
						<Text
							as='span'
							fontSize='15px'
							fontWeight={300}
							lineHeight='1.5'
							css={{ color: 'rgb(250 248 241 / 0.78) !important' }}>
							{p.text}
						</Text>
					</Flex>
				))}
			</Flex>
		</Box>

		<Text
			position='relative'
			fontSize='10.5px'
			fontWeight={300}
			letterSpacing='0.16em'
			textTransform='uppercase'
			css={{ color: 'rgb(250 248 241 / 0.45) !important' }}>
			© {new Date().getFullYear()} MINT · mintapp.shop
		</Text>
	</Flex>
);

/**
 * The website's palette and type for a whole page of its own — the tenant
 * panel's public landing page (app/_landing) uses it too.
 */
export const SITE_STYLE: SystemStyleObject = { ...TOKENS, ...TYPE };

/** The deep-ink band's background (the website's `mesh-ink`), for other pages' dark sections. */
export const INK_BAND: SystemStyleObject = {
	background:
		'radial-gradient(45% 60% at 10% 0%, rgb(16 185 129 / 0.28), transparent 70%), radial-gradient(40% 60% at 95% 10%, rgb(168 85 247 / 0.3), transparent 70%), radial-gradient(50% 60% at 60% 110%, rgb(6 182 212 / 0.22), transparent 70%), #0d0d0d',
	_dark: {
		background:
			'radial-gradient(45% 60% at 10% 0%, rgb(16 185 129 / 0.22), transparent 70%), radial-gradient(40% 60% at 95% 10%, rgb(168 85 247 / 0.24), transparent 70%), radial-gradient(50% 60% at 60% 110%, rgb(6 182 212 / 0.16), transparent 70%), #060508',
	},
};

/**
 * The page: the brand band (laptop up) and, beside it, the page's own card
 * centred on the website's light field. On phones and tablets the band gives
 * way to the logo above the card.
 */
const AuthFrame: FC<{ children: ReactNode }> = ({ children }) => (
	<Grid
		w='full'
		minH='100dvh'
		flex={1}
		templateColumns={{ base: '1fr', lg: 'minmax(0, 0.92fr) minmax(0, 1.08fr)' }}
		bg='bg'
		css={{ ...TOKENS, ...TYPE }}>
		<BrandBand />
		<Flex
			position='relative'
			direction='column'
			align='center'
			justify='center'
			gap={8}
			px={4}
			py={{ base: 8, md: 14 }}
			minW={0}
			css={{ backgroundImage: 'var(--auth-mesh)' }}>
			<Box display={{ base: 'block', lg: 'none' }}>
				<Wordmark />
			</Box>
			{children}
		</Flex>
	</Grid>
);

/** The white card the page's form sits in. */
export const AuthCard: FC<FlexProps> = ({ children, ...props }) => (
	<Flex
		direction='column'
		gap={6}
		w='full'
		maxW='440px'
		p={{ base: 6, md: 9 }}
		bg='bg.panel'
		borderWidth='1px'
		borderColor='border'
		borderRadius='24px'
		css={{ boxShadow: 'var(--auth-shadow)' }}
		{...props}>
		{children}
	</Flex>
);

/** A page title in the website's style: extra-light capitals. */
export const AuthTitle: FC<{ children: ReactNode }> = ({ children }) => (
	<Text
		as='h1'
		fontSize={{ base: '26px', md: '30px' }}
		fontWeight={200}
		lineHeight='1.08'
		letterSpacing='-0.01em'
		textTransform='uppercase'
		css={{ color: 'var(--chakra-colors-fg) !important' }}>
		{children}
	</Text>
);

export default AuthFrame;
