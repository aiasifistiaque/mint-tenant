'use client';

import { FC, useEffect, useState } from 'react';
import { Box, Button, Flex, Grid, Input, Text, Textarea } from '@chakra-ui/react';
import { Plus, Trash2 } from 'lucide-react';
import { useGetPdfSettingsQuery, useSavePdfSettingsMutation, viewerZone } from '@/components/library';
import { ConsoleTabs, CopyValue, Dropdown } from '@/components/library/cl';
import { IS_TENANT_PANEL } from '@/components/library/config/lib/constants/panel';
import { formatDate, formatNumber } from '@/components/library/pdf/tokens';
import { EMPTY_SETTINGS, SavedText, textKey } from '@/components/library/pdf/scope';
import BusinessFields, { Business, BusinessKey, EMPTY_BUSINESS } from '@/components/library/tenant/BusinessDetails';
import { toaster } from '@/components/ui/toaster';
import Shell from './Shell';
import { DocLink, ICON, Labeled, errorOf } from './ui';

const DATE_FORMATS = ['D MMM YYYY', 'DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD', 'MMMM D, YYYY', 'dddd, D MMMM YYYY'];

export type SettingsTab = 'business' | 'texts' | 'money';

/** Words people reuse on their documents — one click adds them, ready to change. */
const SUGGESTED: { label: string; text: string }[] = [
	{ label: 'Terms & conditions', text: '1. Payment is due within 14 days of the invoice date.\n2. Goods once sold are not returnable.\n3. Prices include VAT where it applies.' },
	{ label: 'Computer generated', text: 'This is a computer-generated document — no signature is required.' },
	{ label: 'Payment instructions', text: 'Pay by bank transfer to the account above, with the invoice number as the reference.' },
	{ label: 'Return policy', text: 'Returns are accepted within 7 days with the receipt, in the original condition.' },
	{ label: 'Thank you', text: 'Thank you for your business!' },
];

/** A saved text while it's being edited — `fresh` until saved, so its key still follows its label. */
type Draft = SavedText & { fresh?: boolean };

/**
 * Business details, saved texts, money and dates — what every template reads
 * ({{business.name}}, {{texts.terms_conditions}}, `money`, `date`). Backend
 * GET/PUT /pdf-templates/settings: in a project the business details are the
 * project's own (Project settings shows the same); the bank note, saved
 * texts, money and dates are PdfSettings. `focus` opens it at one field —
 * `business.logo`, `texts.terms` (made if it isn't there yet).
 */
