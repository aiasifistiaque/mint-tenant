'use client';

import { FC, ReactNode } from 'react';
import { Box, Button, Checkbox, Field, Flex, Grid, IconButton, Input, SegmentGroup, Switch, Text, Textarea } from '@chakra-ui/react';
import { Plus, Trash2 } from 'lucide-react';
import { Dropdown } from '../cl';
import type { CommerceAnswers, CommerceOffered, CommerceSection } from '../store/services/commerceApi';

/**
 * The store's settings, a section at a time (backend docs/ecommerce README §5):
 * the same editors for the setup wizard's steps and Store settings' cards.
 * Each edits one section of the answers; the page saves it.
 */

export type SectionProps<K extends CommerceSection> = {
	value: CommerceAnswers[K];
	onChange: (v: CommerceAnswers[K]) => void;
	offered: CommerceOffered;
	/** The store is built (Store settings): what can't change any more says so. */
	built?: boolean;
};

export const help = { fontSize: '12px', color: 'fg.muted', mt: 1 } as const;
const labelCss = { fontSize: '13px', fontWeight: '600', m: 0 } as const;

export const OnSwitch: FC<{ checked: boolean; label: ReactNode; hint?: ReactNode; onChange: (v: boolean) => void; disabled?: boolean }> = ({ checked, label, hint, onChange, disabled }) => (
	<Box>
		<Switch.Root
			size='sm'
			checked={checked}
			disabled={disabled}
			onCheckedChange={e => onChange(!!e.checked)}>
			<Switch.HiddenInput />
			<Switch.Control />
			<Switch.Label fontSize='13px'>{label}</Switch.Label>
		</Switch.Root>
		{hint && (
			<Text
				{...help}
				ml='38px'
				mt={0.5}>
				{hint}
			</Text>
		)}
	</Box>
);

const TextField: FC<{ label: string; value: string | number; onChange: (v: string) => void; hint?: ReactNode; placeholder?: string; type?: string; maxW?: string }> = ({
	label,
	value,
	onChange,
	hint,
	placeholder,
	type,
	maxW,
}) => (
	<Field.Root maxW={maxW}>
		<Field.Label {...labelCss}>{label}</Field.Label>
		<Input
			size='sm'
			type={type}
			value={value ?? ''}
			placeholder={placeholder}
			onChange={e => onChange(e.target.value)}
		/>
		{hint && <Text {...help}>{hint}</Text>}
	</Field.Root>
);

/** A choice among several, each one a ticked box with its words. */
const Choices: FC<{ items: { id: string; label: ReactNode; hint?: ReactNode }[]; value: string[]; onChange: (v: string[]) => void }> = ({ items, value, onChange }) => (
	<Grid
		templateColumns={{ base: '1fr', md: 'repeat(2, minmax(0, 1fr))' }}
		gap={2}>
		{items.map(it => {
			const on = value.includes(it.id);
			return (
				<Checkbox.Root
					key={it.id}
					size='sm'
					checked={on}
					onCheckedChange={() => onChange(on ? value.filter(v => v !== it.id) : [...value, it.id])}
					alignItems='flex-start'
					p={2.5}
					borderWidth='1px'
					borderColor={on ? 'border.emphasized' : 'border.muted'}
					borderRadius='md'
					cursor='pointer'>
					<Checkbox.HiddenInput />
					<Checkbox.Control mt='2px' />
					<Box>
						<Checkbox.Label fontSize='13px'>{it.label}</Checkbox.Label>
						{it.hint && <Text {...help}>{it.hint}</Text>}
					</Box>
				</Checkbox.Root>
			);
		})}
	</Grid>
);

/** Rows of the same small fields, added and removed. */
function Rows<T>({ rows, onChange, blank, render, addLabel, max = 20 }: { rows: T[]; onChange: (rows: T[]) => void; blank: T; render: (row: T, set: (r: T) => void, i: number) => ReactNode; addLabel: string; max?: number }) {
	return (
		<Flex
			direction='column'
			gap={2}>
			{rows.map((row, i) => (
				<Flex
					key={i}
					gap={2}
					align='flex-end'
					p={2.5}
					borderWidth='1px'
					borderColor='border.muted'
					borderRadius='md'>
					<Box flex='1'>{render(row, r => onChange(rows.map((x, j) => (j === i ? r : x))), i)}</Box>
					<IconButton
						aria-label='Remove'
						size='xs'
						variant='ghost'
						onClick={() => onChange(rows.filter((_, j) => j !== i))}>
						<Trash2 size={14} />
					</IconButton>
				</Flex>
			))}
			{rows.length < max && (
				<Button
					size='xs'
					variant='outline'
					alignSelf='flex-start'
					onClick={() => onChange([...rows, blank])}>
					<Plus size={13} />
					{addLabel}
				</Button>
			)}
		</Flex>
	);
}

