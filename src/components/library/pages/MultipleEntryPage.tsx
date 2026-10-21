'use client';

import { FC, KeyboardEvent, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Alert, Box, Button, Flex, IconButton, Skeleton, Text } from '@chakra-ui/react';
import { Plus, Trash2 } from 'lucide-react';

import Layout from '../nav/Layout';
import { FormMain } from '../create-page';
import { useFormData } from '../hooks';
import { useGetConfigQuery, useGetRouteQuery, usePostMutation } from '../store';
import { EmptyState, PageHeader } from '../cl';
import { toaster } from '@/components/ui/toaster';
import { HOME, pagePath } from '../config/lib/constants/panel';
import { singularOf } from '../modals/CreateModal/CreateModal';

/**
 * A table's "Add multiple" page (route builder → Table page → Add multiple
 * records): /<route>/multiple in the super-admin panel, /<project>/<route>/multiple
 * in the tenant panel (multiplePath). The route's own form, once per entry —
 * fill one, press "Add another entry" for the next, then Save all. Each entry
 * is saved the way the add form saves it; the ones that go through leave the
 * page, the ones that fail stay with the reason beside them.
 */

const startingValues = (fields: any[]) =>
	fields.reduce((acc: Record<string, any>, field: any) => {
		if (field?.getValue) acc[field.name] = field.getValue();
		if (field?.value !== undefined) acc[field.name] = field.value;
		return acc;
	}, {});

type Entry = { key: number; error?: string };

/** One entry's form. Its values go up to the page, which saves them all. */
const EntryForm: FC<{ fields: any[]; onData: (data: any) => void }> = ({ fields, onData }) => {
	const [formData, setFormData] = useFormData<any>(fields);
	const [, setChangedData] = useState({});

	useEffect(() => {
		setFormData((prev: any) => ({ ...prev, ...startingValues(fields) }));
	}, [fields]);

	useEffect(() => {
		onData(formData);
	}, [formData]);

	return (
		<FormMain
			fields={fields}
			formData={formData}
			setFormData={setFormData}
			setChangedData={setChangedData}
		/>
	);
};

