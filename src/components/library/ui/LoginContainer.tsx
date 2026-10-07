import { FC, FormEvent, ReactNode } from 'react';
import { Box, Button, Flex, Image, Text } from '@chakra-ui/react';
import AuthFrame, { AUTH_MONO, AuthCard, AuthTitle, brandButton } from './AuthFrame';

type LoginContainerProps = {
	children: ReactNode;
	handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
	isLoading: boolean;
	title: ReactNode;
	/** One line under the title saying what this page is for. */
	subtitle?: ReactNode;
	submitLabel?: string;
	/** Leave the submit button out — for a page that only explains something. */
	hideSubmit?: boolean;
	/** Under the button, past a divider: "Back to sign in" and the like. */
	footer?: ReactNode;
	/** A logo of its own above the title (the MINT mark is on the page already). */
	logoSrc?: string;
	/** A flow in steps (sign-up): the steps' names, and which one this is (from 1). */
	steps?: string[];
	step?: number;
};

/** The website's tones, one per step (mint-webpage lib/tones.ts). */
const STEP_TONES = [
	{ fg: '#059669', dark: '#34d399', bar: '#10b981' },
	{ fg: '#0284c7', dark: '#38bdf8', bar: '#0ea5e9' },
	{ fg: '#7c3aed', dark: '#a78bfa', bar: '#8b5cf6' },
	{ fg: '#d97706', dark: '#fbbf24', bar: '#f59e0b' },
];

/** Where the reader is in a flow: each step numbered and named, done and current ones lit in their colour. */
const Steps: FC<{ steps: string[]; step: number }> = ({ steps, step }) => (
	<Flex
		as='ol'
		gap={2}
		listStyleType='none'
		aria-label={`Step ${step} of ${steps.length}`}>
		{steps.map((name, i) => {
			const tone = STEP_TONES[i % STEP_TONES.length];
			const on = i + 1 <= step;
			return (
				<Flex
					as='li'
					key={name}
					flex={1}
					direction='column'
					gap={2}
					aria-current={i + 1 === step ? 'step' : undefined}>
					<Box
						h='2px'
						borderRadius='full'
						bg={on ? tone.bar : 'border'}
						transition='background .3s'
					/>
					<Text
						as='span'
						fontFamily={AUTH_MONO}
						fontSize='10.5px'
						letterSpacing='0.14em'
						textTransform='uppercase'
						css={{ color: on ? `${tone.fg} !important` : 'var(--chakra-colors-fg-subtle) !important', _dark: on ? { color: `${tone.dark} !important` } : {} }}>
						0{i + 1} · {name}
					</Text>
				</Flex>
			);
		})}
	</Flex>
);

/**
 * The signed-out pages' card (sign in, sign up and its questions, forgot /
 * reset password, invitations): the title, the fields, one full-width brand
 * button, and a footer — on the website-styled AuthFrame.
 */
const LoginContainer: FC<LoginContainerProps> = ({
	children,
	handleSubmit,
	isLoading,
	title,
	subtitle,
	submitLabel = 'Continue',
	hideSubmit,
	footer,
	logoSrc,
	steps,
	step = 1,
}) => (
	<AuthFrame>
		<AuthCard
			as='form'
			// @ts-ignore — Flex as form
			onSubmit={handleSubmit}>
			{steps && steps.length > 1 && (
				<Steps
					steps={steps}
					step={step}
				/>
			)}
			<Flex
				direction='column'
				gap={3}>
				{logoSrc && (
					<Image
						boxSize='44px'
						objectFit='contain'
						src={logoSrc}
						alt=''
						mb={1}
					/>
				)}
				<AuthTitle>{title}</AuthTitle>
				{subtitle && (
					<Text
						fontSize='15px'
						lineHeight='1.6'
						css={{ color: 'var(--chakra-colors-fg-muted) !important' }}>
						{subtitle}
					</Text>
				)}
			</Flex>

			<Flex
				direction='column'
				gap={4}>
				{children}
			</Flex>

			{!hideSubmit && (
				<Button
					type='submit'
					loading={isLoading}
					css={brandButton}>
					{submitLabel}
				</Button>
			)}

			{footer && (
				<Box
					pt={5}
					borderTopWidth={1}
					borderColor='border'
					fontSize='14px'
					textAlign='center'
					css={{
						color: 'var(--chakra-colors-fg-muted)',
						'& span, & p': { color: 'inherit', fontSize: 'inherit' },
						'& a': {
							color: 'var(--chakra-colors-fg)',
							fontWeight: 400,
							textDecoration: 'underline',
							textDecorationColor: 'var(--chakra-colors-border-emphasized)',
							textUnderlineOffset: '4px',
						},
						'& a:hover': { textDecorationColor: '#10b981' },
					}}>
					{footer}
				</Box>
			)}
		</AuthCard>
	</AuthFrame>
);

export default LoginContainer;
