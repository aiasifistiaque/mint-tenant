'use client';

import { useEffect, useMemo, useState } from 'react';
import { Box, Button, Flex, IconButton, Link, Text } from '@chakra-ui/react';
import { BarChart3, BookOpen, Copy, Hash, LayoutTemplate, ListOrdered, Pencil, RotateCcw, Save, Trash2, Undo2 } from 'lucide-react';
import { Layout, useGetDashboardQuery, useResetDashboardMutation, useSaveDashboardMutation } from '@/components/library';
import { ConfirmAction, DetailSkeleton, EmptyState, ErrorState, PageHeader } from '@/components/library/cl';
import { toaster } from '@/components/ui/toaster';
import { DashboardGrid } from '@/components/library/dashboard/widgets';
import { TYPE_LABEL, Widget, WidgetType, newId, newWidget } from '@/components/library/dashboard/types';
import WidgetDialog from './_components/WidgetDialog';
import { DocLink, GUIDE } from './_components/ui';
import { HOME, IS_TENANT_PANEL } from '@/components/library/config/lib/constants/panel';

const ICON = { size: 14, strokeWidth: 1.75 };
/** "1 number", "3 charts"; nothing for none. */
const plural = (n: number, word: string) => (n ? `${n} ${word}${n === 1 ? '' : 's'}` : '');
const ADD: { type: WidgetType; icon: any; label: string }[] = [
	{ type: 'stat', icon: Hash, label: 'Number' },
	{ type: 'chart', icon: BarChart3, label: 'Chart' },
	{ type: 'recent', icon: ListOrdered, label: 'Recent items' },
	// Template Studio's overview — only the super admin panel has templates (T-11). No settings: added as it is.
	...(IS_TENANT_PANEL ? [] : [{ type: 'templates' as WidgetType, icon: LayoutTemplate, label: 'Templates overview' }]),
];

/**
 * The dashboard, edited in place: its widgets drawn with live numbers, each
 * with edit / duplicate / remove, dragged into order. Changes stay here until
 * Save, which replaces the dashboard every admin sees (backend /dashboard).
 * With nothing saved, the dashboard shows its built-in cards.
 */
