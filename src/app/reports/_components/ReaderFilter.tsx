'use client';

import { FC } from 'react';
import { Box, Input, Text } from '@chakra-ui/react';
import { Dropdown } from '@/components/library/cl';
import { useGetAllQuery } from '@/components/library/store/services/commonApi';
import type { ReaderFilterField } from '@/components/library/store/services/tenantApi';

/**
 * One filter the report lets its reader set, beside the dates: a linked field
 * picks one of the linked model's records, a choice field a choice, a yes/no
 * field Yes or No; anything else is typed. Empty means "All".
 * `onPick` fires for a pick from a list (the report runs again at once);
 * typed values wait for Run.
 */

const ALL = { value: '', label: 'All' };

const Records: FC<{ link: NonNullable<ReaderFilterField['link']>; value: string; onPick: (v: string) => void }> = ({ link, value, onPick }) => {
	const display = link.displayField && link.displayField !== '_id' ? link.displayField : 'name';
	const { data, isLoading, isError } = useGetAllQuery({ path: link.route, limit: 999, sort: display });
	const items = ((data?.doc as any[]) || []).map(d => {
		const name = d?.[display] ?? d?.name ?? d?.title ?? d?.code;
		return { value: String(d._id), label: [name, d?.code && d.code !== name ? d.code : ''].filter(Boolean).join(' · ') || String(d._id) };
	});
	return (
		<Dropdown
			size='sm'
			value={value}
			placeholder={isLoading ? 'Loading…' : isError ? `Can’t list ${link.name}` : 'All'}
			searchable
			disabled={isError}
			onChange={onPick}
			items={[ALL, ...items]}
		/>
	);
};

const ReaderFilter: FC<{ field: ReaderFilterField; value: string; onType: (v: string) => void; onPick: (v: string) => void }> = ({ field, value, onType, onPick }) => (
	<Box w={{ base: '100%', sm: '200px' }}>
		<Text
			fontSize='12px'
			color='fg.muted'
			mb={1}>
			{field.label}
		</Text>
		{field.link ? (
			<Records
				link={field.link}
				value={value}
				onPick={onPick}
			/>
		) : field.options.length ? (
			<Dropdown
				size='sm'
				value={value}
				onChange={onPick}
				items={[ALL, ...field.options]}
			/>
		) : field.kind === 'boolean' ? (
			<Dropdown
				size='sm'
				value={value}
				onChange={onPick}
				items={[ALL, { value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }]}
			/>
		) : (
			<Input
				size='sm'
				type={field.number ? 'number' : 'text'}
				placeholder='All'
				value={value}
				onChange={e => onType(e.target.value)}
			/>
		)}
	</Box>
);

export default ReaderFilter;
