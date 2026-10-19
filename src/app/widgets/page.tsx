'use client';

import { FC, useEffect, useMemo, useState } from 'react';
import { Badge, Box, Button, Flex, Grid, Input, Skeleton, Switch, Text } from '@chakra-ui/react';
import { Plus } from 'lucide-react';
import { Layout, PromptDialog } from '@/components/library';
import { Dropdown, EmptyState, Panel } from '@/components/library/cl';
import { useWorkspace } from '@/components/library/tenant';
import GuideLink from '@/components/library/tenant/GuideLink';
import { toaster } from '@/components/ui/toaster';
import { useGetWidgetsAuthQuery, useGetWidgetsQuery, useGetWidgetsShopQuery, useSaveWidgetsMutation } from '@/components/library/store/services/tenantApi';
import type { WidgetTheme, WidgetType, WidgetsView } from '@/components/library/store/services/tenantApi';
import ShopPanel from './_components/ShopPanel';
import WidgetWizard, { shopMissing } from './_components/WidgetWizard';
import { Code, SHOP_WIDGETS, SnippetHelp, help, isAdded, label } from './_components/parts';

/**
 * The project's site widgets (tenant panel; docs/widgets W-04, W-24). Empty
 * until a widget is added: "Add a widget" walks through a setup wizard
 * (WidgetWizard) — which widget, what it needs, its options and texts, a
 * review — and the added ones are listed here to switch on and off, edit or
 * remove. Once there's one: the script a site adds, the look they share and,
 * with a selling widget, the Shop. Backend: routes-tenant/widgets.router.ts;
 * the catalogue is the backend's WIDGET_TYPES. Building permission (`build`).
 */

/** One added widget: on/off straight away, its code, edit and remove. */
const AddedWidget: FC<{
	type: WidgetType;
	data: WidgetsView;
	missing: string | null;
	onEdit: () => void;
	onRemove: () => void;
}> = ({ type, data, missing, onEdit, onRemove }) => {
	const value = data.widgets[type.name];
	const [save, { isLoading }] = useSaveWidgetsMutation();
	const toggle = async (enabled: boolean) => {
		try {
			await save({ widgets: { [type.name]: { enabled } } }).unwrap();
			toaster.create({ type: 'success', title: enabled ? `${type.title} is on — your site shows it within a minute.` : `${type.title} is off.` });
		} catch (e: any) {
			toaster.create({ type: 'error', title: e?.data?.message || 'Not saved — try again.' });
		}
	};
	return (
		<Panel
			title={
				<Flex
					align='center'
					gap={2}>
					{type.title}
					<Badge
						size='xs'
						variant='outline'
						colorPalette={value.enabled ? 'green' : 'gray'}>
						{value.enabled ? 'On' : 'Off'}
					</Badge>
				</Flex>
			}
			subtitle={type.summary}
			actions={
				<Flex
					align='center'
					gap={2}>
					<GuideLink section={type.guide} />
					<Switch.Root
						size='sm'
						checked={value.enabled}
						disabled={isLoading || (!value.enabled && !!missing)}
						onCheckedChange={e => toggle(!!e.checked)}
						aria-label={`Switch ${type.title} on or off`}>
						<Switch.HiddenInput />
						<Switch.Control />
					</Switch.Root>
					<Button
						size='xs'
						variant='outline'
						onClick={onEdit}>
						Edit
					</Button>
					<Button
						size='xs'
						variant='ghost'
						colorPalette='red'
						onClick={onRemove}>
						Remove
					</Button>
				</Flex>
			}>
			{missing && !value.enabled && (
				<Text
					fontSize='13px'
					color='orange.fg'
					mb={3}>
					{missing} Set it up in the Shop below, then switch this on.
				</Text>
			)}
			<Text {...label}>Put it on a page</Text>
			<Code>{type.snippet}</Code>
			<SnippetHelp name={type.name} />
		</Panel>
	);
};

/** The look every widget shares — saved on its own. */
const LookPanel: FC<{ theme: WidgetTheme; websiteProject: boolean }> = ({ theme: saved, websiteProject }) => {
	const [theme, setTheme] = useState(saved);
	const [save, { isLoading }] = useSaveWidgetsMutation();
	useEffect(() => setTheme(saved), [saved]);
	const dirty = JSON.stringify(theme) !== JSON.stringify(saved);
	const set = (patch: Partial<WidgetTheme>) => setTheme(t => ({ ...t, ...patch }));
	const onSave = async () => {
		try {
			await save({ theme }).unwrap();
			toaster.create({ type: 'success', title: 'Look saved — your site shows it within a minute.' });
		} catch (e: any) {
			toaster.create({ type: 'error', title: e?.data?.message || 'Not saved — try again.' });
		}
	};
	return (
		<Panel
			title='Look'
			subtitle='Shared by every widget'
			actions={
				<Flex
					align='center'
					gap={2}>
					<GuideLink section='look' />
					{dirty && (
						<>
							<Button
								size='xs'
								variant='ghost'
								onClick={() => setTheme(saved)}>
								Discard
							</Button>
							<Button
								size='xs'
								loading={isLoading}
								onClick={onSave}>
								Save
							</Button>
						</>
					)}
				</Flex>
			}>
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
							onChange={e => set({ primaryColor: e.target.value })}
						/>
						<Input
							size='sm'
							fontFamily='mono'
							value={theme.primaryColor}
							placeholder={websiteProject ? 'Your site’s' : '#111827'}
							onChange={e => set({ primaryColor: e.target.value.trim() })}
						/>
					</Flex>
					<Text {...help}>Buttons and links. {websiteProject ? 'Empty: the colour in Site setup.' : ''}</Text>
				</Box>
				<Box>
					<Text {...label}>Font</Text>
					<Input
						size='sm'
						value={theme.fontFamily}
						placeholder='Your site’s font'
						onChange={e => set({ fontFamily: e.target.value })}
					/>
					<Text {...help}>Empty: whatever the page uses.</Text>
				</Box>
				<Box>
					<Text {...label}>Corners</Text>
					<Input
						size='sm'
						type='number'
						min={0}
						max={24}
						value={theme.radius}
						onChange={e => set({ radius: Math.min(24, Math.max(0, Number(e.target.value) || 0)) })}
					/>
					<Text {...help}>Roundness in pixels, 0–24.</Text>
				</Box>
				<Box>
					<Text {...label}>Light or dark</Text>
					<Dropdown
						size='sm'
						value={theme.colorMode}
						onChange={v => set({ colorMode: v as WidgetTheme['colorMode'] })}
						items={[
							{ value: 'auto', label: 'Match the page' },
							{ value: 'light', label: 'Always light' },
							{ value: 'dark', label: 'Always dark' },
						]}
					/>
					<Text {...help}>Match the page: light on light pages, dark on dark ones.</Text>
				</Box>
			</Grid>
		</Panel>
	);
};

