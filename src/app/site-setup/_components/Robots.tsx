'use client';

import { FC, useEffect, useState } from 'react';
import { Box, Button, Flex, Grid, Text } from '@chakra-ui/react';
import { CircleAlert, CircleX, Info } from 'lucide-react';
import GuideLink from '@/components/library/tenant/GuideLink';
import { usePreviewRobotsMutation, type RobotsPreview, type SiteConfig } from '@/components/library/store/services/tenantApi';
import { SettingCard, TextField, Toggle, changed, useDraft, useSave } from './parts';

/**
 * Site setup → SEO → robots.txt (backend docs/seo SEO-09): built for you — extra rules and a switch per crawler
 * (search engines and AI crawlers) — or the whole file as written. The file the settings make, and its mistakes,
 * are shown as you edit (POST /site-config/robots-preview).
 */

type Props = { config: SiteConfig; canBuild: boolean };

const Mode: FC<{ value: 'built' | 'custom'; onChange: (v: 'built' | 'custom') => void; disabled?: boolean }> = ({ value, onChange, disabled }) => (
	<Flex
		gap={1}
		p={1}
		bg='bg.muted'
		borderRadius='full'
		w='fit-content'
		maxW='full'
		wrap='wrap'>
		{(
			[
				['built', 'Built for you'],
				['custom', 'Write the whole file'],
			] as const
		).map(([v, label]) => (
			<Button
				key={v}
				size='xs'
				borderRadius='full'
				px={3}
				disabled={disabled}
				variant={value === v ? 'solid' : 'ghost'}
				onClick={() => onChange(v)}
				{...{ 'aria-pressed': value === v }}>
				{label}
			</Button>
		))}
	</Flex>
);

const Problems: FC<{ preview?: RobotsPreview }> = ({ preview }) => {
	if (!preview) return null;
	const items = [
		...preview.problems.map(p => ({ icon: p.level === 'error' ? CircleX : CircleAlert, color: p.level === 'error' ? 'red.fg' : 'orange.fg', text: p.message })),
		...preview.notes.map(n => ({ icon: Info, color: 'fg.muted', text: n })),
	];
	if (!items.length)
		return (
			<Text
				fontSize='12px'
				color='green.fg'>
				No problems found.
			</Text>
		);
	return (
		<Flex
			direction='column'
			gap={1.5}>
			{items.map((it, i) => (
				<Flex
					key={i}
					gap={2}
					align='flex-start'>
					<Box
						color={it.color}
						mt='2px'
						flexShrink={0}>
						<it.icon size={14} />
					</Box>
					<Text fontSize='12.5px'>{it.text}</Text>
				</Flex>
			))}
		</Flex>
	);
};

export const RobotsCard: FC<Props> = ({ config, canBuild }) => {
	const s = config.seo;
	const saved = { robotsMode: s.robotsMode || 'built', robotsFile: s.robotsFile || '', robotsBlock: s.robotsBlock || [], robots: s.robots || '' };
	const { draft, set, reset, dirty } = useDraft(saved);
	const { save, saving, error } = useSave('robots.txt');

	// The file as it would be, a moment after each change.
	const [preview, { data }] = usePreviewRobotsMutation();
	const [shown, setShown] = useState<RobotsPreview>();
	const key = JSON.stringify(draft);
	useEffect(() => {
		const t = setTimeout(() => preview(draft).unwrap().then(setShown).catch(() => {}), 300);
		return () => clearTimeout(t);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [key]);
	const crawlers = (shown || data)?.crawlers || [];

	// Writing the whole file starts from the one built for you.
	const toMode = (robotsMode: 'built' | 'custom') => set(robotsMode === 'custom' && !draft.robotsFile.trim() && shown?.mode === 'built' ? { robotsMode, robotsFile: shown.text } : { robotsMode });
	const block = (id: string, blocked: boolean) => set({ robotsBlock: blocked ? [...draft.robotsBlock.filter(x => x !== id), id] : draft.robotsBlock.filter(x => x !== id) });

	const group = (kind: 'search' | 'ai', title: string, hint: string) => (
		<Box>
			<Text
				fontSize='12px'
				fontWeight='600'
				textTransform='uppercase'
				letterSpacing='wide'
				color='fg.muted'>
				{title}
			</Text>
			<Text
				fontSize='12px'
				color='fg.muted'
				mb={3}>
				{hint}
			</Text>
			<Grid
				templateColumns={{ base: '1fr', md: '1fr 1fr' }}
				gap={4}>
				{crawlers
					.filter(c => c.kind === kind)
					.map(c => (
						<Toggle
							key={c.id}
							label={`${c.agent} · ${c.owner}`}
							help={draft.robotsBlock.includes(c.id) ? `Blocked. ${c.about}.` : `${c.about}.`}
							checked={!draft.robotsBlock.includes(c.id)}
							disabled={!canBuild}
							onChange={allowed => block(c.id, !allowed)}
						/>
					))}
			</Grid>
		</Box>
	);

	return (
		<SettingCard
			id='robots'
			title='robots.txt'
			description='Tells search engines and AI crawlers what they may read. Built for you from the settings above, or written by you in full.'
			aside={<GuideLink section='robots' />}
			dirty={dirty}
			saving={saving}
			error={error}
			disabled={!canBuild}
			onReset={reset}
			onSave={() => save({ seo: changed(draft, saved) })}>
			<Flex
				direction='column'
				gap={5}>
				<Mode
					value={draft.robotsMode}
					onChange={toMode}
					disabled={!canBuild}
				/>
				{draft.robotsMode === 'built' ? (
					<>
						{!s.indexing && (
							<Text
								fontSize='12.5px'
								color='fg.muted'>
								Indexing is off, so the file blocks everything and these switches wait until it’s on.
							</Text>
						)}
						{group('search', 'Search engines', 'Blocking one takes the site out of its search results.')}
						{group('ai', 'AI crawlers', 'Block the ones you don’t want reading your site. Search results aren’t affected.')}
						<TextField
							label='Extra rules'
							help='Added under the defaults for every crawler, e.g. “Disallow: /private”'
							long
							mono
							rows={3}
							value={draft.robots}
							onChange={robots => set({ robots })}
						/>
					</>
				) : (
					<TextField
						label='Your robots.txt'
						help='Served exactly as written. The settings above (indexing, the sitemap line) don’t change it.'
						long
						mono
						rows={12}
						value={draft.robotsFile}
						onChange={robotsFile => set({ robotsFile })}
					/>
				)}

				<Box>
					<Text
						fontSize='13px'
						fontWeight='600'
						mb={2}>
						{draft.robotsMode === 'built' ? 'The file' : 'Check'}
					</Text>
					{draft.robotsMode === 'built' && (
						<Box
							as='pre'
							fontFamily='mono'
							fontSize='12px'
							bg='bg.muted'
							borderRadius='md'
							p={3}
							mb={3}
							whiteSpace='pre-wrap'
							wordBreak='break-all'
							maxH='260px'
							overflowY='auto'>
							{shown?.text ?? '…'}
						</Box>
					)}
					<Problems preview={shown} />
				</Box>
			</Flex>
		</SettingCard>
	);
};