const DashboardBuilderPage = () => {
	const { data, isLoading, error, refetch } = useGetDashboardQuery();
	const [saveDashboard, { isLoading: saving }] = useSaveDashboardMutation();
	const [resetDashboard, { isLoading: resetting }] = useResetDashboardMutation();

	const base: Widget[] = useMemo(() => data?.widgets || [], [data]);
	const [widgets, setWidgets] = useState<Widget[]>([]);
	const [editing, setEditing] = useState<{ widget: Widget; isNew: boolean } | null>(null);
	const [removing, setRemoving] = useState<Widget | null>(null);
	const [confirmReset, setConfirmReset] = useState(false);
	const [dragIndex, setDragIndex] = useState<number | null>(null);
	const [overIndex, setOverIndex] = useState<number | null>(null);

	// A fresh load (first visit, or after a save) replaces the working copy.
	useEffect(() => setWidgets(base), [base]);
	const dirty = JSON.stringify(widgets) !== JSON.stringify(base);

	// Leaving with unsaved changes asks first.
	useEffect(() => {
		if (!dirty) return;
		const warn = (e: BeforeUnloadEvent) => {
			e.preventDefault();
			e.returnValue = '';
		};
		window.addEventListener('beforeunload', warn);
		return () => window.removeEventListener('beforeunload', warn);
	}, [dirty]);

	const save = async () => {
		try {
			await saveDashboard({ widgets }).unwrap();
			toaster.create({ title: 'Dashboard saved', description: 'Every admin sees it now', type: 'success' });
		} catch (e: any) {
			toaster.create({ title: 'Could not save the dashboard', description: e?.data?.message, type: 'error' });
		}
	};

	const reset = async () => {
		try {
			await resetDashboard().unwrap();
			setConfirmReset(false);
			toaster.create({ title: 'Back to the built-in dashboard', type: 'success' });
		} catch (e: any) {
			toaster.create({ title: 'Could not reset the dashboard', description: e?.data?.message, type: 'error' });
		}
	};

	const done = (w: Widget) => {
		setWidgets(list => (list.some(x => x.id === w.id) ? list.map(x => (x.id === w.id ? w : x)) : [...list, w]));
		setEditing(null);
	};

	const drop = (index: number) => {
		if (dragIndex !== null && dragIndex !== index)
			setWidgets(list => {
				const next = [...list];
				const [moved] = next.splice(dragIndex, 1);
				next.splice(index, 0, moved);
				return next;
			});
		setDragIndex(null);
		setOverIndex(null);
	};

	const actions = (w: Widget, index: number) => (
		<>
			{w.type === 'templates' ? (
				// Nothing to set on it but its width.
				<IconButton
					size='2xs'
					variant='ghost'
					aria-label={w.size === 'full' ? 'Make it half width' : 'Make it full width'}
					title={w.size === 'full' ? 'Half width' : 'Full width'}
					onClick={() => setWidgets(list => list.map(x => (x.id === w.id ? { ...x, size: x.size === 'full' ? 'lg' : 'full' } : x)))}>
					<Pencil {...ICON} />
				</IconButton>
			) : (
				<IconButton
					size='2xs'
					variant='ghost'
					aria-label='Edit widget'
					title='Edit'
					onClick={() => setEditing({ widget: w, isNew: false })}>
					<Pencil {...ICON} />
				</IconButton>
			)}
			<IconButton
				size='2xs'
				variant='ghost'
				aria-label='Duplicate widget'
				title='Duplicate'
				onClick={() =>
					setWidgets(list => [...list.slice(0, index + 1), { ...w, id: newId(), title: w.title ? `${w.title} (copy)` : '' }, ...list.slice(index + 1)])
				}>
				<Copy {...ICON} />
			</IconButton>
			<IconButton
				size='2xs'
				variant='ghost'
				aria-label='Remove widget'
				title='Remove'
				color='red.500'
				_dark={{ color: 'red.300' }}
				onClick={() => setRemoving(w)}>
				<Trash2 {...ICON} />
			</IconButton>
		</>
	);

	const count = (t: WidgetType) => widgets.filter(w => w.type === t).length;

	return (
		<Layout
			title='Dashboard Builder'
			path='dashboard-builder'>
			<Flex
				direction='column'
				gap={5}
				pb={dirty ? 20 : 4}>
				<PageHeader
					breadcrumbs={[
						{ href: HOME, title: 'Home' },
						{ href: '/dashboard-builder', title: 'Dashboard Builder' },
					]}
					title='Dashboard Builder'
					meta={
						isLoading
							? 'Choose what the dashboard shows'
							: `${
									widgets.length
										? [plural(count('stat'), 'number'), plural(count('chart'), 'chart'), plural(count('recent'), 'list')].filter(Boolean).join(' · ')
										: 'No widgets'
							  }${
									dirty ? ' · not saved' : data?.saved ? ' · everything saved' : ' · the built-in dashboard is showing'
							  }`
					}
					actions={
						<>
							{ADD.map(a => (
								<Button
									key={a.type}
									size='sm'
									variant='outline'
									disabled={isLoading || saving}
									onClick={() => (a.type === 'templates' ? setWidgets(list => [...list, newWidget('templates')]) : setEditing({ widget: newWidget(a.type), isNew: true }))}>
									<a.icon {...ICON} />
									Add {a.label.toLowerCase()}
								</Button>
							))}
							{data?.saved && (
								<Button
									size='sm'
									variant='ghost'
									disabled={saving || resetting}
									onClick={() => setConfirmReset(true)}>
									<Undo2 {...ICON} />
									Built-in dashboard
								</Button>
							)}
							<Link
								href={GUIDE}
								target='_blank'
								rel='noopener noreferrer'>
								<Button
									size='sm'
									variant='ghost'>
									<BookOpen {...ICON} />
									Guide
								</Button>
							</Link>
						</>
					}
				/>

				<Flex
					align='center'
					justify='space-between'
					gap={3}
					flexWrap='wrap'>
					<Text
						fontSize='sm'
						color='fg.muted'>
						The dashboard as every admin will see it, with live numbers. Drag a widget to move it; the pencil edits it.
						Each admin only sees widgets for the pages they may open. Nothing changes until you press{' '}
						<strong>Save changes</strong>.
					</Text>
					<DocLink section='layout' />
				</Flex>

				{isLoading ? (
					<DetailSkeleton />
				) : error ? (
					<ErrorState
						error={error}
						onRetry={refetch}
					/>
				) : widgets.length ? (
					<DashboardGrid
						widgets={widgets}
						editing={{
							actions,
							dragIndex,
							overIndex,
							onDragStart: setDragIndex,
							onDragOver: i => setOverIndex(o => (o === i ? o : i)),
							onDrop: drop,
							onDragEnd: () => {
								setDragIndex(null);
								setOverIndex(null);
							},
						}}
					/>
				) : (
					<Box
						borderWidth='1px'
						borderStyle='dashed'
						borderColor='border'
						borderRadius='lg'>
						<EmptyState
							title='No widgets yet'
							description={
								data?.saved
									? 'Saved empty, the dashboard shows its built-in cards. Add a number, a chart or a list of recent items.'
									: 'The dashboard shows its built-in cards until you save one here. Start with a number, a chart or a list of recent items.'
							}
							action={
								<Flex
									gap={2}
									flexWrap='wrap'
									justify='center'>
									{ADD.map(a => (
										<Button
											key={a.type}
											size='sm'
											variant='outline'
											onClick={() => (a.type === 'templates' ? setWidgets(list => [...list, newWidget('templates')]) : setEditing({ widget: newWidget(a.type), isNew: true }))}>
											<a.icon {...ICON} />
											{a.label}
										</Button>
									))}
								</Flex>
							}
						/>
					</Box>
				)}
			</Flex>

			{/* Save bar — only while something is unsaved. */}
			{dirty && (
				<Flex
					position='fixed'
					bottom={4}
					left='50%'
					transform='translateX(-50%)'
					zIndex={20}
					align='center'
					gap={3}
					px={4}
					py={2.5}
					bg='bg.panel'
					borderWidth='1px'
					borderColor='border'
					borderRadius='lg'
					boxShadow='lg'
					maxW='calc(100vw - 32px)'>
					<Text
						fontSize='sm'
						fontWeight='500'>
						{saving ? 'Saving…' : 'Changes not saved'}
					</Text>
					<DocLink
						section='saving'
						label='What happens?'
					/>
					<Button
						size='sm'
						variant='ghost'
						disabled={saving}
						onClick={() => setWidgets(base)}>
						<RotateCcw {...ICON} />
						Discard
					</Button>
					<Button
						size='sm'
						loading={saving}
						loadingText='Saving'
						onClick={save}>
						<Save {...ICON} />
						Save changes
					</Button>
				</Flex>
			)}

			<WidgetDialog
				widget={editing?.widget || null}
				isNew={!!editing?.isNew}
				onClose={() => setEditing(null)}
				onDone={done}
			/>

			<ConfirmAction
				isOpen={!!removing}
				onClose={() => setRemoving(null)}
				onConfirm={() => {
					setWidgets(list => list.filter(w => w.id !== removing?.id));
					setRemoving(null);
				}}
				title={`Remove this ${removing ? TYPE_LABEL[removing.type].toLowerCase() : 'widget'}?`}
				consequence='It comes off the dashboard when you save. Nothing it reads is changed.'
				confirmLabel='Remove'
				destructive
			/>

			<ConfirmAction
				isOpen={confirmReset}
				onClose={() => setConfirmReset(false)}
				onConfirm={reset}
				title='Go back to the built-in dashboard?'
				consequence='The saved widgets are deleted and every admin sees the built-in cards again. This can’t be undone.'
				confirmLabel='Reset dashboard'
				destructive
				isLoading={resetting}
			/>
		</Layout>
	);
};

export default DashboardBuilderPage;