const Entries: FC<{ route: string; fields: any[]; table: any }> = ({ route, fields, table }) => {
	const router = useRouter();
	const [post] = usePostMutation();
	const next = useRef(2);
	const data = useRef<Record<number, any>>({});
	const [entries, setEntries] = useState<Entry[]>([{ key: 1 }]);
	const [saving, setSaving] = useState(false);
	const back = pagePath(route);
	const noun = singularOf(table?.title || 'record').toLowerCase();

	const add = () => setEntries(list => [...list, { key: next.current++ }]);
	const remove = (key: number) => {
		delete data.current[key];
		setEntries(list => list.filter(e => e.key !== key));
	};

	const saveAll = async () => {
		setSaving(true);
		const failed: Entry[] = [];
		let saved = 0;
		// One at a time, in order, so a failure names its entry and the rest still go.
		for (const entry of entries) {
			const body = { ...data.current[entry.key] };
			fields.forEach((f: any) => f?.isExcluded && delete body[f.name]);
			try {
				await post({ path: route, body, invalidate: table?.invalidate } as any).unwrap();
				delete data.current[entry.key];
				saved++;
			} catch (e: any) {
				failed.push({ key: entry.key, error: e?.data?.message || 'Could not save this entry' });
			}
		}
		setSaving(false);
		if (saved) toaster.create({ type: 'success', title: `${saved} ${noun}${saved === 1 ? '' : 's'} added` });
		if (!failed.length) return router.replace(back);
		setEntries(failed);
	};

	// Enter in a text box shouldn't save half a form.
	const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
		if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT') e.preventDefault();
	};

	return (
		<Flex
			direction='column'
			gap={4}
			onKeyDown={onKeyDown}>
			{entries.map((entry, i) => (
				<Box
					key={entry.key}
					p={{ base: 3, md: 5 }}
					borderWidth='1px'
					borderColor={entry.error ? 'red.500' : 'border'}
					borderRadius='lg'
					bg='bg.panel'>
					<Flex
						align='center'
						justify='space-between'
						mb={3}>
						<Text
							fontSize='sm'
							fontWeight='600'>
							Entry {i + 1}
						</Text>
						{entries.length > 1 && (
							<IconButton
								aria-label={`Remove entry ${i + 1}`}
								size='xs'
								variant='ghost'
								disabled={saving}
								onClick={() => remove(entry.key)}>
								<Trash2 size={14} />
							</IconButton>
						)}
					</Flex>
					{entry.error && (
						<Alert.Root
							status='error'
							borderRadius='md'
							mb={3}>
							<Alert.Indicator />
							<Alert.Content>
								<Alert.Description>{entry.error}</Alert.Description>
							</Alert.Content>
						</Alert.Root>
					)}
					<EntryForm
						fields={fields}
						onData={d => (data.current[entry.key] = d)}
					/>
				</Box>
			))}

			<Flex
				position='sticky'
				bottom={0}
				zIndex={2}
				py={3}
				px={4}
				gap={3}
				align='center'
				justify='space-between'
				flexWrap='wrap'
				bg='bg.panel'
				borderWidth='1px'
				borderColor='border'
				borderRadius='lg'
				boxShadow='sm'>
				<Button
					size='sm'
					variant='outline'
					disabled={saving}
					onClick={add}>
					<Plus size={14} />
					Add another entry
				</Button>
				<Flex gap={2}>
					<Link href={back}>
						<Button
							size='sm'
							variant='outline'
							disabled={saving}>
							Cancel
						</Button>
					</Link>
					<Button
						size='sm'
						loading={saving}
						loadingText='Saving'
						onClick={saveAll}>
						{entries.length > 1 ? `Save all ${entries.length}` : 'Save'}
					</Button>
				</Flex>
			</Flex>
		</Flex>
	);
};

const MultipleEntryPage: FC<{ route: string }> = ({ route }) => {
	const { data: table, isLoading: tableLoading } = useGetRouteQuery(route);
	const { data: config, isLoading: configLoading, isError } = useGetConfigQuery(route);
	const loading = tableLoading || configLoading;
	const fields: any[] | undefined = Array.isArray(config?.form) ? config.form : undefined;
	const tableTitle = table?.title || route;
	const title = `Add multiple ${tableTitle.toLowerCase()}`;

	return (
		<Layout
			pb='32px'
			showFooter={false}
			title={title}
			path={route}>
			<Box
				w='full'
				maxW='760px'
				mx='auto'>
				<Flex
					direction='column'
					gap={5}>
					{loading ? (
						<Skeleton
							w='220px'
							h='28px'
							borderRadius='full'
						/>
					) : (
						<PageHeader
							breadcrumbs={[
								{ href: HOME, title: 'Home' },
								{ href: pagePath(route), title: tableTitle },
								{ href: '', title: 'Add multiple' },
							]}
							title={title}
							meta={`Fill in one entry, press “Add another entry” for the next, then save them all at once.`}
						/>
					)}
					{loading ? (
						<Skeleton
							h='320px'
							borderRadius='lg'
						/>
					) : isError || !fields?.length || !table?.multipleEntry ? (
						<EmptyState
							title='Adding several at once isn’t on'
							description='This table has no form, or multiple entry isn’t switched on for it. Turn on “Add multiple records” in the page builder (Table tab).'
							action={
								<Link href={pagePath(route)}>
									<Button
										size='sm'
										variant='outline'>
										Back to {tableTitle}
									</Button>
								</Link>
							}
						/>
					) : (
						<Entries
							route={route}
							fields={fields}
							table={table}
						/>
					)}
				</Flex>
			</Box>
		</Layout>
	);
};

export default MultipleEntryPage;
