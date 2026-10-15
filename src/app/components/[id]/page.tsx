'use client';

import { use, useEffect, useMemo, useState } from 'react';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { Box, Button, Flex, Grid, Input, Link, Skeleton, Text, Textarea } from '@chakra-ui/react';
import { ExternalLink, Save, Trash2 } from 'lucide-react';
import {
	Layout,
	PromptDialog,
	useDeleteModelComponentMutation,
	useGetModelBuilderOptionsQuery,
	useGetModelComponentQuery,
	useSaveModelComponentMutation,
} from '@/components/library';
import { EmptyState, PageHeader, Panel } from '@/components/library/cl';
import { HOME, projectHref } from '@/components/library/config/lib/constants/panel';
import { useWorkspace } from '@/components/library/tenant';
import GuideLink from '@/components/library/tenant/GuideLink';
import { toaster } from '@/components/ui/toaster';
import FieldsEditor from '@/app/model-builder/_components/FieldsEditor';
import FormPreview from '@/app/model-builder/_components/FormPreview';
import { COMPONENT_KINDS, EditableField, fromServer, toServer, validateFields } from '@/app/model-builder/_components/modelKinds';

/**
 * A component (backend docs/cms D3): its title, its address (category.name —
 * fixed once made), and its fields, edited with the model builder's own field
 * editor (the kinds a component takes). Saving changes every model using it.
 */

const tidy = (v: string) =>
	v
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');

const Label = ({ children, hint }: { children: string; hint?: string }) => (
	<Box mb={1.5}>
		<Text
			fontSize='13px'
			fontWeight='500'>
			{children}
		</Text>
		{hint && (
			<Text
				fontSize='12px'
				color='fg.muted'>
				{hint}
			</Text>
		)}
	</Box>
);

