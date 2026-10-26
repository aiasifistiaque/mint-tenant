'use client';

import { FC, ReactNode } from 'react';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import { Box, Flex, Text } from '@chakra-ui/react';
import { BookOpen, KeyRound, Globe, LayoutGrid, Route, ScrollText, UserRound } from 'lucide-react';
import { BACKEND, projectHref } from '@/components/library/config/lib/constants/panel';
import { TONES, Tone } from '@/theme/tones';
import type { EndpointAction, EndpointWho } from '@/components/library/store/services/apiBuilderApi';

/**
 * Pieces every API page shares (backend docs/api-builder D11): where the API
 * lives, how a method and a "who" look, what each action does, and the strip
 * of tabs between the five pages.
 */

/** The API's public address: the backend's root, without /tenant/api. */
export const publicBase = () => BACKEND.replace(/\/tenant\/api\/?$/, '');
/** The public API's address (backend docs/api-builder D14): the project key, not the project's name, says which project — ?apiKey=. */
export const apiBase = () => `${publicBase()}/public/api`;

export { useProjectKey } from '@/components/library/tenant/useProjectKey';

/** An API page's address in this project: '' Overview, '/endpoints', '/endpoints/<id>', '/keys', '/logs', '/reference'. */
export const apiHref = (sub = '') => projectHref(`/public-api${sub}`);

export const errorOf = (e: any, fallback = 'Couldn’t save — try again.') => ({ message: e?.data?.message || fallback, on: e?.data?.on as string | undefined });

const METHOD_TONE: Record<string, Tone> = { GET: 'sky', POST: 'emerald', PUT: 'amber', DELETE: 'rose' };

export const MethodBadge: FC<{ method: string; size?: 'sm' | 'md' }> = ({ method, size = 'sm' }) => {
	const t = TONES[METHOD_TONE[method] || 'sky'];
	return (
		<Box
			as='span'
			display='inline-flex'
			alignItems='center'
			justifyContent='center'
			flexShrink={0}
			minW={size === 'md' ? '58px' : '50px'}
			px={1.5}
			py='2px'
			borderRadius='md'
			fontFamily='mono'
			fontSize={size === 'md' ? '12px' : '10.5px'}
			letterSpacing='0.04em'
			color={t.fg}
			bg={t.soft}>
			{method}
		</Box>
	);
};

export const ACTIONS: { value: EndpointAction; label: string; method: string; one: boolean; does: string }[] = [
	{ value: 'list', label: 'List', method: 'GET', one: false, does: 'Many records, a page at a time — with filters, search and sort.' },
	{ value: 'get', label: 'Read one', method: 'GET', one: true, does: 'One record by its id.' },
	{ value: 'create', label: 'Create', method: 'POST', one: false, does: 'Adds a record from what the site or app sends.' },
	{ value: 'update', label: 'Update', method: 'PUT', one: true, does: 'Changes a record by its id.' },
	{ value: 'delete', label: 'Delete', method: 'DELETE', one: true, does: 'Removes a record by its id.' },
	{ value: 'upload', label: 'Upload files', method: 'POST', one: false, does: 'Takes files for the model’s file or image fields and answers their links.' },
];
export const actionOf = (a: string) => ACTIONS.find(x => x.value === a) || ACTIONS[0];

export const WHO: { value: EndpointWho; label: string; short: string; tone: Tone; icon: ReactNode; does: string }[] = [
	{
		value: 'anyone',
		label: 'Anyone',
		short: 'Anyone',
		tone: 'emerald',
		icon: <Globe size={16} strokeWidth={1.75} />,
		does: 'No sign-in, no key — for what any visitor of your site may see or send (products, a contact form).',
	},
	{
		value: 'customer',
		label: 'Signed-in customers',
		short: 'Customers',
		tone: 'sky',
		icon: <UserRound size={16} strokeWidth={1.75} />,
		does: 'Your customers, signed in with the sign-in widget — and rules can use who they are (“their own orders”).',
	},
	{
		value: 'key',
		label: 'A server key',
		short: 'Server key',
		tone: 'violet',
		icon: <KeyRound size={16} strokeWidth={1.75} />,
		does: 'Your own server, scripts or partners, with a secret key from Keys. Never put a key in a website.',
	},
];
export const whoOf = (w: string) => WHO.find(x => x.value === w) || WHO[0];

export const WhoBadge: FC<{ who: string; rules?: number }> = ({ who, rules = 0 }) => {
	const w = whoOf(who);
	const t = TONES[w.tone];
	return (
		<Flex
			as='span'
			align='center'
			gap={1.5}
			flexShrink={0}>
			<Box
				as='span'
				px={2}
				py='1px'
				borderRadius='full'
				fontSize='11.5px'
				color={t.fg}
				bg={t.soft}
				whiteSpace='nowrap'>
				{w.short}
			</Box>
			{rules > 0 && (
				<Box
					as='span'
					px={2}
					py='1px'
					borderRadius='full'
					borderWidth='1px'
					borderColor='border'
					fontSize='11.5px'
					color='fg.muted'
					whiteSpace='nowrap'>
					{rules} rule{rules === 1 ? '' : 's'}
				</Box>
			)}
		</Flex>
	);
};

const TABS = [
	{ sub: '', label: 'Overview', icon: LayoutGrid },
	{ sub: '/endpoints', label: 'Endpoints', icon: Route },
	{ sub: '/keys', label: 'Keys', icon: KeyRound },
	{ sub: '/logs', label: 'Logs', icon: ScrollText },
	{ sub: '/reference', label: 'Reference', icon: BookOpen },
];

/** The API pages, as tabs under the page's header. */
export const ApiTabs: FC = () => {
	const pathname = usePathname() || '';
	const here = pathname.replace(/\/+$/, '');
	return (
		<Flex
			as='nav'
			aria-label='API pages'
			gap={1}
			borderBottomWidth='1px'
			borderColor='border.muted'
			overflowX='auto'
			css={{ scrollbarWidth: 'none' }}>
			{TABS.map(t => {
				const href = apiHref(t.sub);
				const active = t.sub === '' ? /\/public-api$/.test(here) : here.includes(`/public-api${t.sub}`);
				const Icon = t.icon;
				return (
					<NextLink
						key={t.sub}
						href={href}
						aria-current={active ? 'page' : undefined}>
						<Flex
							align='center'
							gap={1.5}
							px={3}
							py={2.5}
							mb='-1px'
							fontSize='13px'
							whiteSpace='nowrap'
							borderBottomWidth='2px'
							borderColor={active ? 'fg' : 'transparent'}
							color={active ? 'fg' : 'fg.muted'}
							_hover={{ color: 'fg' }}>
							<Icon
								size={14}
								strokeWidth={1.75}
							/>
							<Text as='span'>{t.label}</Text>
						</Flex>
					</NextLink>
				);
			})}
		</Flex>
	);
};