const SettingsDialog: FC<{ open: boolean; onClose: () => void; focus?: string | null }> = ({ open, onClose, focus }) => {
	const { data } = useGetPdfSettingsQuery(undefined, { skip: !open });
	const [save, { isLoading }] = useSavePdfSettingsMutation();
	const [s, setS] = useState<any>(EMPTY_SETTINGS);
	const [texts, setTexts] = useState<Draft[]>([]);
	const [tab, setTab] = useState<SettingsTab>('business');
	const [focusText, setFocusText] = useState<string | null>(null);

	// Fresh from the server each time it opens, at the field asked for.
	useEffect(() => {
		if (!open || !data) return;
		setS(data);
		let list: Draft[] = data.texts || [];
		const want = focus?.startsWith('texts.') ? focus.slice(6) : '';
		// "New saved text" (texts.new_text): a blank one whose key follows its name; any other key is a template's, kept as it is.
		if (want && !list.some(t => t.key === want))
			list = [...list, want === 'new_text' ? { key: want, label: '', text: '', fresh: true } : { key: want, label: want.replace(/_/g, ' ').replace(/^./, c => c.toUpperCase()), text: '', fresh: false }];
		setTexts(list);
		setTab(focus?.startsWith('texts.') ? 'texts' : 'business');
		setFocusText(want || null);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open, data, focus]);

	// The dialog puts the cursor on its first control; then this moves it to the field asked for.
	useEffect(() => {
		if (!open || !focus || !data) return;
		const sel = focus.startsWith('texts.') ? `[data-text="${focus.slice(6)}"]` : `[data-field="${focus.slice(9)}"]`;
		const timer = setTimeout(() => {
			const el = document.querySelector<HTMLElement>(`[role=dialog] ${sel}`);
			el?.focus();
			el?.scrollIntoView({ block: 'center' });
		}, 250);
		return () => clearTimeout(timer);
	}, [open, focus, data, tab]);

	const bizFocus = focus?.startsWith('business.') ? (focus.slice(9) as BusinessKey | 'note') : null;
	const business: Business = { ...EMPTY_BUSINESS, ...s.business };
	const setBusiness = (b: Business) => setS((x: any) => ({ ...x, business: { ...x.business, ...b } }));
	const cur = (k: string, v: any) => setS((x: any) => ({ ...x, currency: { ...x.currency, [k]: v } }));
	const example = (() => {
		const n = formatNumber(1234567.5, s.currency.decimals, s.currency.grouping);
		return s.currency.symbol ? (s.currency.position === 'after' ? `${n} ${s.currency.symbol}` : `${s.currency.symbol}${n}`) : n;
	})();

	const setText = (i: number, patch: Partial<Draft>) =>
		setTexts(list =>
			list.map((t, j) => {
				if (j !== i) return t;
				const next = { ...t, ...patch };
				// A new text's key follows its label until it's saved; then it stays, so templates keep finding it.
				if (patch.label !== undefined && t.fresh) next.key = textKey(patch.label) || t.key;
				return next;
			})
		);
	const addText = (label = '', text = '') => {
		let key = textKey(label) || 'text';
		for (let n = 2; texts.some(t => t.key === key); n++) key = `${textKey(label) || 'text'}_${n}`;
		setTexts(list => [...list, { key, label, text, fresh: true }]);
		setFocusText(key);
	};
	const keysClash = new Set(texts.map(t => t.key)).size !== texts.length;

	const submit = async () => {
		try {
			await save({ ...s, texts: texts.filter(t => t.key && (t.text.trim() || t.label.trim())).map(({ key, label, text }) => ({ key, label: label || key, text })) }).unwrap();
			toaster.create({ type: 'success', title: 'Saved — every template uses these now' });
			onClose();
		} catch (e) {
			toaster.create({ type: 'error', title: 'Could not save', description: errorOf(e) });
		}
	};

	return (
		<Shell
			open={open}
			onClose={onClose}
			title='Business details'
			maxW='780px'
			initialFocus={focus ? (focus.startsWith('texts.') ? `[data-text="${focus.slice(6)}"]` : `[data-field="${focus.slice(9)}"]`) : undefined}
			description={
				<>
					What every template prints — <code>{'{{business.name}}'}</code>, <code>{'{{texts.terms_conditions}}'}</code> — and how amounts and dates look.{' '}
					<DocLink section='business' />
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
						disabled={keysClash}
						onClick={submit}>
						Save
					</Button>
				</>
			}>
			<ConsoleTabs
				value={tab}
				onChange={v => setTab(v as SettingsTab)}
				tabs={[
					{ value: 'business', label: 'Business' },
					{ value: 'texts', label: `Saved texts${texts.length ? ` · ${texts.length}` : ''}` },
					{ value: 'money', label: 'Money & dates' },
				]}>
				{null}
			</ConsoleTabs>

			<Box pt={4}>
				{tab === 'business' && (
					<Flex
						direction='column'
						gap={4}>
						<Text
							fontSize='xs'
							color='fg.muted'>
							{IS_TENANT_PANEL
								? 'This project’s business details — Project settings shows the same ones.'
								: 'Your panel’s business details.'}
						</Text>
						<BusinessFields
							value={business}
							onChange={setBusiness}
							focus={bizFocus && bizFocus !== 'note' ? bizFocus : null}
						/>
						<Labeled
							label='Bank details / note'
							hint='Printed as {{business.note}} — bank account, payment terms.'>
							<Textarea
								size='sm'
								rows={2}
								data-field='note'
								autoFocus={bizFocus === 'note'}
								value={s.business?.note || ''}
								onChange={e => setS((x: any) => ({ ...x, business: { ...x.business, note: e.target.value } }))}
							/>
						</Labeled>
					</Flex>
				)}

				{tab === 'texts' && (
					<Flex
						direction='column'
						gap={3}>
						<Text
							fontSize='xs'
							color='fg.muted'>
							Words you print on several templates — terms and conditions, a return policy. Change one here and every template
							printing it changes. **bold** and new lines work, and fields too: {'{{bill.dueDate | date}}'}.{' '}
							<DocLink
								section='texts'
								label='How saved texts work'
							/>
						</Text>
						{texts.map((t, i) => (
							<Box
								key={i}
								borderWidth='1px'
								borderColor={focusText === t.key ? 'accent.solid' : 'border'}
								borderRadius='md'
								p={3}>
								<Flex
									gap={2}
									align='center'
									mb={2}>
									<Input
										size='sm'
										fontWeight='600'
										placeholder='Name it: Terms & conditions'
										value={t.label}
										maxLength={80}
										onChange={e => setText(i, { label: e.target.value })}
									/>
									<Box
										flexShrink={0}
										maxW='45%'>
										<CopyValue
											value={`{{texts.${t.key}}}`}
											ariaLabel='Copy the field'
										/>
									</Box>
									<Button
										size='xs'
										variant='ghost'
										color='fg.muted'
										aria-label='Remove'
										title='Remove — templates printing it print nothing there'
										onClick={() => setTexts(list => list.filter((_, j) => j !== i))}>
										<Trash2 {...ICON} />
									</Button>
								</Flex>
								<Textarea
									size='sm'
									rows={4}
									data-text={t.key}
									maxLength={5000}
									autoFocus={focusText === t.key}
									placeholder='The words to print'
									value={t.text}
									onChange={e => setText(i, { text: e.target.value })}
								/>
							</Box>
						))}
						{keysClash && (
							<Text
								fontSize='xs'
								color='red.fg'>
								Two texts have the same name — rename one.
							</Text>
						)}
						<Flex
							gap={1.5}
							wrap='wrap'
							align='center'>
							<Button
								size='xs'
								variant='outline'
								disabled={texts.length >= 30}
								onClick={() => addText()}>
								<Plus {...ICON} />
								Add a text
							</Button>
							{SUGGESTED.filter(x => !texts.some(t => t.key === textKey(x.label))).map(x => (
								<Button
									key={x.label}
									size='xs'
									variant='ghost'
									color='fg.muted'
									disabled={texts.length >= 30}
									onClick={() => addText(x.label, x.text)}>
									<Plus size={12} />
									{x.label}
								</Button>
							))}
						</Flex>
					</Flex>
				)}

				{tab === 'money' && (
					<>
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
					</>
				)}
			</Box>
		</Shell>
	);
};

export default SettingsDialog;
