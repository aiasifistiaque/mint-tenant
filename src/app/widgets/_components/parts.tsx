'use client';

import { FC, useEffect, useState } from 'react';
import { Box, Button, Flex, Input, Switch, Text } from '@chakra-ui/react';
import { CopyValue, Dropdown } from '@/components/library/cl';
import { API_ORIGIN } from '@/components/library/config/lib/constants/panel';
import type { WidgetSettings, WidgetTheme, WidgetType } from '@/components/library/store/services/tenantApi';

/**
 * Pieces the Widgets screen and its setup wizard share (docs/widgets W-04,
 * W-24): the code box, the live preview and one option's input.
 */

export const label = { fontSize: '13px', fontWeight: '600', mb: 1.5 } as const;
export const help = { fontSize: '12px', color: 'fg.muted', mt: 1 } as const;

/** On the Widgets screen — a server from before W-24 has no `added`, so a switched-on widget counts. */
export const isAdded = (w?: WidgetSettings) => !!(w?.added ?? w?.enabled);

/** The widgets that sell — they need the Shop (W-05) set up, and all but the cart its Orders too. */
export const SHOP_WIDGETS = ['cart', 'checkout', 'thanks', 'orders'];

export const Code: FC<{ children: string }> = ({ children }) => (
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
export const Preview: FC<{ projectKey: string; theme: WidgetTheme; name: string; settings: WidgetSettings; snippet: string; currency?: string; height?: string }> = ({
	projectKey,
	theme,
	name,
	settings,
	snippet,
	currency,
	height = '420px',
}) => {
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
					`<script src="${API_ORIGIN}/public/mint.js" data-key="${projectKey}" onerror="window.__mintFailed=1"></script></head>` +
					`<body><div style="display:flex;justify-content:flex-end;align-items:center;gap:10px;flex-wrap:wrap">${snippet}</div>` +
					`<p id="failed" hidden style="font-size:13px;opacity:.7">The preview couldn’t load mint.js from ${API_ORIGIN}.</p>` +
					`<script>if(window.__mintFailed)document.getElementById('failed').hidden=false</script></body></html>`
			);
		}, 350);
		return () => clearTimeout(t);
	}, [config, dark, projectKey, snippet]);
	return (
		<Box>
			<Flex
				justify='space-between'
				align='center'
				mb={1.5}>
				<Text
					fontSize='12px'
					color='fg.muted'>
					Preview
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
				h={height}
				borderWidth='1px'
				borderColor='border'
				borderRadius='md'
				bg={dark ? '#111113' : '#f5f5f4'}
			/>
		</Box>
	);
};

export const OptionInput: FC<{ o: WidgetType['options'][number]; value: any; onChange: (v: any) => void }> = ({ o, value, onChange }) => {
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

/** Where to put a widget, under its snippet. */
export const SnippetHelp: FC<{ name: string }> = ({ name }) => (
	<Text {...help}>
		Anywhere in your HTML, as many times as you like. Add <code>data-</code> attributes to change an option there, e.g.{' '}
		<code>data-layout=&quot;button&quot;</code>.
		{name === 'login' && (
			<>
				{' '}
				For a login just for one customer role, e.g. a sellers’ page: <code>data-customer-role=&quot;seller&quot;</code>.
			</>
		)}
		{name === 'cart' && (
			<>
				{' '}
				Put <code>data-mint-add</code> on any button with the product’s id (its record’s ID) — add <code>data-mint-variant=&quot;Large&quot;</code> to skip
				the variant picker.
			</>
		)}
	</Text>
);
