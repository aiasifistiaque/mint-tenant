'use client';

import { FC, useState } from 'react';
import { Box, Button, Flex, Grid, Text } from '@chakra-ui/react';
import { PromptDialog, VColor, VImage, useDeleteBuiltModelMutation } from '@/components/library';
import GuideLink from '@/components/library/tenant/GuideLink';
import type { SiteConfig } from '@/components/library/store/services/tenantApi';
import { SettingCard, TextField, changed, errorText, imageValue, useDraft, useSave } from './parts';

/** General: who the site is — name, logo, favicon, footer — and its look. */

type Props = { config: SiteConfig; canBuild: boolean };

const Branding: FC<Props> = ({ config, canBuild }) => {
	const saved = config.identity;
	const { draft, set, reset, dirty } = useDraft({
		siteName: saved.siteName,
		tagline: saved.tagline,
		logo: saved.logo,
		favicon: saved.favicon,
		footerText: saved.footerText,
	});
	const { save, saving, error } = useSave('Branding');
	return (
		<SettingCard
			id='branding'
			title='Branding'
			description='Your site’s name, logo and favicon — in its header, its browser tab and its footer.'
			aside={<GuideLink section='site-general' />}
			dirty={dirty}
			saving={saving}
			error={error}
			disabled={!canBuild}
			onReset={reset}
			onSave={() => save({ identity: changed(draft, saved as any) })}>
			<Grid
				templateColumns={{ base: '1fr', md: '1fr 1fr' }}
				gap={4}>
				<TextField
					label='Site name'
					value={draft.siteName}
					onChange={siteName => set({ siteName })}
				/>
				<TextField
					label='Tagline'
					help='A line under the name, if your design has one'
					value={draft.tagline}
					onChange={tagline => set({ tagline })}
				/>
				<VImage
					label='Logo'
					value={draft.logo}
					onChange={(v: any) => set({ logo: imageValue(v) })}
					folder='website'
				/>
				<VImage
					label='Favicon'
					helper='A square image — 512×512 works everywhere'
					value={draft.favicon}
					onChange={(v: any) => set({ favicon: imageValue(v) })}
					folder='website'
				/>
				<Box gridColumn={{ md: 'span 2' }}>
					<TextField
						label='Footer text'
						long
						value={draft.footerText}
						onChange={footerText => set({ footerText })}
					/>
				</Box>
			</Grid>
		</SettingCard>
	);
};

const Theme: FC<Props> = ({ config, canBuild }) => {
	const saved = config.identity;
	const { draft, set, reset, dirty } = useDraft({ primaryColor: saved.primaryColor, secondaryColor: saved.secondaryColor, fontFamily: saved.fontFamily });
	const { save, saving, error } = useSave('Theme');
	return (
		<SettingCard
			title='Theme'
			description='The colours and font your site’s design uses.'
			dirty={dirty}
			saving={saving}
			error={error}
			disabled={!canBuild}
			onReset={reset}
			onSave={() => save({ identity: changed(draft, saved as any) })}>
			<Grid
				templateColumns={{ base: '1fr', md: '1fr 1fr 1fr' }}
				gap={4}>
				<VColor
					label='Primary colour'
					name='primaryColor'
					value={draft.primaryColor}
					onChange={(e: any) => set({ primaryColor: e.target.value })}
				/>
				<VColor
					label='Secondary colour'
					name='secondaryColor'
					value={draft.secondaryColor}
					onChange={(e: any) => set({ secondaryColor: e.target.value })}
				/>
				<TextField
					label='Font'
					help='A Google Font name, e.g. Inter'
					value={draft.fontFamily}
					onChange={fontFamily => set({ fontFamily })}
				/>
			</Grid>
		</SettingCard>
	);
};

/**
 * A website made before WO-38 still has the kit's Site settings table; its
 * record was copied here, so the table can go (its records are kept in the
 * database, just no longer a page).
 */