export default function ComponentEditPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = use(params);
	const isNew = id === 'new';
	const router = useRouter();
	const { can, isLoading: loadingSelf } = useWorkspace();
	const allowed = can('build');
	const { data, isLoading, isError } = useGetModelComponentQuery(id, { skip: isNew || !allowed });
	// The project's models, for a link to records inside it (CMS-03b).
	const { data: options } = useGetModelBuilderOptionsQuery(undefined, { skip: !allowed });
	const [save, saving] = useSaveModelComponentMutation();
	const [remove, removing] = useDeleteModelComponentMutation();

	const [title, setTitle] = useState('');
	const [category, setCategory] = useState('shared');
	const [name, setName] = useState('');
	const [nameTouched, setNameTouched] = useState(false);
	const [description, setDescription] = useState('');
	const [icon, setIcon] = useState('');
	const [fields, setFields] = useState<EditableField[]>([]);
	const [saved, setSaved] = useState('');
	const [problems, setProblems] = useState<string[]>([]);
	const [tried, setTried] = useState(false);
	const [deleting, setDeleting] = useState(false);

	useEffect(() => {
		if (!data) return;
		setTitle(data.title);
		setCategory(data.category);
		setName(data.name);
		setDescription(data.description || '');
		setIcon(data.icon || '');
		const f = fromServer(data.fields);
		setFields(f);
		setSaved(JSON.stringify([data.title, data.description || '', data.icon || '', toServer(f)]));
	}, [data]);

	const errors = useMemo(() => validateFields(fields), [fields]);
	const body = { title: title.trim(), description, icon, fields: toServer(fields) };
	const dirty = isNew ? !!(title.trim() || fields.length) : JSON.stringify([body.title, description, icon, body.fields]) !== saved;
	const uid = `${tidy(category) || 'shared'}.${tidy(isNew && !nameTouched ? title : name) || 'name'}`;

	const submit = async () => {
		setTried(true);
		setProblems([]);
		if (Object.keys(errors).length) return setProblems(['Fix the fields marked in red']);
		if (!body.title) return setProblems(['Give the component a title']);
		const res = await save({
			id: isNew ? undefined : id,
			body: isNew ? { ...body, category: tidy(category) || 'shared', name: tidy(nameTouched ? name : title) } : body,
		});
		if ('error' in res) {
			const e: any = res.error;
			return setProblems(e?.data?.problems?.length ? e.data.problems : [e?.data?.message || 'Couldn’t save — try again.']);
		}
		const refreshed = (res.data as any).refreshed || [];
		toaster.create({
			type: 'success',
			title: isNew ? 'Component made' : 'Component saved',
			description: refreshed.length ? `Updated ${refreshed.map((m: any) => m.title).join(', ')}.` : undefined,
		});
		if (isNew) router.replace(projectHref(`/components/${res.data._id}`));
		else setSaved(JSON.stringify([body.title, description, icon, body.fields]));
	};

	const usedBy = data?.usedBy || [];

	return (
		<Layout
			title={isNew ? 'New component' : data?.title || 'Component'}
			path='components'>
			<Flex
				direction='column'
				gap={5}
				pb={dirty ? 20 : 0}>
				<PageHeader
					breadcrumbs={[
						{ href: HOME, title: 'Home' },
						{ href: projectHref('/components'), title: 'Components' },
						{ href: '#', title: isNew ? 'New' : data?.title || '…' },
					]}
					title={isNew ? 'New component' : data?.title || 'Component'}
					meta={isNew ? 'A group of fields any model can use — once, or as a list.' : `${data?.uid || ''} · ${data?.fields.length || 0} fields`}
					actions={
						allowed && (
							<>
								<GuideLink section='models-components' />
								{!isNew && data && (
									<Button
										size='sm'
										variant='outline'
										colorPalette='red'
										onClick={() => setDeleting(true)}>
										<Trash2 size={14} />
										Delete
									</Button>
								)}
								<Button
									size='sm'
									loading={saving.isLoading}
									disabled={!dirty}
									onClick={submit}>
									<Save size={14} />
									{isNew ? 'Make component' : 'Save changes'}
								</Button>
							</>
						)
					}
				/>
				{!loadingSelf && !allowed ? (
					<EmptyState
						title='For people who build'
						description='Roles with Build make and change components.'
					/>
				) : !isNew && isLoading ? (
					<Skeleton h='300px' />
				) : !isNew && isError ? (
					<EmptyState
						title='Component not found'
						description='It may have been deleted.'
					/>
				) : (
					<>
						{problems.length > 0 && (
							<Box
								p={3}
								borderRadius='lg'
								bg='red.subtle'
								color='red.fg'
								fontSize='13px'
								role='alert'>
								{problems.map(p => (
									<Text
										key={p}
										color='inherit'
										fontSize='inherit'>
										{p}
									</Text>
								))}
							</Box>
						)}
						<Panel
							title='About it'
							subtitle='What it’s called, and the address models name it by.'>
							<Grid
								templateColumns={{ base: '1fr', md: 'repeat(2, minmax(0, 1fr))' }}
								gap={4}>
								<Box>
									<Label hint='e.g. Button, SEO, Card, Hero'>Title</Label>
									<Input
										size='sm'
										value={title}
										onChange={e => setTitle(e.target.value)}
										placeholder='Button'
										maxLength={80}
									/>
								</Box>
								<Box>
									<Label hint={isNew ? 'category.name — fixed once it’s made' : 'Fixed once made'}>Address</Label>
									<Flex
										gap={2}
										align='center'>
										<Input
											size='sm'
											w='120px'
											fontFamily='mono'
											value={category}
											disabled={!isNew}
											onChange={e => setCategory(e.target.value)}
											aria-label='Category'
										/>
										<Text color='fg.muted'>.</Text>
										<Input
											size='sm'
											flex={1}
											fontFamily='mono'
											value={isNew && !nameTouched ? tidy(title) : name}
											disabled={!isNew}
											onChange={e => {
												setNameTouched(true);
												setName(e.target.value);
											}}
											aria-label='Name'
										/>
									</Flex>
									{isNew && (
										<Text
											fontSize='12px'
											color='fg.muted'
											mt={1}
											fontFamily='mono'>
											{uid}
										</Text>
									)}
								</Box>
								<Box gridColumn={{ md: 'span 2' }}>
									<Label>Description</Label>
									<Textarea
										size='sm'
										rows={2}
										value={description}
										onChange={e => setDescription(e.target.value)}
										placeholder='What it’s for — shown when someone picks it'
										maxLength={300}
									/>
								</Box>
								<Box>
									<Label hint='A Lucide icon’s name, shown in pickers'>Icon</Label>
									<Input
										size='sm'
										fontFamily='mono'
										value={icon}
										onChange={e => setIcon(e.target.value)}
										placeholder='mouse-pointer-click'
										maxLength={40}
									/>
									<Link
										href='https://lucide.dev/icons'
										target='_blank'
										rel='noopener noreferrer'
										fontSize='12px'
										color='fg.muted'
										mt={1}>
										Browse icons <ExternalLink size={11} />
									</Link>
								</Box>
							</Grid>
						</Panel>

						<Grid
							templateColumns={{ base: '1fr', xl: 'minmax(0, 1fr) 320px' }}
							gap={5}
							alignItems='start'>
							<Panel
								title='Fields'
								subtitle='What it holds — text, rich text, pictures, choices, links to records, a group or list of rows, or another component of plain fields.'
								actions={<GuideLink section='models-components-nesting' />}
								flush>
								<Box p={4}>
									<FieldsEditor
										fields={fields}
										onChange={setFields}
										errors={tried ? errors : {}}
										targets={options?.targets || []}
										kinds={COMPONENT_KINDS}
										inComponent={isNew ? uid : data?.uid || ''}
										sub
									/>
								</Box>
							</Panel>
							<Flex
								direction='column'
								gap={5}>
								<Panel title='As a form'>
									<FormPreview
										fields={fields}
										recordName={title || 'Component'}
									/>
								</Panel>
								{!isNew && (
									<Panel
										title='Used by'
										subtitle={usedBy.length ? 'Saving changes these models’ forms too.' : 'Not used yet — add it to a model as a field of the kind Component.'}
										flush>
										{usedBy.map(u => (
											<NextLink
												key={`${u._id}-${u.field}`}
												href={projectHref(`/model-builder/${u._id}`)}>
												<Flex
													px={4}
													py={2.5}
													gap={2}
													borderTopWidth='1px'
													borderColor='border.muted'
													_hover={{ bg: 'bg.subtle' }}>
													<Text
														fontSize='13px'
														fontWeight='500'>
														{u.title}
													</Text>
													<Text
														fontSize='12.5px'
														color='fg.muted'>
														{u.field}
														{u.repeatable ? ' (a list)' : ''}
													</Text>
												</Flex>
											</NextLink>
										))}
									</Panel>
								)}
							</Flex>
						</Grid>
					</>
				)}
			</Flex>
			<PromptDialog
				open={deleting}
				onClose={() => setDeleting(false)}
				onConfirm={async () => {
					const res = await remove(id);
					if ('error' in res) {
						toaster.create({ type: 'error', title: 'Not deleted', description: (res.error as any)?.data?.message });
						return setDeleting(false);
					}
					toaster.create({ type: 'success', title: 'Component deleted' });
					router.replace(projectHref('/components'));
				}}
				title={`Delete ${data?.title || 'this component'}?`}
				description={
					usedBy.length
						? `It’s used by ${usedBy.map(u => `${u.title} (${u.field})`).join(', ')} — take it off those fields first.`
						: 'Models can’t use it any more. This can’t be undone.'
				}
				loading={removing.isLoading}
				confirmLabel='Delete'
			/>
		</Layout>
	);
}
