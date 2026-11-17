'use client';

import { FC } from 'react';
import { Box, Button, Flex, Grid, Text } from '@chakra-ui/react';
import { Pencil } from 'lucide-react';
import { useGetByIdQuery } from '../../store';
import { getFieldValue } from '../..';
import { hiddenFormFields } from '../../functions/formRules';
import { StepPage, shownNow } from './formSteps';

/**
 * The Review page of a form in pages (docs/multi-page-forms D4): what each page
 * holds, as label / value rows, with an Edit link back to that page. Read-only.
 */

const ID = /^[0-9a-f]{24}$/i;
const isEmpty = (v: any) => v === undefined || v === null || v === '' || (Array.isArray(v) && !v.length);

/** A picked record's name, looked up by its id on the field's page. */
const RecordName: FC<{ route?: string; id: string }> = ({ route, id }) => {
	const { data, isError } = useGetByIdQuery({ path: route as string, id }, { skip: !route });
	const doc = data?.doc || data;
	const name = doc?.name || doc?.title || doc?.displayName || doc?.code || doc?.email;
	return <>{name || (isError || !route ? 'Picked' : '…')}</>;
};

const plain = (html: string) =>
	String(html)
		.replace(/<[^>]*>/g, ' ')
		.replace(/&nbsp;/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();

const nameOf = (v: any) => v?.name || v?.title || v?.label || v?.displayName || v?.code || v?.key;

/** One value as words. */
const Value: FC<{ field: any; value: any }> = ({ field, value }) => {
	const type = String(field?.type || '');
	if (isEmpty(value)) return <Box as='span' fontSize='inherit' color='fg.subtle'>—</Box>;
	if (type === 'password') return <>••••••</>;
	if (typeof value === 'boolean' || type === 'checkbox' || type === 'switch') return <>{value ? 'Yes' : 'No'}</>;
	if (/image|file|video/.test(type)) {
		const n = Array.isArray(value) ? value.length : 1;
		return <>{n === 1 ? '1 file' : `${n} files`}</>;
	}
	if (/editor/.test(type)) {
		const t = plain(value);
		return <>{t.length > 160 ? `${t.slice(0, 160)}…` : t || '—'}</>;
	}
	const one = (v: any, i: number) => {
		if (v && typeof v === 'object') return <span key={i}>{nameOf(v) || (v._id ? <RecordName route={field?.model} id={v._id} /> : `${Object.keys(v).length} details`)}</span>;
		if (typeof v === 'string' && ID.test(v) && field?.model) return <RecordName key={i} route={field.model} id={v} />;
		// A choice shows its label.
		const opt = Array.isArray(field?.options) ? field.options.find((o: any) => String(o?.value ?? o) === String(v)) : undefined;
		return <span key={i}>{String(opt?.label ?? v)}</span>;
	};
	if (Array.isArray(value)) {
		if (value.some(v => v && typeof v === 'object' && !nameOf(v) && !v._id)) return <>{value.length === 1 ? '1 row' : `${value.length} rows`}</>;
		const shown = value.slice(0, 8);
		return (
			<>
				{shown.map((v, i) => (
					<span key={i}>
						{i > 0 && ', '}
						{one(v, i)}
					</span>
				))}
				{value.length > shown.length && ` and ${value.length - shown.length} more`}
			</>
		);
	}
	return one(value, 0);
};

type Props = { pages: StepPage[]; fields: any[]; formData: any; onEdit: (i: number) => void };

const ReviewStep: FC<Props> = ({ pages, fields, formData, onEdit }) => {
	const hidden = hiddenFormFields(fields, formData);
	return (
		<Flex
			direction='column'
			gap={4}>
			{pages.map((page, i) => {
				if (page.review) return null;
				const shown = page.fields.filter(f => f?.name && shownNow(f, hidden, formData));
				return (
					<Box
						key={page.key}
						bg='bg.panel'
						borderWidth='1px'
						borderColor='border'
						borderRadius='xl'
						overflow='hidden'>
						<Flex
							align='center'
							justify='space-between'
							gap={3}
							px={5}
							py={3}
							borderBottomWidth='1px'
							borderColor='border'>
							<Text
								fontSize='15px'
								fontWeight='600'>
								{i + 1}. {page.title}
							</Text>
							<Button
								size='xs'
								variant='ghost'
								onClick={() => onEdit(i)}>
								<Pencil size={13} />
								Edit
							</Button>
						</Flex>
						<Grid
							templateColumns={{ base: '1fr', md: 'minmax(140px, 220px) 1fr' }}
							columnGap={6}
							rowGap={{ base: 1, md: 2.5 }}
							px={5}
							py={4}>
							{shown.map(f => (
								<Box
									key={f.name}
									display='contents'>
									<Text
										fontSize='sm'
										color='fg.muted'
										mt={{ base: 2, md: 0 }}>
										{f.label || f.name}
									</Text>
									<Text
										fontSize='sm'
										wordBreak='break-word'>
										<Value
											field={f}
											value={getFieldValue({ name: f.name, formData })}
										/>
									</Text>
								</Box>
							))}
						</Grid>
					</Box>
				);
			})}
		</Flex>
	);
};

export default ReviewStep;
