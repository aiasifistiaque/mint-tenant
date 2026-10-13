'use client';

import { FC, useEffect, useState } from 'react';
import { Box, Button, Grid, Input, Text, Textarea } from '@chakra-ui/react';
import { useGetPdfSettingsQuery, useSavePdfSettingsMutation, viewerZone } from '@/components/library';
import { Dropdown } from '@/components/library/cl';
import { formatDate, formatNumber } from '@/components/library/pdf/tokens';
import { EMPTY_SETTINGS } from '@/components/library/pdf/scope';
import { toaster } from '@/components/ui/toaster';
import Shell from './Shell';
import { DocLink, Labeled, errorOf } from './ui';

const DATE_FORMATS = ['D MMM YYYY', 'DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD', 'MMMM D, YYYY', 'dddd, D MMMM YYYY'];

/**
 * Business details, currency and dates — typed once, read by every template
 * ({{business.name}}, `money`, `date`). Backend PdfSettings, one per project
 * (the super admin's own for theirs).
 */
const SettingsDialog: FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
	const { data } = useGetPdfSettingsQuery(undefined, { skip: !open });
	const [save, { isLoading }] = useSavePdfSettingsMutation();
	const [s, setS] = useState<any>(EMPTY_SETTINGS);
	useEffect(() => {
		if (data) setS(data);
	}, [data]);
	const biz = (k: string, v: string) => setS((x: any) => ({ ...x, business: { ...x.business, [k]: v } }));
	const cur = (k: string, v: any) => setS((x: any) => ({ ...x, currency: { ...x.currency, [k]: v } }));
	const example = (() => {
		const n = formatNumber(1234567.5, s.currency.decimals, s.currency.grouping);
		return s.currency.symbol ? (s.currency.position === 'after' ? `${n} ${s.currency.symbol}` : `${s.currency.symbol}${n}`) : n;
	})();

	const submit = async () => {
		try {
			await save(s).unwrap();
			toaster.create({ type: 'success', title: 'Saved — every template uses these now' });
			onClose();
		} catch (e) {
			toaster.create({ type: 'error', title: 'Could not save', description: errorOf(e) });
		}
	};

	const text = (k: string, label: string, hint?: string, placeholder?: string) => (
		<Labeled
			label={label}
			hint={hint}>
			<Input
				size='sm'
				value={s.business[k] || ''}
				placeholder={placeholder}
				onChange={e => biz(k, e.target.value)}
			/>
		</Labeled>
	);

	return (
		<Shell
			open={open}
			onClose={onClose}
			title='Business details'
			maxW='760px'
			description={
				<>
					What every template prints as <code>{'{{business.name}}'}</code>, <code>{'{{business.logo}}'}</code>… and how amounts and dates look. <DocLink section='business' />
				</>
			}
			footer={
				<>
					<Button
						size='xs'
						h='28px'
						px={3}
						variant='outline'
						onClick={onClose}>
						Cancel
					</Button>
					<Button
						size='xs'
						h='28px'
						px={3}
						loading={isLoading}
						onClick={submit}>
						Save
					</Button>
				</>
			}>
			<Grid
				templateColumns={{ base: '1fr', md: '1fr 1fr' }}
				gap={4}>
				{text('name', 'Business name')}
				{text('logo', 'Logo address', 'PNG, JPG, WebP or SVG over https — copy it from the Media library.', 'https://…/logo.png')}
				<Box gridColumn={{ md: 'span 2' }}>
					<Labeled label='Address'>
						<Textarea
							size='sm'
							rows={2}
							value={s.business.address || ''}
							onChange={e => biz('address', e.target.value)}
						/>
					</Labeled>
				</Box>
				{text('phone', 'Phone')}
				{text('email', 'Email')}
				{text('website', 'Website')}
				{text('taxId', 'Tax / VAT / BIN number')}
				<Box gridColumn={{ md: 'span 2' }}>
					<Labeled
						label='Note'
						hint='Bank details, payment terms — templates print it as {{business.note}}.'>
						<Textarea
							size='sm'
							rows={2}
							value={s.business.note || ''}
							onChange={e => biz('note', e.target.value)}
						/>
					</Labeled>
				</Box>
			</Grid>

			<Text
				fontSize='sm'
				fontWeight='600'
				mt={6}
				mb={3}>
				Money and dates
			</Text>
			<Grid
				templateColumns={{ base: '1fr 1fr', md: 'repeat(4, 1fr)' }}
				gap={4}>
				<Labeled label='Symbol'>
					<Input
						size='sm'
						value={s.currency.symbol}
						placeholder='৳, $, €'
						onChange={e => cur('symbol', e.target.value)}
					/>
				</Labeled>
				<Labeled label='In words'>
					<Input
						size='sm'
						value={s.currency.name}
						placeholder='Taka'
						onChange={e => cur('name', e.target.value)}
					/>
				</Labeled>
				<Labeled label='Decimals'>
					<Dropdown
						size='sm'
						value={String(s.currency.decimals)}
						onChange={v => cur('decimals', Number(v))}>
						{[0, 1, 2, 3].map(n => (
							<option
								key={n}
								value={String(n)}>
								{n}
							</option>
						))}
					</Dropdown>
				</Labeled>
				<Labeled label='Symbol goes'>
					<Dropdown
						size='sm'
						value={s.currency.position}
						onChange={v => cur('position', v)}>
						<option value='before'>Before</option>
						<option value='after'>After</option>
					</Dropdown>
				</Labeled>
				<Labeled label='Thousands'>
					<Dropdown
						size='sm'
						value={s.currency.grouping}
						onChange={v => cur('grouping', v)}>
						<option value='standard'>1,234,567</option>
						<option value='indian'>12,34,567 (lakh)</option>
					</Dropdown>
				</Labeled>
				<Labeled label='Date format'>
					<Dropdown
						size='sm'
						value={DATE_FORMATS.includes(s.dateFormat) ? s.dateFormat : ''}
						onChange={v => setS((x: any) => ({ ...x, dateFormat: v || x.dateFormat }))}>
						{DATE_FORMATS.map(f => (
							<option
								key={f}
								value={f}>
								{formatDate(new Date(), f, viewerZone())}
							</option>
						))}
					</Dropdown>
				</Labeled>
				<Box gridColumn={{ md: 'span 2' }}>
					<Labeled
						label='Time zone'
						hint='Empty: each reader’s own. Set one (Asia/Dhaka) so every copy shows the same day.'>
						<Input
							size='sm'
							value={s.timezone}
							placeholder={viewerZone()}
							onChange={e => setS((x: any) => ({ ...x, timezone: e.target.value }))}
						/>
					</Labeled>
				</Box>
			</Grid>
			<Text
				fontSize='xs'
				color='fg.muted'
				mt={3}>
				Looks like: {example} · {formatDate(new Date(), s.dateFormat, s.timezone || viewerZone())}
			</Text>
		</Shell>
	);
};

export default SettingsDialog;