export default function WidgetsPage() {
	const { project, can, isLoading: loadingSelf } = useWorkspace();
	const allowed = can('build');
	const { data, isLoading } = useGetWidgetsQuery(undefined, { skip: !allowed });
	const { data: shop } = useGetWidgetsShopQuery(undefined, { skip: !allowed });
	const { data: auth, isError: authMissing } = useGetWidgetsAuthQuery(undefined, { skip: !allowed });
	const [save, removing] = useSaveWidgetsMutation();
	const [wizard, setWizard] = useState<{ editing: string | null } | null>(null);
	const [removal, setRemoval] = useState<WidgetType | null>(null);

	// Added widgets, in the order they were added.
	const added = useMemo(
		() =>
			(data?.catalog || [])
				.filter(t => isAdded(data?.widgets[t.name]))
				.sort((a, b) => String(data?.widgets[a.name]?.addedAt || '').localeCompare(String(data?.widgets[b.name]?.addedAt || ''))),
		[data]
	);
	const selling = added.some(t => SHOP_WIDGETS.includes(t.name));
	const currency = shop?.shop?.currency || shop?.guess?.currency;

	const remove = async () => {
		if (!removal) return;
		try {
			await save({ widgets: { [removal.name]: { added: false } } }).unwrap();
			toaster.create({ type: 'success', title: `${removal.title} removed`, description: 'Pages that still have its code show nothing there.' });
			setRemoval(null);
		} catch (e: any) {
			toaster.create({ type: 'error', title: e?.data?.message || 'Not removed — try again.' });
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

	const addButton = (
		<Button
			size='sm'
			onClick={() => setWizard({ editing: null })}
			disabled={!data || added.length === data.catalog.length}>
			<Plus size={15} />
			Add a widget
		</Button>
	);

	return (
		<Layout
			title='Widgets'
			path='widgets'>
			<Flex
				direction='column'
				gap={4}
				pb={4}>
				{isLoading || !data ? (
					<Skeleton h='240px' />
				) : added.length === 0 ? (
					<Panel
						title='Widgets'
						subtitle='Ready-made pieces for your own website or app'
						actions={<GuideLink section='add-widget' />}>
						<EmptyState
							title='No widgets yet'
							description='Add sign-in, a cart, checkout or order history to your site. A short setup walks you through each one — then you paste one line of code where it should appear.'
							action={addButton}
						/>
					</Panel>
				) : (
					<>
						<Flex
							justify='space-between'
							align='center'
							gap={3}
							wrap='wrap'>
							<Text
								fontSize='13px'
								color='fg.muted'>
								{added.length} widget{added.length === 1 ? '' : 's'} on this project · {added.filter(t => data.widgets[t.name].enabled).length} on
							</Text>
							{addButton}
						</Flex>

						{added.map(type => (
							<AddedWidget
								key={type.name}
								type={type}
								data={data}
								missing={shopMissing(type.name, shop)}
								onEdit={() => setWizard({ editing: type.name })}
								onRemove={() => setRemoval(type)}
							/>
						))}

						<Panel
							title='Add MINT to your site'
							subtitle='One script, then place widgets anywhere'
							actions={<GuideLink section='add-mint' />}>
							<Text
								fontSize='13px'
								color='fg.muted'
								lineHeight='1.6'
								mb={3}>
								Add this tag once to every page (in <code>&lt;head&gt;</code> or before <code>&lt;/body&gt;</code>), then put each widget’s code where
								it should appear. They take your colours, don’t touch your site’s styles, and your own code can use them through{' '}
								<code>window.Mint</code>.
							</Text>
							<Code>{data.script}</Code>
						</Panel>

						<LookPanel
							theme={data.theme}
							websiteProject={project?.type === 'website'}
						/>

						{selling && <ShopPanel />}
					</>
				)}
			</Flex>

			{data && wizard && (
				<WidgetWizard
					open
					onClose={() => setWizard(null)}
					data={data}
					editing={wizard.editing}
					shop={shop}
					auth={auth}
					authMissing={authMissing}
					slug={project?.publicSlug || ''}
					currency={currency}
				/>
			)}
			<PromptDialog
				open={!!removal}
				onClose={() => setRemoval(null)}
				tone='danger'
				title={`Remove ${removal?.title || 'this widget'}?`}
				description='It’s taken off your site straight away and its settings go back to the defaults. Pages that still have its code show nothing there. You can add it again any time.'
				confirmLabel='Remove'
				loading={removing.isLoading}
				onConfirm={remove}
			/>
		</Layout>
	);
}
