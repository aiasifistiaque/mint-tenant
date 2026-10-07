'use client';

import { FC, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge, Box, Button, Checkbox, Flex, Text } from '@chakra-ui/react';
import { ExternalLink, Settings2 } from 'lucide-react';
import {
	Layout,
	useDeleteBuiltModelMutation,
	useGetBuiltModelQuery,
	useGetModelBuilderOptionsQuery,
	useUpdateBuiltModelMutation,
} from '@/components/library';
import { ConfirmAction, DetailSkeleton, ErrorState, PageHeader, Panel, when } from '@/components/library/cl';
import { toaster } from '@/components/ui/toaster';
import ModelPanels, { ModelWorking, modelBody, modelFromDoc, useFieldErrors } from './ModelPanels';
import { HOME } from '@/components/library/config/lib/constants/panel';

/**
 * Edit a model built in the model builder: its title, record code and
 * fields; disable or delete it. Saving recompiles the model and its route at
 * once. New models are made in the wizard (/model-builder/new).
 *
 * The name, route and collection are fixed once created (other models link
 * to it by name, and the collection holds its records); the title isn't.
 */

const signature = (w: ModelWorking | null) => (w ? JSON.stringify(modelBody(w)) : '');

const ModelEditor: FC<{ id: string }> = ({ id }) => {
	const router = useRouter();
	const { data, isLoading, isError, error, refetch } = useGetBuiltModelQuery(id);
	const { data: options } = useGetModelBuilderOptionsQuery();
	const [update, { isLoading: updating }] = useUpdateBuiltModelMutation();
	const [remove, { isLoading: removing }] = useDeleteBuiltModelMutation();

	const doc = data?.doc;
	const [working, setWorking] = useState<ModelWorking | null>(null);
	const [base, setBase] = useState<ModelWorking | null>(null);
	const [confirm, setConfirm] = useState<null | 'delete' | 'disable'>(null);
	const [dropData, setDropData] = useState(false);
	const [problems, setProblems] = useState<string[]>([]);

	useEffect(() => {
		if (!doc) return;
		const w = modelFromDoc(doc);
		setWorking(w);
		setBase(w);
	}, [doc]);

	const errors = useFieldErrors(working?.fields || [], !!working?.access?.enabled);
	const isDirty = signature(working) !== signature(base);
	const busy = updating || removing;

	if (isLoading)
		return (
			<Layout
				title='Loading…'
				path='model-builder'>
				<DetailSkeleton />
			</Layout>
		);
	if (isError || !doc)
		return (
			<Layout
				title='Models'
				path='model-builder'>
				<ErrorState
					error={error}
					onRetry={refetch}
				/>
			</Layout>
		);
	if (!working) return null;

	const apply = (res: any) => {
		const w = modelFromDoc({ ...res.doc, sidebarCategory: working.sidebarCategory });
		setWorking(w);
		setBase(w);
	};

	const save = async () => {
		setProblems([]);
		if (!working.title.trim()) return toaster.create({ title: 'Give the model a title', type: 'error' });
		if (Object.keys(errors).length)
			return toaster.create({ title: 'Some fields need attention', description: 'They’re marked in red.', type: 'error' });
		try {
			const res = await update({ id, body: modelBody(working) }).unwrap();
			apply(res);
			toaster.create({
				title: 'Model saved',
				description: [
					'The route, its form and table follow at once.',
					res.codesAssigned ? `${res.codesAssigned} existing records got a code.` : '',
					...(res.warnings || []),
				]
					.filter(Boolean)
					.join(' '),
				type: res.warnings?.length ? 'warning' : 'success',
			});
		} catch (e: any) {
			setProblems(e?.data?.problems || []);
			toaster.create({ title: e?.data?.message || 'Could not save the model', type: 'error' });
		}
	};

	const onDelete = async () => {
		try {
			const res = await remove({ id, dropData }).unwrap();
			toaster.create({ title: res.message, type: 'success' });
			router.replace('/model-builder');
		} catch (e: any) {
			setProblems(e?.data?.problems || []);
			toaster.create({ title: e?.data?.message || 'Could not delete the model', type: 'error' });
		}
		setConfirm(null);
	};

	return (
		<Layout
			title={doc.title}
			path='model-builder'>
			<Flex
				direction='column'
				gap={5}
				pb={10}>
				<PageHeader
					breadcrumbs={[
						{ href: HOME, title: 'Home' },
						{ href: '/builder', title: 'Routes' },
						{ href: '/model-builder', title: 'Models' },
						{ href: `/model-builder/${id}`, title: doc.title },
					]}
					title={doc.title}
					badge={
						<Flex gap={1.5}>
							{doc.error ? (
								<Badge
									colorPalette='red'
									variant='subtle'>
									Not registered
								</Badge>
							) : !doc.active ? (
								<Badge variant='outline'>Disabled</Badge>
							) : null}
							{isDirty && (
								<Badge
									colorPalette='blue'
									variant='subtle'>
									Unsaved
								</Badge>
							)}
						</Flex>
					}
					meta={`${doc.name} · /${doc.route} · ${doc.records ?? '—'} records · v${doc.version} · updated ${when(doc.updatedAt)}`}
					actions={
						<>
							{doc.active && !doc.error && (
								<>
									<Button
										size='sm'
										variant='ghost'
										asChild>
										<a
											href={`/${doc.route}`}
											target='_blank'
											rel='noopener noreferrer'>
											<ExternalLink size={14} />
											Open page
										</a>
									</Button>
									<Button
										size='sm'
										variant='outline'
										onClick={() => router.push(`/builder/${doc.route}`)}>
										<Settings2 size={14} />
										Table, form & view
									</Button>
								</>
							)}
							{isDirty && (
								<Button
									size='sm'
									variant='ghost'
									disabled={busy}
									onClick={() => setWorking(base)}>
									Undo changes
								</Button>
							)}
							<Button
								size='sm'
								loading={updating}
								disabled={busy || !isDirty}
								onClick={save}>
								Save
							</Button>
						</>
					}
				/>

				{doc.error && (
					<Panel title='This model isn’t registered'>
						<Text
							fontSize='sm'
							color='red.fg'>
							{doc.error}
						</Text>
					</Panel>
				)}

				{problems.length > 0 && (
					<Panel title='The server refused the model'>
						<Box
							as='ul'
							pl={5}
							fontSize='sm'
							listStyleType='disc'>
							{problems.map(p => (
								<li key={p}>{p}</li>
							))}
						</Box>
					</Panel>
				)}

				<ModelPanels
					working={working}
					onChange={setWorking}
					mode='edit'
					doc={doc}
					base={base}
					targets={options?.targets || []}
					categories={options?.categories || []}
					showSidebar
				/>

				<Panel
					title='Links'
					subtitle='Models that link to this one.'>
					{doc.referencedBy?.length ? (
						<Flex
							gap={2}
							flexWrap='wrap'>
							{doc.referencedBy.map((r: any) => (
								<Button
									key={r._id}
									size='xs'
									variant='outline'
									onClick={() => router.push(`/model-builder/${r._id}`)}>
									{r.title} · {r.name}
								</Button>
							))}
						</Flex>
					) : (
						<Text
							fontSize='sm'
							color='fg.muted'>
							No built model links here yet. Code models can too, with <code>ref: &apos;{doc.name}&apos;</code>.
						</Text>
					)}
				</Panel>

				<Panel
					title='Availability'
					subtitle='Disabling takes the route and page away; the records, and links to them, stay.'>
					<Flex
						gap={3}
						flexWrap='wrap'>
						<Button
							size='sm'
							variant='outline'
							disabled={busy || isDirty}
							title={isDirty ? 'Save or undo your changes first' : undefined}
							onClick={() => setConfirm('disable')}>
							{doc.active ? 'Disable model' : 'Enable model'}
						</Button>
						<Button
							size='sm'
							variant='outline'
							colorPalette='red'
							disabled={busy}
							onClick={() => {
								setDropData(false);
								setConfirm('delete');
							}}>
							Delete model
						</Button>
					</Flex>
				</Panel>
			</Flex>

			<ConfirmAction
				isOpen={confirm === 'disable'}
				onClose={() => setConfirm(null)}
				isLoading={updating}
				title={doc.active ? `Disable ${doc.title}?` : `Enable ${doc.title}?`}
				consequence={
					doc.active
						? `/${doc.route} stops answering and its page goes away. The ${doc.records ?? ''} records stay, and records of other models that link to them still show them.`
						: `/${doc.route} and its page come back, as they were.`
				}
				confirmLabel={doc.active ? 'Disable' : 'Enable'}
				onConfirm={async () => {
					try {
						apply(await update({ id, body: { ...modelBody(working), active: !doc.active } }).unwrap());
					} catch (e: any) {
						toaster.create({ title: e?.data?.message || 'Could not change it', type: 'error' });
					}
					setConfirm(null);
				}}
			/>
			<ConfirmAction
				isOpen={confirm === 'delete'}
				onClose={() => setConfirm(null)}
				isLoading={removing}
				destructive
				title={`Delete ${doc.title}?`}
				consequence={`The model, its route and page, its route-builder settings, its permission and its sidebar entry are removed.${
					dropData
						? ' Its records are deleted too, permanently.'
						: ' Its records stay in the database, so the name stays taken until they’re removed.'
				}`}
				confirmLabel={dropData ? 'Delete model and records' : 'Delete model'}
				typeToConfirm={dropData ? doc.name : undefined}
				onConfirm={onDelete}>
				<Checkbox.Root
					mt={3}
					checked={dropData}
					onCheckedChange={e => setDropData(!!e.checked)}>
					<Checkbox.HiddenInput />
					<Checkbox.Control />
					<Checkbox.Label>Also delete its {doc.records ?? ''} records</Checkbox.Label>
				</Checkbox.Root>
			</ConfirmAction>
		</Layout>
	);
};

export default ModelEditor;