const Stack: FC<{ children: ReactNode }> = ({ children }) => (
	<Flex
		direction='column'
		gap={4}>
		{children}
	</Flex>
);

/* ------------------------------------------------------------- sections */

export const StoreBasics: FC<SectionProps<'store'>> = ({ value, onChange, offered, built }) => (
	<Stack>
		<Grid
			templateColumns={{ base: '1fr', sm: '1fr 1fr' }}
			gap={3}>
			<TextField
				label='Currency'
				value={value.currency}
				onChange={currency => onChange({ ...value, currency: currency.toUpperCase().slice(0, 3) })}
				hint={offered.country ? `${offered.country.flag} ${offered.country.name} uses ${offered.currency}.` : 'A three-letter code: BDT, USD, EUR.'}
			/>
			<TextField
				label='Order number prefix'
				value={value.orderPrefix}
				onChange={orderPrefix => onChange({ ...value, orderPrefix: orderPrefix.toUpperCase().slice(0, 8) })}
				placeholder='ORD'
				hint={built ? 'New orders only — numbers already given stay.' : `Orders are numbered ${value.orderPrefix || 'ORD'}00001, ${value.orderPrefix || 'ORD'}00002…`}
			/>
		</Grid>
		<OnSwitch
			checked={value.negativeStock}
			onChange={negativeStock => onChange({ ...value, negativeStock })}
			label='Sell items the outlet has none of'
			hint='Off: the POS refuses a sale bigger than the outlet’s stock (“only 2 left here”). On: stock can go below zero, to be counted later.'
		/>
	</Stack>
);

export const Outlets: FC<SectionProps<'outlets'>> = ({ value, onChange }) => (
	<Stack>
		<Text {...help}>Each outlet keeps its own stock. The POS sells from stores; warehouses keep stock and send it on with transfers.</Text>
		<Rows
			rows={value}
			onChange={onChange}
			blank={{ name: '', code: '', kind: 'store' }}
			addLabel='Add an outlet'
			max={50}
			render={(o, set) => (
				<Grid
					templateColumns={{ base: '1fr', md: '2fr 1fr 1fr' }}
					gap={2}>
					<TextField
						label='Name'
						value={o.name}
						onChange={name => set({ ...o, name })}
						placeholder='Gulshan store'
					/>
					<TextField
						label='Code'
						value={o.code}
						onChange={code => set({ ...o, code: code.toUpperCase().slice(0, 12) })}
						placeholder='GUL'
					/>
					<Field.Root>
						<Field.Label {...labelCss}>Kind</Field.Label>
						<Dropdown
							size='sm'
							value={o.kind}
							onChange={kind => set({ ...o, kind: kind as 'store' | 'warehouse' })}
							items={[
								{ value: 'store', label: 'Store (sells)' },
								{ value: 'warehouse', label: 'Warehouse' },
							]}
						/>
					</Field.Root>
					<TextField
						label='Phone'
						value={o.phone || ''}
						onChange={phone => set({ ...o, phone })}
					/>
					<Box gridColumn={{ md: 'span 2' }}>
						<TextField
							label='Address'
							value={o.address || ''}
							onChange={address => set({ ...o, address })}
						/>
					</Box>
				</Grid>
			)}
		/>
	</Stack>
);

