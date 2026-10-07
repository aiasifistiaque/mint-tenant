'use client';

import { FC, useEffect, useMemo, useState } from 'react';
import { Badge, Box, Button, Flex, Grid, Input, Skeleton, Switch, Text } from '@chakra-ui/react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Layout, useGetOrganizationQuery } from '@/components/library';
import { CopyValue, Dropdown, EmptyState, Panel } from '@/components/library/cl';
import { useWorkspace } from '@/components/library/tenant';
import GuideLink from '@/components/library/tenant/GuideLink';
import { API_ORIGIN } from '@/components/library/config/lib/constants/panel';
import { toaster } from '@/components/ui/toaster';
import { useGetWidgetsQuery, useGetWidgetsShopQuery, useSaveWidgetsMutation } from '@/components/library/store/services/tenantApi';
import ShopPanel from './_components/ShopPanel';
import type { WidgetSettings, WidgetTheme, WidgetType } from '@/components/library/store/services/tenantApi';

/**
 * The project's site widgets (tenant panel; docs/widgets W-04): the one script
 * a site adds, the look every widget shares, and each widget — on/off, its
 * options and texts, a live preview of the unsaved settings and the snippet
 * that places it. Backend: routes-tenant/widgets.router.ts; the catalogue is
 * the backend's WIDGET_TYPES. Building permission (`build`).
 */

type Draft = { widgets: Record<string, WidgetSettings>; theme: WidgetTheme };

const label = { fontSize: '13px', fontWeight: '600', mb: 1.5 } as const;
const PROVIDER_NAMES: Record<string, string> = { stripe: 'Stripe', sslcommerz: 'SSLCommerz', bkash: 'bKash' };

/** What's planned next (docs/widgets) — shown so tenants know what's coming. */
const COMING = [
	{ title: 'More ways to pay', text: 'SSLCommerz, bKash, cash on delivery and bank transfer; refunds from the order.' },
	{ title: 'Forms', text: 'Contact and newsletter forms drawn from your models, with spam protection.' },
	{ title: 'Booking', text: 'Free slots worked out on the server — no double bookings.' },
	{ title: 'WhatsApp button', text: 'A floating button that opens a chat with a ready message.' },
	{ title: 'Cookie consent', text: 'Your tracking tags fire only after visitors agree.' },
	{ title: 'Search', text: 'Instant results from your products, posts and pages.' },
];

const Code: FC<{ children: string }> = ({ children }) => (
	<Flex
		align='flex-start'
		justify='space-between'
		gap={2}
		p={2.5}
		bg='bg.subtle'
		borderWidth='1px'
		borderColor='border'
		borderRadius='md'>
		<Box
			as='pre'
			m={0}
			fontSize='12px'
			fontFamily='mono'
			whiteSpace='pre-wrap'
			wordBreak='break-all'
			minW={0}>
			{children}
		</Box>
		<CopyValue
			value={children}
			display=''
			ariaLabel='Copy the code'
		/>
	</Flex>
);

/** A page that loads mint.js with these (unsaved) settings — sandboxed, so nothing signs in. */
const Preview: FC<{ slug: string; theme: WidgetTheme; name: string; settings: WidgetSettings; snippet: string; currency?: string }> = ({ slug, theme, name, settings, snippet, currency }) => {
	const [dark, setDark] = useState(false);
	const [html, setHtml] = useState('');
	// The cart's preview shows two sample products in the shop's currency (mint.js draws them; nothing is fetched).
	const config = JSON.stringify({ theme, widgets: { [name]: { options: settings.options, texts: settings.texts } }, shop: { currency: currency || 'USD' } });
	useEffect(() => {
		// Typing in a text box shouldn't reload the preview on every key.
		const t = setTimeout(() => {
			const safe = config.replace(/</g, '\\u003c');
			setHtml(
				`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">` +
					`<style>body{margin:0;padding:20px;min-height:100vh;box-sizing:border-box;background:${dark ? '#111113' : '#f5f5f4'};color:${dark ? '#eee' : '#222'};font-family:system-ui,sans-serif}</style>` +
					`<script>window.__MINT_PREVIEW__=${safe}</script>` +
					// Browsers don't let a sandboxed frame reach a local API (dev), so say so rather than stay blank.
					`<script src="${API_ORIGIN}/public/mint.js" data-project="${slug}" onerror="window.__mintFailed=1"></script></head>` +
					`<body><div style="display:flex;justify-content:flex-end;align-items:center;gap:10px;flex-wrap:wrap">${snippet}</div>` +
					`<p id="failed" hidden style="font-size:13px;opacity:.7">The preview couldn’t load mint.js from ${API_ORIGIN}.</p>` +
					`<script>if(window.__mintFailed)document.getElementById('failed').hidden=false</script></body></html>`
			);
		}, 350);
		return () => clearTimeout(t);
	}, [config, dark, slug, snippet]);
	return (
		<Box>
			<Flex
				justify='space-between'
				align='center'
				mb={1.5}>
				<Text
					fontSize='12px'
					color='fg.muted'>
					Preview — your unsaved settings
				</Text>
				<Flex gap={1}>
					{[false, true].map(d => (
						<Button
							key={String(d)}
							size='2xs'
							variant={dark === d ? 'solid' : 'ghost'}
							onClick={() => setDark(d)}>
							{d ? 'Dark page' : 'Light page'}
						</Button>
					))}
				</Flex>
			</Flex>
			<Box
				as='iframe'
				{...({ sandbox: 'allow-scripts', srcDoc: html, title: 'Widget preview' } as any)}
				w='full'
				h='420px'
				borderWidth='1px'
				borderColor='border'
				borderRadius='md'
				bg={dark ? '#111113' : '#f5f5f4'}
			/>
		</Box>
	);
};

