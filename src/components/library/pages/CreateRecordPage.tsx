'use client';

import { FC, FormEvent, KeyboardEvent, ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Box, Button, Flex, Skeleton, Text } from '@chakra-ui/react';
import { Plus } from 'lucide-react';

import Layout from '../nav/Layout';
import { FormMain } from '../create-page';
import { useCustomToast, useFormData } from '../hooks';
import { useGetConfigQuery, useGetRouteQuery, usePostMutation } from '../store';
import { EmptyState, PageHeader } from '../cl';
import { HOME, pagePath } from '../config/lib/constants/panel';

/**
 * A table's "Add" button set to open a page (route builder → Table page →
 * Opens: Its own page) lands here: /<route>/create in the super-admin panel,
 * /<project>/<route>/create in the tenant panel (createPath). The same form
 * the add modal shows — the route's form config — with room to breathe, and
 * back to the table once the record is saved.
 */

/** The panel's Layout, or a plain box on a mock page (no sign-in). */
type Frame = FC<{ title: string; path: string; pb?: string; showFooter?: boolean; children: ReactNode }>;

type Props = { route: string; frame?: Frame };

/** The form starts with each field's set value, as the add modal does. */
const startingValues = (fields: any[]) =>
	fields.reduce((acc: Record<string, any>, field: any) => {
		if (field?.getValue) acc[field.name] = field.getValue();
		if (field?.value !== undefined) acc[field.name] = field.value;
		return acc;
	}, {});

const CreateForm: FC<{ route: string; fields: any[]; table: any }> = ({ route, fields, table }) => {
	const router = useRouter();
	const [formData, setFormData] = useFormData<any>(fields);
	const [, setChangedData] = useState({});
	const [post, result] = usePostMutation();
	const { isLoading, isSuccess } = result;
	const back = pagePath(route);

	useEffect(() => {
		setFormData((prev: any) => ({ ...prev, ...startingValues(fields) }));
	}, [fields]);

	useCustomToast({
		successText: table?.button?.prompt?.successMsg || 'Record added',
		...result,
	});

	useEffect(() => {
		if (isSuccess) router.replace(back);
	}, [isSuccess]);

	const onSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const body = { ...formData };
		fields.forEach((f: any) => f?.isExcluded && delete body[f.name]);
		post({ path: route, body, invalidate: table?.invalidate } as any);
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

			{/* Always in reach, however long the form is. */}
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
					Fields marked * must be filled in.
				</Text>
				<Flex gap={2}>
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
						loading={isLoading}
						loadingText='Saving'>
						{table?.button?.prompt?.btnText || 'Save'}
					</Button>
				</Flex>
			</Flex>
		</form>
	);
};

const CreateRecordPage: FC<Props> = ({ route, frame: Wrap = Layout as Frame }) => {
	const { data: table, isLoading: tableLoading } = useGetRouteQuery(route);
	const { data: config, isLoading: configLoading, isError } = useGetConfigQuery(route);
	const loading = tableLoading || configLoading;
	const fields: any[] | undefined = Array.isArray(config?.form) ? config.form : undefined;

	const tableTitle = table?.title || route;
	const title = table?.button?.prompt?.title || table?.button?.title || 'Add a record';

	return (
		<Wrap
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
								{ href: '', title: 'New' },
							]}
							title={
								<Flex
									as='span'
									align='center'
									gap={2}>
									<Plus size={20} />
									{title}
								</Flex>
							}
							meta={`Fill in the form and save — the new record is added to ${tableTitle}.`}
						/>
					)}

					{loading ? (
						<Skeleton
							h='320px'
							borderRadius='lg'
						/>
					) : isError || !fields?.length ? (
						<EmptyState
							title='This form isn’t set up'
							description='The page has no form to fill in. Add its fields in the page builder (Form tab), or ask whoever runs this panel.'
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
						<CreateForm
							route={route}
							fields={fields}
							table={table}
						/>
					)}
				</Flex>
			</Box>
		</Wrap>
	);
};

export default CreateRecordPage;
