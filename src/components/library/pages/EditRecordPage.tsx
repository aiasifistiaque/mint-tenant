'use client';

import { FC, FormEvent, KeyboardEvent, ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Box, Button, Flex, Skeleton, Text } from '@chakra-ui/react';
import { Pencil } from 'lucide-react';

import Layout from '../nav/Layout';
import { FormMain } from '../create-page';
import { useCustomToast, useFormData } from '../hooks';
import { useGetByIdToEditQuery, useGetConfigQuery, useGetRouteQuery, useUpdateByIdMutation } from '../store';
import { EmptyState, PageHeader } from '../cl';
import { HOME, pagePath, projectHref } from '../config/lib/constants/panel';
import { recalledTable } from './tableOrigin';
import { ago, recordLabel, singularOf } from '../modals/CreateModal/CreateModal';
import { GuidelinesDialog, GuidelinesLink } from '../components/guidelines/Guidelines';
import SteppedForm from '../create-page/steps/SteppedForm';
import { FormStepsConfig, stepsOf } from '../create-page/steps/formSteps';
import { withoutHidden } from '../functions/formRules';
import { mutedForUpdate } from '../functions/fieldLocks';

/**
 * A record's edit page — /<project>/<route>/edit/<id> (editPath). Where Edit goes
 * when the route's form is in pages (backend docs/multi-page-forms D10): the
 * stepper opens on page 1 and any page can be opened. Without pages it's the
 * same form the edit dialog shows, on a page. Either way only what changed is
 * sent, once, and Save goes back where Edit was clicked (the record's page with
 * `?from=view`, else the table).
 */

type Frame = FC<{ title: string; path: string; pb?: string; showFooter?: boolean; children: ReactNode }>;

type Props = { route: string; id: string; frame?: Frame };

const changesText = (n: number) => (n ? (n === 1 ? '1 change' : `${n} changes`) : 'No changes yet');

const EditForm: FC<{
	route: string;
	id: string;
	fields: any[];
	record: any;
	table: any;
	formSteps?: FormStepsConfig;
	back: string;
}> = ({ route, id, fields, record, table, formSteps, back }) => {
	const router = useRouter();
	const [formData, setFormData] = useFormData<any>(fields);
	const [changedData, setChangedData] = useState<Record<string, any>>({});
	const [update, result] = useUpdateByIdMutation();
	const { isLoading, isSuccess } = result;
	const changes = Object.keys(changedData || {}).length;

	// The form starts as the record is.
	useEffect(() => {
		if (record) setFormData(record);
	}, [record]);

	useCustomToast({ successText: 'Changes saved', ...result });

	useEffect(() => {
		if (isSuccess) router.replace(back);
	}, [isSuccess]);

	const save = () => {
		if (!changes) return;
		// Fields hidden by their conditions aren't sent (the server drops them too).
		update({ path: route, id, body: withoutHidden(changedData, fields, formData), invalidate: ['config', 'history', ...(table?.invalidate || [])] } as any);
	};

	if (formSteps)
		return (
			<SteppedForm
				mode='edit'
				fields={fields}
				formSteps={formSteps}
				formData={formData}
				setFormData={setFormData}
				setChangedData={setChangedData}
				isLoading={isLoading}
				saveText='Save changes'
				canSave={changes > 0}
				status={changesText(changes)}
				cancelHref={back}
				onSave={save}
			/>
		);

	const onSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		save();
	};

	// Enter in a text box shouldn't save half a form.
	const onKeyDown = (e: KeyboardEvent<HTMLFormElement>) => {
		if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT') e.preventDefault();
	};

	return (
		<form
			onSubmit={onSubmit}
			onKeyDown={onKeyDown}>
			<FormMain
				fields={fields}
				formData={formData}
				setFormData={setFormData}
				setChangedData={setChangedData}
			/>
			<Flex
				position='sticky'
				bottom={0}
				zIndex={2}
				mt={4}
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
				<Text
					fontSize='xs'
					color='fg.muted'>
					{changesText(changes)}
				</Text>
				<Flex
					gap={2}
					ml='auto'>
					<Link href={back}>
						<Button
							size='sm'
							variant='outline'
							disabled={isLoading}>
							Cancel
						</Button>
					</Link>
					<Button
						size='sm'
						type='submit'
						disabled={!changes}
						loading={isLoading}
						loadingText='Saving'>
						Save changes
					</Button>
				</Flex>
			</Flex>
		</form>
	);
};

const EditRecordPage: FC<Props> = ({ route, id, frame: Wrap = Layout as Frame }) => {
	const { data: table, isLoading: tableLoading } = useGetRouteQuery(route);
	const { data: config, isLoading: configLoading, isError } = useGetConfigQuery(route);
	const { data: record, isLoading: recordLoading, isError: recordError } = useGetByIdToEditQuery({ path: route, id }, { skip: !id });
	const loading = tableLoading || configLoading || recordLoading;
	const form: any[] | undefined = Array.isArray(config?.form) ? config.form : undefined;
	// What this record can't change (locked by its state, or never after it's created) shows muted.
	const fields = useMemo(() => (form && record ? mutedForUpdate(form, record) : form), [form, record]);
	const formSteps = stepsOf(config);

	// Where Save and Cancel go: the record's page when Edit was clicked there, else the table it came from.
	const [back, setBack] = useState(pagePath(route));
	const recalled = useRef(false);
	useEffect(() => {
		if (recalled.current) return;
		recalled.current = true;
		const fromView = new URLSearchParams(window.location.search).get('from') === 'view';
		setBack(fromView ? projectHref(`/view/${route}/${id}`) : recalledTable(route) || pagePath(route));
	}, [route, id]);

	const [showGuidelines, setShowGuidelines] = useState(false);
	const tableTitle = table?.title || route;
	const title = table?.title ? `Edit ${singularOf(table.title)}` : 'Edit record';
	const label = record ? recordLabel(record) : '';
	const updated = record ? ago(record?.updatedAt) : '';

	return (
		<Wrap
			pb='32px'
			showFooter={false}
			title={title}
			path={route}>
			<Box
				w='full'
				maxW={formSteps ? '1180px' : '760px'}
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
								...(label ? [{ href: projectHref(`/view/${route}/${id}`), title: label }] : []),
								{ href: '', title: 'Edit' },
							]}
							title={
								<Flex
									as='span'
									align='center'
									gap={2}>
									<Pencil size={18} />
									{title}
								</Flex>
							}
							meta={[label, updated && `Updated ${updated}`].filter(Boolean).join(' · ') || undefined}
						/>
					)}
					{!loading && table?.guidelines && (
						<Flex mt={-2}>
							<GuidelinesLink
								guidelines={table.guidelines}
								onOpen={() => setShowGuidelines(true)}
							/>
						</Flex>
					)}
					<GuidelinesDialog
						open={showGuidelines}
						onClose={() => setShowGuidelines(false)}
						guidelines={table?.guidelines}
					/>

					{loading ? (
						<Skeleton
							h='320px'
							borderRadius='lg'
						/>
					) : recordError || !record ? (
						<EmptyState
							title='This record isn’t here'
							description='It may have been deleted, or you can’t edit it.'
						/>
					) : isError || !fields?.length ? (
						<EmptyState
							title='This form isn’t set up'
							description='Add fields to its form in the page builder first.'
						/>
					) : (
						<EditForm
							route={route}
							id={id}
							fields={fields}
							record={record}
							table={table}
							formSteps={formSteps}
							back={back}
						/>
					)}
				</Flex>
			</Box>
		</Wrap>
	);
};

export default EditRecordPage;
