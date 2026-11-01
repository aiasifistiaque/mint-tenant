'use client';

import { FC, useMemo, useState } from 'react';
import { Button, Text } from '@chakra-ui/react';
import Dropdown from '../../../../cl/Dropdown';
import { toaster } from '@/components/ui/toaster';
import { useGetAllQuery } from '../../../../store/services/commonApi';
import { useGetTaxUsageQuery, useReplaceTaxMutation } from '../../../../store/services/commerceApi';
import { BulkDialog, CancelButton, errorOf } from './shared';

/**
 * "Replace with…" for a tax that is still in use (backend docs/ecommerce TX5): a tax categories, products or
 * variants hold can't be deleted, so they are moved to another active tax first — their prices follow.
 */
const ReplaceTax: FC<{ open: boolean; onClose: () => void; taxId: string; path: string; onMoved?: () => void }> = ({ open, onClose, taxId, path, onMoved }) => {
	const { data: use } = useGetTaxUsageQuery(taxId, { skip: !open || !taxId });
	const { data: list } = useGetAllQuery({ path, limit: 100, filters: { status: 'active' } }, { skip: !open });
	const [replace, { isLoading }] = useReplaceTaxMutation();
	const [to, setTo] = useState('');
	const options = useMemo(() => (list?.doc || []).filter((t: any) => t._id !== taxId && t.status !== 'inactive').map((t: any) => ({ value: t._id, label: `${t.name} (${t.rate}%)` })), [list, taxId]);

	const run = async () => {
		try {
			const r = await replace({ id: taxId, to }).unwrap();
			toaster.create({ type: 'success', title: `${r.moved} record${r.moved === 1 ? '' : 's'} moved`, description: 'Their prices follow the new tax. You can delete the old one now.' });
			onMoved?.();
			onClose();
		} catch (e) {
			toaster.create({ type: 'error', title: 'Could not move them', description: errorOf(e, '') });
		}
	};

	return (
		<BulkDialog
			open={open}
			onClose={onClose}
			busy={isLoading}
			title='This tax is still in use'
			footer={
				<>
					<CancelButton onClick={onClose} />
					<Button
						size='sm'
						disabled={!to || isLoading}
						loading={isLoading}
						onClick={run}>
						Move them and keep going
					</Button>
				</>
			}>
			<Text
				fontSize='sm'
				mb={3}>
				{use?.text ? `${use.text}.` : 'Loading…'} A tax in use can’t be deleted — move them to another tax first.
			</Text>
			<Text
				fontSize='xs'
				fontWeight='600'
				mb={1.5}>
				Replace with
			</Text>
			<Dropdown
				size='sm'
				value={to}
				placeholder={options.length ? 'Pick a tax' : 'No other active tax'}
				aria-label='Replace with'
				items={options}
				onChange={setTo}
			/>
		</BulkDialog>
	);
};

export default ReplaceTax;