const LegacyTable: FC<Props> = ({ config, canBuild }) => {
	const [asking, setAsking] = useState(false);
	const [remove, { isLoading, error }] = useDeleteBuiltModelMutation();
	if (!config.legacy) return null;
	return (
		<Flex
			align='center'
			gap={3}
			p={4}
			borderWidth='1px'
			borderColor='orange.muted'
			bg='orange.subtle'
			borderRadius='md'
			wrap='wrap'>
			<Box
				flex={1}
				minW='240px'
				fontSize='12.5px'>
				<Text fontWeight='600'>The old “{config.legacy.title}” table isn’t used any more</Text>
				<Text color='fg.muted'>Its record was copied to this page, which is where your site’s settings live now. Remove the table from the sidebar.</Text>
				{error ? <Text color='red.fg'>{errorText(error)}</Text> : null}
			</Box>
			<Button
				size='sm'
				variant='outline'
				disabled={!canBuild}
				onClick={() => setAsking(true)}>
				Remove the table
			</Button>
			<PromptDialog
				open={asking}
				onClose={() => setAsking(false)}
				title='Remove the old Site settings table?'
				description='Its page leaves the sidebar and the site API stops serving it. Everything in it is already on Site setup; its records stay in the database.'
				subject={config.legacy.title}
				confirmLabel='Remove'
				loading={isLoading}
				onConfirm={async () => {
					const res: any = await remove({ id: config.legacy!._id });
					setAsking(false);
					// The sidebar is built on the server: reload to drop the table from it.
					if ('data' in res) window.location.reload();
				}}
			/>
		</Flex>
	);
};

export const GeneralTab: FC<Props> = props => (
	<Flex
		direction='column'
		gap={4}>
		<LegacyTable {...props} />
		<Branding {...props} />
		<Theme {...props} />
	</Flex>
);

/* ---------------------------------------------------- contact & social */

export const CONTACT: { key: keyof SiteConfig['contact']; label: string; placeholder?: string; help?: string; long?: boolean }[] = [
	{ key: 'email', label: 'Email', placeholder: 'hello@example.com' },
	{ key: 'phone', label: 'Phone', placeholder: '+880 1…' },
	{ key: 'whatsapp', label: 'WhatsApp', placeholder: '+880 1…', help: 'The number for a “Chat on WhatsApp” button' },
	{ key: 'hours', label: 'Opening hours', placeholder: 'Sat–Thu, 10am–8pm' },
	{ key: 'address', label: 'Address', long: true },
	{ key: 'mapEmbedUrl', label: 'Map embed URL', placeholder: 'https://www.google.com/maps/embed?…', help: 'Google Maps → Share → Embed a map → the src address' },
];

export const SOCIAL: { key: keyof SiteConfig['social']; label: string; placeholder: string }[] = [
	{ key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/…' },
	{ key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/…' },
	{ key: 'x', label: 'X (Twitter)', placeholder: 'https://x.com/…' },
	{ key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/company/…' },
	{ key: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/@…' },
	{ key: 'tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@…' },
	{ key: 'pinterest', label: 'Pinterest', placeholder: 'https://pinterest.com/…' },
];

const Contact: FC<Props> = ({ config, canBuild }) => {
	const saved = config.contact;
	const { draft, set, reset, dirty } = useDraft(saved);
	const { save, saving, error } = useSave('Contact details');
	return (
		<SettingCard
			id='contact'
			title='Contact details'
			description='Shown in your site’s footer and on its contact page.'
			aside={<GuideLink section='site-contact' />}
			dirty={dirty}
			saving={saving}
			error={error}
			disabled={!canBuild}
			onReset={reset}
			onSave={() => save({ contact: changed(draft, saved) })}>
			<Grid
				templateColumns={{ base: '1fr', md: '1fr 1fr' }}
				gap={4}>
				{CONTACT.map(f => (
					<Box
						key={f.key}
						gridColumn={f.long ? { md: 'span 2' } : undefined}>
						<TextField
							label={f.label}
							help={f.help}
							placeholder={f.placeholder}
							long={f.long}
							value={draft[f.key]}
							onChange={v => set({ [f.key]: v })}
						/>
					</Box>
				))}
			</Grid>
		</SettingCard>
	);
};

const Social: FC<Props> = ({ config, canBuild }) => {
	const saved = config.social;
	const { draft, set, reset, dirty } = useDraft(saved);
	const { save, saving, error } = useSave('Social links');
	return (
		<SettingCard
			title='Social links'
			description='Full addresses of your pages — your site links to the ones you fill in.'
			dirty={dirty}
			saving={saving}
			error={error}
			disabled={!canBuild}
			onReset={reset}
			onSave={() => save({ social: changed(draft, saved) })}>
			<Grid
				templateColumns={{ base: '1fr', md: '1fr 1fr' }}
				gap={4}>
				{SOCIAL.map(f => (
					<TextField
						key={f.key}
						label={f.label}
						placeholder={f.placeholder}
						value={draft[f.key]}
						onChange={v => set({ [f.key]: v.trim() })}
					/>
				))}
			</Grid>
		</SettingCard>
	);
};

export const ContactTab: FC<Props> = props => (
	<Flex
		direction='column'
		gap={4}>
		<Contact {...props} />
		<Social {...props} />
	</Flex>
);