export const Products: FC<SectionProps<'products'>> = ({ value, onChange, built }) => (
	<Stack>
		<OnSwitch
			checked={value.variations}
			onChange={variations => onChange({ ...value, variations, options: variations && !value.options.length ? ['Size', 'Colour'] : value.options })}
			label='Products come in variations'
			hint={`Sizes, colours, flavours… Each variation has its own price, SKU, barcode and stock, and the POS asks which one. Off: each product is one item.${built ? ' It stays on while any product has several variants.' : ''}`}
		/>
		{value.variations && (
			<Box pl='38px'>
				<Text {...labelCss}>What products vary by</Text>
				<Text {...help}>Up to three — a product picks its own values (Size: S, M, L). You can name others on each product.</Text>
				<Flex
					gap={2}
					mt={2}
					wrap='wrap'>
					{[0, 1, 2].map(i => (
						<Input
							key={i}
							size='sm'
							maxW='160px'
							value={value.options[i] || ''}
							placeholder={['Size', 'Colour', 'Material'][i]}
							onChange={e => {
								const options = [...value.options];
								options[i] = e.target.value;
								onChange({ ...value, options: options.filter((o, j) => o || j < options.length - 1) });
							}}
						/>
					))}
				</Flex>
			</Box>
		)}
		<OnSwitch
			checked={value.barcodes}
			onChange={barcodes => onChange({ ...value, barcodes })}
			label='Scan barcodes'
			hint='The POS adds an item when its barcode or SKU is scanned or typed.'
		/>
		<OnSwitch
			checked={value.trackStock}
			onChange={trackStock => onChange({ ...value, trackStock })}
			label='Track stock for new products'
			hint='Off for services or made-to-order items; each product can change it.'
		/>
		<OnSwitch
			checked={value.brands}
			onChange={brands => onChange({ ...value, brands })}
			label='Products have brands'
		/>
	</Stack>
);

export const Payments: FC<SectionProps<'payments'>> = ({ value, onChange, offered }) => (
	<Stack>
		<Box>
			<Text {...labelCss}>In the store</Text>
			<Text
				{...help}
				mb={2}>
				How customers pay at the counter. Card and wallet payments are taken on your own terminal or app; the POS records the amount and its reference.
			</Text>
			<Choices
				items={offered.tenders.map(t => ({ id: t.id, label: t.label }))}
				value={value.tenders}
				onChange={tenders => onChange({ ...value, tenders })}
			/>
		</Box>
		<Box>
			<Text {...labelCss}>Other ways, by name</Text>
			<Text
				{...help}
				mb={2}>
				A gift voucher, a cheque, a local wallet — recorded with a reference like the others.
			</Text>
			<Rows
				rows={value.custom}
				onChange={custom => onChange({ ...value, custom })}
				blank=''
				addLabel='Add a way to pay'
				max={10}
				render={(c, set) => (
					<Input
						size='sm'
						value={c}
						placeholder='Gift voucher'
						onChange={e => set(e.target.value)}
					/>
				)}
			/>
		</Box>
		<Box>
			<Text {...labelCss}>Online</Text>
			<Text
				{...help}
				mb={2}>
				Your own merchant accounts, offered in {offered.country?.name || 'your country'}: payment links on orders, and refunds back to the card or wallet. You add the keys on Payments after setup.
			</Text>
			{offered.gateways.length ? (
				<Choices
					items={offered.gateways.map(g => ({ id: g.id, label: g.name }))}
					value={value.gateways}
					onChange={gateways => onChange({ ...value, gateways })}
				/>
			) : (
				<Text {...help}>None offered for your country yet.</Text>
			)}
		</Box>
	</Stack>
);

export const Returns: FC<SectionProps<'returns'>> = ({ value, onChange, offered }) => (
	<Stack>
		<OnSwitch
			checked={value.allowed}
			onChange={allowed => onChange({ ...value, allowed })}
			label='Take returns'
		/>
		{value.allowed && (
			<>
				<TextField
					label='Returns accepted for (days)'
					type='number'
					maxW='220px'
					value={value.windowDays}
					onChange={d => onChange({ ...value, windowDays: d === '' ? 0 : Number(d) })}
					hint='After the sale; 0 for no limit. A manager can still take a later return.'
				/>
				<OnSwitch
					checked={value.partial}
					onChange={partial => onChange({ ...value, partial })}
					label='Part of an order can be returned'
					hint='Some lines, or some of a line’s quantity. The refund is worked out from what was paid for those items, discounts included.'
				/>
				<OnSwitch
					checked={value.restockDefault}
					onChange={restockDefault => onChange({ ...value, restockDefault })}
					label='Returned items go back to stock'
					hint='The default for each returned item; damaged ones can be kept out.'
				/>
				<OnSwitch
					checked={value.storeCredit}
					onChange={storeCredit => onChange({ ...value, storeCredit, refundMethods: storeCredit ? value.refundMethods : value.refundMethods.filter(m => m !== 'store-credit') })}
					label='Store credit'
					hint='Refund to a customer’s credit, spent later at the POS like money.'
				/>
				<Box>
					<Text {...labelCss}>Refund by</Text>
					<Box mt={2}>
						<Choices
							items={offered.refundMethods.filter(m => m.id !== 'store-credit' || value.storeCredit).map(m => ({ id: m.id, label: m.label }))}
							value={value.refundMethods}
							onChange={refundMethods => onChange({ ...value, refundMethods })}
						/>
					</Box>
				</Box>
			</>
		)}
	</Stack>
);