const OptionInput: FC<{ o: WidgetType['options'][number]; value: any; onChange: (v: any) => void }> = ({ o, value, onChange }) => {
	if (o.kind === 'boolean')
		return (
			<Switch.Root
				size='sm'
				checked={!!value}
				onCheckedChange={e => onChange(!!e.checked)}>
				<Switch.HiddenInput />
				<Switch.Control />
				<Switch.Label fontSize='13px'>{o.label}</Switch.Label>
			</Switch.Root>
		);
	if (o.kind === 'select')
		return (
			<Dropdown
				size='sm'
				value={value}
				onChange={onChange}
				items={o.options || []}
			/>
		);
	return (
		<Input
			size='sm'
			type={o.kind === 'number' ? 'number' : 'text'}
			value={value ?? ''}
			onChange={e => onChange(o.kind === 'number' ? Number(e.target.value) : e.target.value)}
		/>
	);
};

const WidgetPanel: FC<{ type: WidgetType; value: WidgetSettings; theme: WidgetTheme; slug: string; currency?: string; needsShop?: boolean; onChange: (v: WidgetSettings) => void }> = ({
	type,
	value,
	theme,
	slug,
	currency,
	needsShop,
	onChange,
}) => {
	const [texts, setTexts] = useState(false);
	return (
		<Panel
			title={type.title}
			subtitle={type.summary}
			actions={
				<Flex
					align='center'
					gap={3}>
					<GuideLink section={type.guide} />
					<Switch.Root
						size='sm'
						checked={value.enabled}
						onCheckedChange={e => onChange({ ...value, enabled: !!e.checked })}>
						<Switch.HiddenInput />
						<Switch.Control />
						<Switch.Label fontSize='13px'>{value.enabled ? 'On' : 'Off'}</Switch.Label>
					</Switch.Root>
				</Flex>
			}>
			<Text
				fontSize='13px'
				color='fg.muted'
				lineHeight='1.6'
				mb={4}>
				{type.description}
			</Text>
			{needsShop && (
				<Text
					fontSize='13px'
					color='orange.fg'
					mb={4}>
					Set up the Shop above first{type.name === 'cart' ? '' : ', with its Orders'} — this widget can’t be switched on without it.
				</Text>
			)}
			<Grid
				templateColumns={{ base: '1fr', lg: 'minmax(0, 1fr) minmax(0, 1fr)' }}
				gap={5}>
				<Flex
					direction='column'
					gap={4}>
					{type.options.map(o => (
						<Box key={o.key}>
							{o.kind !== 'boolean' && <Text {...label}>{o.label}</Text>}
							<OptionInput
								o={o}
								value={value.options[o.key]}
								onChange={v => onChange({ ...value, options: { ...value.options, [o.key]: v } })}
							/>
							<Text
								fontSize='12px'
								color='fg.muted'
								mt={1}>
								{o.help}
							</Text>
						</Box>
					))}
					<Box>
						<Button
							size='xs'
							variant='ghost'
							px={0}
							onClick={() => setTexts(!texts)}>
							{texts ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
							Texts — in your words or language
						</Button>
						{texts && (
							<Grid
								mt={2}
								templateColumns={{ base: '1fr', md: '1fr 1fr' }}
								gap={3}>
								{type.texts.map(t => (
									<Box key={t.key}>
										<Text {...label}>{t.label}</Text>
										<Input
											size='sm'
											value={value.texts[t.key] ?? ''}
											placeholder={t.default}
											onChange={e => onChange({ ...value, texts: { ...value.texts, [t.key]: e.target.value } })}
										/>
									</Box>
								))}
							</Grid>
						)}
					</Box>
					<Box>
						<Text {...label}>Put it on a page</Text>
						<Code>{type.snippet}</Code>
						<Text
							fontSize='12px'
							color='fg.muted'
							mt={1}>
							Anywhere in your HTML, as many times as you like. Add <code>data-</code> attributes to change an option there,
							e.g. <code>data-layout=&quot;button&quot;</code>.
							{type.name === 'cart' && (
								<>
									{' '}
									Put <code>data-mint-add</code> on any button with the product’s id (its record’s ID) — add{' '}
									<code>data-mint-variant=&quot;Large&quot;</code> to skip the variant picker.
								</>
							)}
						</Text>
					</Box>
				</Flex>
				<Preview
					slug={slug}
					theme={theme}
					name={type.name}
					settings={value}
					snippet={type.snippet}
					currency={currency}
				/>
			</Grid>
			{!value.enabled && (
				<Text
					mt={3}
					fontSize='12px'
					color='orange.fg'>
					Off: pages with this widget show nothing until you switch it on and save.
				</Text>
			)}
		</Panel>
	);
};

export default function WidgetsPage() {
	const { project, can, isLoading: loadingSelf } = useWorkspace();
	const allowed = can('build');
	const { data, isLoading } = useGetWidgetsQuery(undefined, { skip: !allowed });
	const { data: org } = useGetOrganizationQuery();
	const [save, saving] = useSaveWidgetsMutation();
	const { data: shop } = useGetWidgetsShopQuery(undefined, { skip: !allowed });
	const [draft, setDraft] = useState<Draft | null>(null);

	useEffect(() => {
		if (data) setDraft({ widgets: data.widgets, theme: data.theme });
	}, [data]);

	const saved = useMemo(() => (data ? JSON.stringify({ widgets: data.widgets, theme: data.theme }) : ''), [data]);
	const dirty = !!draft && JSON.stringify(draft) !== saved;

	const onSave = async () => {
		if (!draft) return;
		try {
			await save(draft).unwrap();
			toaster.create({ type: 'success', title: 'Widgets saved — your site shows the changes within a minute.' });
		} catch (e: any) {
			toaster.create({ type: 'error', title: e?.data?.message || 'Not saved — try again.' });
		}
	};

	if (!allowed && !loadingSelf)
		return (
			<Layout
				title='Widgets'
				path='widgets'>
				<EmptyState
					title='Widgets are set up by people who build the project'
					description='Ask someone with the Build permission.'
				/>
			</Layout>
		);

	const theme = draft?.theme;
	const setTheme = (patch: Partial<WidgetTheme>) => setDraft(d => (d ? { ...d, theme: { ...d.theme, ...patch } } : d));
	const providers = (org?.paymentProviders || []).map(p => PROVIDER_NAMES[p] || p);

	return (
		<Layout
			title='Widgets'
			path='widgets'>
			<Flex
				direction='column'
				gap={4}
				pb={dirty ? 20 : 4}>
				<Panel
					title='Add MINT to your site'
					subtitle='One script, then place widgets anywhere'
					actions={<GuideLink section='add-mint' />}>
					<Text
						fontSize='13px'
						color='fg.muted'
						lineHeight='1.6'
						mb={3}>
						Widgets are ready-made pieces for your own website or app — sign-in, a cart, checkout and order history today; forms and more next.
						Add this tag once to every page (in <code>&lt;head&gt;</code> or before <code>&lt;/body&gt;</code>), then put each
						widget where it should appear. They take your colours, don’t touch your site’s styles, and your own code can use
						them through <code>window.Mint</code>.
					</Text>
					{isLoading || !data ? <Skeleton h='44px' /> : <Code>{data.script}</Code>}
				</Panel>

				<Panel
					title='Look'
					subtitle='Shared by every widget'
					actions={<GuideLink section='look' />}>
					{!theme ? (
						<Skeleton h='80px' />
					) : (
						<Grid
							templateColumns={{ base: '1fr', md: 'repeat(4, minmax(0, 1fr))' }}
							gap={4}>
							<Box>
								<Text {...label}>Colour</Text>
								<Flex
									gap={2}
									align='center'>
									<Input
										type='color'
										size='sm'
										w='40px'
										p={0.5}
										value={theme.primaryColor || '#111827'}
										onChange={e => setTheme({ primaryColor: e.target.value })}
									/>
									<Input
										size='sm'
										fontFamily='mono'
										value={theme.primaryColor}
										placeholder={project?.type === 'website' ? 'Your site’s' : '#111827'}
										onChange={e => setTheme({ primaryColor: e.target.value.trim() })}
									/>
								</Flex>
								<Text
									fontSize='12px'
									color='fg.muted'
									mt={1}>
									Buttons and links. {project?.type === 'website' ? 'Empty: the colour in Site setup.' : ''}
								</Text>
							</Box>
							<Box>
								<Text {...label}>Font</Text>
								<Input
									size='sm'
									value={theme.fontFamily}
									placeholder='Your site’s font'
									onChange={e => setTheme({ fontFamily: e.target.value })}
								/>
								<Text
									fontSize='12px'
									color='fg.muted'
									mt={1}>
									Empty: whatever the page uses.
								</Text>
							</Box>
							<Box>
								<Text {...label}>Corners</Text>
								<Input
									size='sm'
									type='number'
									min={0}
									max={24}
									value={theme.radius}
									onChange={e => setTheme({ radius: Math.min(24, Math.max(0, Number(e.target.value) || 0)) })}
								/>
								<Text
									fontSize='12px'
									color='fg.muted'
									mt={1}>
									Roundness in pixels, 0–24.
								</Text>
							</Box>
							<Box>
								<Text {...label}>Light or dark</Text>
								<Dropdown
									size='sm'
									value={theme.colorMode}
									onChange={v => setTheme({ colorMode: v as WidgetTheme['colorMode'] })}
									items={[
										{ value: 'auto', label: 'Match the page' },
										{ value: 'light', label: 'Always light' },
										{ value: 'dark', label: 'Always dark' },
									]}
								/>
								<Text
									fontSize='12px'
									color='fg.muted'
									mt={1}>
									Match the page: light on light pages, dark on dark ones.
								</Text>
							</Box>
						</Grid>
					)}
				</Panel>

				{allowed && <ShopPanel />}

				{isLoading || !draft || !data ? (
					<Skeleton h='420px' />
				) : (
					data.catalog.map(type => (
						<WidgetPanel
							key={type.name}
							type={type}
							value={draft.widgets[type.name]}
							theme={draft.theme}
							slug={project?.publicSlug || ''}
							currency={shop?.shop?.currency || shop?.guess?.currency}
							needsShop={!!shop && (type.name === 'cart' ? !shop.shop : ['checkout', 'thanks', 'orders'].includes(type.name) ? !shop.shop?.order : false)}
							onChange={v => setDraft(d => (d ? { ...d, widgets: { ...d.widgets, [type.name]: v } } : d))}
						/>
					))
				)}

				<Panel
					title='Coming next'
					subtitle='Being built now, in this order'
					actions={<GuideLink section='coming-next' />}>
					<Grid
						templateColumns={{ base: '1fr', md: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(4, minmax(0, 1fr))' }}
						gap={3}>
						{COMING.map(c => (
							<Box
								key={c.title}
								p={3}
								borderWidth='1px'
								borderColor='border'
								borderRadius='md'>
								<Flex
									align='center'
									gap={2}
									mb={1}>
									<Text
										fontSize='13px'
										fontWeight='600'>
										{c.title}
									</Text>
									<Badge
										size='xs'
										variant='outline'>
										Soon
									</Badge>
								</Flex>
								<Text
									fontSize='12px'
									color='fg.muted'
									lineHeight='1.5'>
									{c.text}
									{c.title === 'More ways to pay' && providers.length > 0 && ` For your organization: ${providers.join(', ')}.`}
								</Text>
							</Box>
						))}
					</Grid>
				</Panel>
			</Flex>

			{dirty && (
				<Flex
					position='fixed'
					bottom={4}
					right={6}
					zIndex={10}
					gap={2}
					align='center'
					px={4}
					py={2.5}
					bg='bg.panel'
					borderWidth='1px'
					borderColor='border'
					borderRadius='lg'
					boxShadow='lg'>
					<Text
						fontSize='13px'
						color='fg.muted'
						mr={2}>
						Unsaved changes
					</Text>
					<Button
						size='sm'
						variant='ghost'
						onClick={() => data && setDraft({ widgets: data.widgets, theme: data.theme })}>
						Discard
					</Button>
					<Button
						size='sm'
						loading={saving.isLoading}
						onClick={onSave}>
						Save
					</Button>
				</Flex>
			)}
		</Layout>
	);
}