export const Delivery: FC<SectionProps<'delivery'>> = ({ value, onChange, offered }) => (
	<Stack>
		<OnSwitch
			checked={value.enabled}
			onChange={enabled => onChange({ ...value, enabled })}
			label='Deliver orders'
			hint='Orders taken by phone or by hand can be delivered: an address, a shipping charge, and a courier.'
		/>
		{value.enabled && (
			<>
				<Box>
					<Text {...labelCss}>Shipping charges</Text>
					<Text
						{...help}
						mb={2}>
						Picked on an order; the amount can still be changed there.
					</Text>
					<Rows
						rows={value.rates}
						onChange={rates => onChange({ ...value, rates })}
						blank={{ name: '', amount: 0 }}
						addLabel='Add a shipping charge'
						render={(r, set) => (
							<Grid
								templateColumns='2fr 1fr'
								gap={2}>
								<Input
									size='sm'
									value={r.name}
									placeholder='Inside Dhaka'
									onChange={e => set({ ...r, name: e.target.value })}
								/>
								<Input
									size='sm'
									type='number'
									value={r.amount}
									onChange={e => set({ ...r, amount: Number(e.target.value) })}
								/>
							</Grid>
						)}
					/>
				</Box>
				<Box>
					<Text {...labelCss}>Couriers</Text>
					<Text
						{...help}
						mb={2}>
						An order’s page gets <b>Send to courier</b> for the couriers you use — the parcel is booked with them and tracked. You connect your courier account after setup.
					</Text>
					{offered.couriers.length ? (
						<Choices
							items={offered.couriers.map(c => ({ id: c.id, label: c.name }))}
							value={value.couriers}
							onChange={couriers => onChange({ ...value, couriers })}
						/>
					) : (
						<Text {...help}>No couriers are connected for your country yet — orders can still be marked shipped and delivered by hand.</Text>
					)}
				</Box>
			</>
		)}
	</Stack>
);

export const Pos: FC<SectionProps<'pos'>> = ({ value, onChange }) => {
	const tax = value.tax;
	return (
		<Stack>
			<Box>
				<Text {...labelCss}>Receipts</Text>
				<SegmentGroup.Root
					size='sm'
					mt={2}
					value={value.receipt.size}
					onValueChange={d => onChange({ ...value, receipt: { ...value.receipt, size: (d.value as '80mm' | 'a4') || '80mm' } })}
					w='fit-content'>
					<SegmentGroup.Indicator />
					<SegmentGroup.Items
						items={[
							{ value: '80mm', label: 'Receipt printer (80 mm)' },
							{ value: 'a4', label: 'A4 paper' },
						]}
					/>
				</SegmentGroup.Root>
				<Grid
					templateColumns={{ base: '1fr', md: '1fr 1fr' }}
					gap={3}
					mt={3}>
					<Field.Root>
						<Field.Label {...labelCss}>Top of the receipt</Field.Label>
						<Textarea
							size='sm'
							rows={2}
							value={value.receipt.header}
							placeholder='Your shop name is printed already — add a line, a VAT number…'
							onChange={e => onChange({ ...value, receipt: { ...value.receipt, header: e.target.value } })}
						/>
					</Field.Root>
					<Field.Root>
						<Field.Label {...labelCss}>Bottom of the receipt</Field.Label>
						<Textarea
							size='sm'
							rows={2}
							value={value.receipt.footer}
							placeholder='Thank you! Returns within 30 days with this receipt.'
							onChange={e => onChange({ ...value, receipt: { ...value.receipt, footer: e.target.value } })}
						/>
					</Field.Root>
				</Grid>
			</Box>
			<OnSwitch
				checked={value.shifts}
				onChange={shifts => onChange({ ...value, shifts })}
				label='Registers and shifts'
				hint='A cashier opens a shift with the cash in the drawer and closes it with a count; the POS shows what should be there.'
			/>
			<OnSwitch
				checked={value.held}
				onChange={held => onChange({ ...value, held })}
				label='Hold a sale'
				hint='Park a customer’s basket and serve the next one; pick it up again later.'
			/>
			<OnSwitch
				checked={value.discounts}
				onChange={discounts => onChange({ ...value, discounts })}
				label='Discounts at the till'
				hint='Money or a percentage off an item or the whole sale.'
			/>
			<OnSwitch
				checked={value.coupons}
				onChange={coupons => onChange({ ...value, coupons })}
				label='Coupon codes'
			/>
			<OnSwitch
				checked={value.customerRequired}
				onChange={customerRequired => onChange({ ...value, customerRequired })}
				label='Every sale needs a customer'
				hint='Off: walk-in sales without a name are fine.'
			/>
			<Box>
				<Text {...labelCss}>Tax</Text>
				<SegmentGroup.Root
					size='sm'
					mt={2}
					value={tax.mode}
					onValueChange={d => onChange({ ...value, tax: { ...tax, mode: (d.value as any) || 'none', rates: d.value !== 'none' && !tax.rates.length ? [{ name: 'VAT', rate: 15, default: true }] : tax.rates } })}
					w='fit-content'>
					<SegmentGroup.Indicator />
					<SegmentGroup.Items
						items={[
							{ value: 'none', label: 'No tax' },
							{ value: 'inclusive', label: 'In the price' },
							{ value: 'added', label: 'Added at the till' },
						]}
					/>
				</SegmentGroup.Root>
				<Text {...help}>
					{tax.mode === 'inclusive'
						? 'Prices already include tax; receipts show how much of it was tax.'
						: tax.mode === 'added'
						? 'Tax is added on top of prices at the till.'
						: 'Nothing is added and receipts show no tax.'}
				</Text>
				{tax.mode !== 'none' && (
					<Box mt={3}>
						<Rows
							rows={tax.rates}
							onChange={rates => onChange({ ...value, tax: { ...tax, rates } })}
							blank={{ name: '', rate: 0 }}
							addLabel='Add a tax rate'
							render={(r, set, i) => (
								<Grid
									templateColumns='2fr 1fr auto'
									gap={2}
									alignItems='center'>
									<Input
										size='sm'
										value={r.name}
										placeholder='VAT'
										onChange={e => set({ ...r, name: e.target.value })}
									/>
									<Input
										size='sm'
										type='number'
										value={r.rate}
										onChange={e => set({ ...r, rate: Number(e.target.value) })}
									/>
									<Checkbox.Root
										size='sm'
										checked={!!r.default}
										onCheckedChange={() => onChange({ ...value, tax: { ...tax, rates: tax.rates.map((x, j) => ({ ...x, default: j === i })) } })}>
										<Checkbox.HiddenInput />
										<Checkbox.Control />
										<Checkbox.Label fontSize='12px'>Default</Checkbox.Label>
									</Checkbox.Root>
								</Grid>
							)}
						/>
					</Box>
				)}
			</Box>
		</Stack>
	);
};

/** Each section: its title, what it's for, its editor and its guide anchor. */
export const SECTIONS: { key: CommerceSection; title: string; intro: string; anchor: string; Editor: FC<SectionProps<any>> }[] = [
	{ key: 'store', title: 'Your store', intro: 'The money it sells in, how orders are numbered, and whether stock may go below zero.', anchor: 'store-basics', Editor: StoreBasics },
	{ key: 'outlets', title: 'Outlets', intro: 'Where you sell from and keep stock.', anchor: 'store-outlets', Editor: Outlets },
	{ key: 'products', title: 'Products', intro: 'Whether products come in variations, and how they’re scanned and counted.', anchor: 'store-products', Editor: Products },
	{ key: 'payments', title: 'Payments', intro: 'How customers pay you — at the counter and online.', anchor: 'store-payments', Editor: Payments },
	{ key: 'returns', title: 'Returns & refunds', intro: 'Whether items can come back, for how long, and how money goes back.', anchor: 'store-returns', Editor: Returns },
	{ key: 'delivery', title: 'Delivery', intro: 'Orders sent to customers: shipping charges and couriers.', anchor: 'store-delivery', Editor: Delivery },
	{ key: 'pos', title: 'POS', intro: 'The till: receipts, shifts, holding sales, discounts and tax.', anchor: 'store-pos', Editor: Pos },
];
