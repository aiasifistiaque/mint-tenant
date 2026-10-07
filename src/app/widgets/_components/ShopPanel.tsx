'use client';

import { FC, useEffect, useMemo, useState } from 'react';
import { Box, Button, Checkbox, Flex, Grid, Input, Skeleton, Text } from '@chakra-ui/react';
import { PromptDialog } from '@/components/library';
import { Dropdown, Panel } from '@/components/library/cl';
import GuideLink from '@/components/library/tenant/GuideLink';
import { toaster } from '@/components/ui/toaster';
import { useGetWidgetsShopQuery, useSaveWidgetsShopMutation } from '@/components/library/store/services/tenantApi';
import type { ShopMapping, ShopModel, ShopModelField, ShopOrderMapping, ShopView } from '@/components/library/store/services/tenantApi';

/**
 * Site setup → Widgets → Shop (docs/widgets W-05): which of the project's
 * models is the catalogue and what its fields mean, where signed-in carts are
 * kept, the currency. The cart (and later checkout) price everything from it on
 * the server. Backend: functions/shop.function.ts (`checkShop` says what fits,
 * `guessShop` the suggestion). Saved on its own, not with the widgets bar.
 */

const label = { fontSize: '13px', fontWeight: '600', mb: 1.5 } as const;
const help = { fontSize: '12px', color: 'fg.muted', mt: 1 } as const;

/** What each part may be — kept in step with the backend's KINDS. */
const KINDS: Record<string, string[]> = {
	name: ['text', 'textarea'],
	price: ['number', 'formula'],
	compareAtPrice: ['number', 'formula'],
	image: ['image', 'images'],
	stock: ['number'],
	status: ['select', 'text', 'boolean'],
	variants: ['sectionlist'],
	variantName: ['text', 'select'],
	number: ['number'],
	cartQuantity: ['number'],
	cartVariant: ['text', 'select'],
	cartLabel: ['text'],
};

const PRODUCT_FIELDS: { key: keyof ShopMapping['product']['fields']; label: string; kinds: string[]; required?: boolean; help: string }[] = [
	{ key: 'name', label: 'Name', kinds: KINDS.name, required: true, help: 'What the cart calls it.' },
	{ key: 'price', label: 'Price', kinds: KINDS.price, required: true, help: 'What it sells for.' },
	{ key: 'compareAtPrice', label: 'Compare-at price', kinds: KINDS.compareAtPrice, help: 'The old price, crossed out when it’s higher.' },
	{ key: 'image', label: 'Image', kinds: KINDS.image, help: 'The first one shows in the cart.' },
	{ key: 'stock', label: 'Stock', kinds: KINDS.stock, help: 'None: never runs out.' },
	{ key: 'status', label: 'Status', kinds: KINDS.status, help: 'None: every product is for sale.' },
	{ key: 'variants', label: 'Variants', kinds: KINDS.variants, help: 'A list of sizes or colours, each with its own price and stock.' },
	{ key: 'sku', label: 'SKU', kinds: ['text'], help: 'Copied onto each order item.' },
];

/** The order's own fields checkout fills in (W-06) — the items list and status are picked above them. */
const ORDER_FIELDS: { key: keyof ShopOrderMapping['fields']; label: string; kinds: string[]; help: string }[] = [
	{ key: 'email', label: 'Email', kinds: ['email', 'text'], help: 'For the receipt.' },
	{ key: 'name', label: 'Name', kinds: ['text'], help: '' },
	{ key: 'phone', label: 'Phone', kinds: ['text'], help: '' },
	{ key: 'address', label: 'Delivery address', kinds: ['section', 'text', 'textarea'], help: 'A group of fields (line1, city, postcode…) or one text box.' },
	{ key: 'note', label: 'Buyer’s note', kinds: ['text', 'textarea'], help: '' },
	{ key: 'total', label: 'Total', kinds: ['number'], help: 'A formula total fills itself in.' },
	{ key: 'shippingCost', label: 'Delivery cost', kinds: ['number'], help: '' },
	{ key: 'paymentReference', label: 'Payment reference', kinds: ['text'], help: 'The provider’s id for the payment.' },
];
const ITEM_FIELDS: { key: keyof ShopOrderMapping['item']; label: string; kinds: string[]; required?: boolean }[] = [
	{ key: 'name', label: 'Product name', kinds: ['text', 'select'], required: true },
	{ key: 'quantity', label: 'Quantity', kinds: ['number'], required: true },
	{ key: 'unitPrice', label: 'Unit price', kinds: ['number'], required: true },
	{ key: 'variant', label: 'Variant', kinds: ['text', 'select'] },
	{ key: 'sku', label: 'SKU', kinds: ['text'] },
	{ key: 'product', label: 'Product link', kinds: ['reference'] },
];

const empty = (currency = ''): ShopMapping => ({ product: { model: '', fields: { name: '', price: '' } }, cart: null, currency });
const NONE = '__none';
/** What the form starts from: the working mapping, else what's saved (to fix), else the suggestion. */
const startOf = (v: ShopView): ShopMapping => v.shop || v.saved || v.guess || empty();

/** A field picker: the model's fields of the kinds that fit, and "none" when it's optional. */
const FieldPick: FC<{ fields: ShopModelField[] | { key: string; label: string; kind: string }[]; kinds: string[]; value?: string; required?: boolean; onChange: (v?: string) => void }> = ({
	fields,
	kinds,
	value,
	required,
	onChange,
}) => {
	const items = fields.filter(f => kinds.includes(f.kind)).map(f => ({ value: f.key, label: `${f.label} (${f.kind})` }));
	return (
		<Dropdown
			size='sm'
			value={value || (required ? '' : NONE)}
			placeholder={items.length ? 'Pick a field' : `No ${kinds.join(' / ')} field`}
			onChange={v => onChange(v === NONE ? undefined : v)}
			items={required ? items : [{ value: NONE, label: '— None —' }, ...items]}
		/>
	);
};

const describe = (shop: ShopMapping, models: ShopModel[]) => {
	const title = (name: string) => models.find(m => m.name === name)?.title || name;
	return `Products from ${title(shop.product.model)}, carts kept ${shop.cart ? `in ${title(shop.cart.model)}` : 'in MINT'}, prices in ${shop.currency}.`;
};

const ShopPanel: FC = () => {
	const { data, isLoading, isError } = useGetWidgetsShopQuery();
	const [save, saving] = useSaveWidgetsShopMutation();
	const [draft, setDraft] = useState<ShopMapping | null>(null);
	const [clearing, setClearing] = useState(false);

	useEffect(() => {
		if (data) setDraft(startOf(data));
	}, [data]);

	const models = data?.models || [];
	const product = models.find(m => m.name === draft?.product.model);
	const statusField = product?.fields.find(f => f.key === draft?.product.fields.status);
	const variantsField = product?.fields.find(f => f.key === draft?.product.fields.variants);
	const cartModel = models.find(m => m.name === draft?.cart?.model);
	const cartModels = useMemo(
		() => models.filter(m => m.name !== draft?.product.model && m.fields.some(f => f.kind === 'reference' && f.ref === draft?.product.model)),
		[models, draft?.product.model]
	);
	const orderModels = models.filter(m => m.name !== draft?.product.model && m.fields.some(f => f.kind === 'sectionlist'));
	const orderModel = models.find(m => m.name === draft?.order?.model);
	const orderItemsField = orderModel?.fields.find(f => f.key === draft?.order?.fields.items);
	const orderStatus = orderModel?.fields.find(f => f.key === draft?.order?.fields.status);
	const setOrder = (patch: Partial<ShopOrderMapping>) => setDraft(d => (d && d.order ? { ...d, order: { ...d.order, ...patch } } : d));
	const dirty = !!draft && !!data && JSON.stringify(draft) !== JSON.stringify(data.shop);

	const setProduct = (patch: Partial<ShopMapping['product']>) => setDraft(d => (d ? { ...d, product: { ...d.product, ...patch } } : d));
	const setField = (key: string, v?: string) => {
		const fields: any = { ...draft!.product.fields, [key]: v };
		if (!v) delete fields[key];
		const patch: Partial<ShopMapping['product']> = { fields };
		if (key === 'status') {
			const f = product?.fields.find(x => x.key === v);
			patch.activeValues = !v ? undefined : f?.kind === 'boolean' ? [true] : f?.options?.some(o => o.value === 'active') ? ['active'] : [];
		}
		if (key === 'variants') patch.variant = v ? { name: '' } : undefined;
		setProduct(patch);
	};

	const onSave = async (shop: ShopMapping | null) => {
		try {
			const out = await save({ shop }).unwrap();
			setClearing(false);
			toaster.create({ type: 'success', title: shop ? 'Shop saved — the cart uses it at once.' : 'Shop cleared — the cart is off.' });
			setDraft(out.shop || out.guess || empty());
		} catch (e: any) {
			toaster.create({ type: 'error', title: e?.data?.message || 'Not saved — try again.' });
		}
	};

	// The panel can ship before the backend has the shop (Heroku deploys by hand): hide rather than spin.
	if (isError) return null;
	if (isLoading || !data || !draft)
		return (
			<Panel
				title='Shop'
				subtitle='Your catalogue, for the cart'>
				<Skeleton h='120px' />
			</Panel>
		);

	const variantMode = draft.product.variant?.price ? 'price' : draft.product.variant?.priceChange ? 'change' : 'same';

	return (
		<Panel
			id='shop'
			title='Shop'
			subtitle='Which model is your catalogue — the cart prices everything from it'
			actions={<GuideLink section='shop' />}>
			<Text
				fontSize='13px'
				color='fg.muted'
				lineHeight='1.6'
				mb={3}>
				Widgets don’t assume your models’ names. Say which one holds your products and what its fields mean; prices,
				stock and totals are then always read from it on the server — a page can’t change what something costs.
			</Text>
			<Box
				mb={4}
				fontSize='13px'
				p={2.5}
				borderRadius='md'
				bg={data.shop ? 'green.subtle' : data.problem ? 'orange.subtle' : 'bg.subtle'}
				color={data.shop ? 'green.fg' : data.problem ? 'orange.fg' : 'fg'}>
				{data.shop
					? `Set up. ${describe(data.shop, models)}`
					: data.problem
					? `${data.problem} The cart is off until it’s fixed and saved.`
					: data.guess
					? 'Not set up yet — we’ve filled in what looks like your catalogue. Check it and save.'
					: models.length
					? 'Not set up yet. Pick the model that holds your products.'
					: 'Add a products model first (Build → Models), or start a project from the E-commerce template.'}
			</Box>

			{models.length > 0 && (
				<Flex
					direction='column'
					gap={5}>
					<Grid
						templateColumns={{ base: '1fr', md: 'repeat(3, minmax(0, 1fr))' }}
						gap={4}>
						<Box>
							<Text {...label}>Products model</Text>
							<Dropdown
								size='sm'
								value={draft.product.model}
								placeholder='Pick a model'
								onChange={v => setDraft({ ...empty(draft.currency), product: { model: v, fields: { name: '', price: '' } } })}
								items={models.map(m => ({ value: m.name, label: m.title }))}
							/>
							<Text {...help}>The model your products are records of.</Text>
						</Box>
						<Box>
							<Text {...label}>Currency</Text>
							<Input
								size='sm'
								maxLength={3}
								fontFamily='mono'
								value={draft.currency}
								placeholder='BDT'
								onChange={e => setDraft({ ...draft, currency: e.target.value.toUpperCase().replace(/[^A-Z]/g, '') })}
							/>
							<Text {...help}>The three-letter code your prices are in (BDT, USD, GBP…).</Text>
						</Box>
					</Grid>

					{product && (
						<Box>
							<Text
								fontSize='13px'
								fontWeight='600'
								mb={2}>
								Which field is which
							</Text>
							<Grid
								templateColumns={{ base: '1fr', md: 'repeat(3, minmax(0, 1fr))' }}
								gap={4}>
								{PRODUCT_FIELDS.map(f => (
									<Box key={f.key}>
										<Text {...label}>
											{f.label}
											{f.required ? ' *' : ''}
										</Text>
										<FieldPick
											fields={product.fields}
											kinds={f.kinds}
											value={draft.product.fields[f.key]}
											required={f.required}
											onChange={v => setField(f.key, v)}
										/>
										<Text {...help}>{f.help}</Text>
									</Box>
								))}
							</Grid>
						</Box>
					)}

					{statusField && (
						<Box>
							<Text {...label}>For sale when the status is</Text>
							{statusField.kind === 'select' ? (
								<Flex
									gap={4}
									wrap='wrap'>
									{(statusField.options || []).map(o => {
										const on = (draft.product.activeValues || []).includes(o.value);
										return (
											<Checkbox.Root
												key={o.value}
												size='sm'
												checked={on}
												onCheckedChange={() =>
													setProduct({ activeValues: on ? (draft.product.activeValues || []).filter(v => v !== o.value) : [...(draft.product.activeValues || []), o.value] })
												}>
												<Checkbox.HiddenInput />
												<Checkbox.Control />
												<Checkbox.Label fontSize='13px'>{o.label}</Checkbox.Label>
											</Checkbox.Root>
										);
									})}
								</Flex>
							) : statusField.kind === 'boolean' ? (
								<Box maxW='240px'>
									<Dropdown
										size='sm'
										value={String(draft.product.activeValues?.[0] ?? true)}
										onChange={v => setProduct({ activeValues: [v === 'true'] })}
										items={[
											{ value: 'true', label: 'Ticked' },
											{ value: 'false', label: 'Not ticked' },
										]}
									/>
								</Box>
							) : (
								<Input
									size='sm'
									maxW='360px'
									value={(draft.product.activeValues || []).join(', ')}
									placeholder='active, on sale'
									onChange={e => setProduct({ activeValues: e.target.value.split(',').map(v => v.trim()).filter(Boolean) })}
								/>
							)}
							<Text {...help}>Anything else (a draft, an archived product) can’t be added to a cart.</Text>
						</Box>
					)}

					{variantsField && (
						<Box>
							<Text
								fontSize='13px'
								fontWeight='600'
								mb={2}>
								Each variant
							</Text>
							<Grid
								templateColumns={{ base: '1fr', md: 'repeat(3, minmax(0, 1fr))' }}
								gap={4}>
								<Box>
									<Text {...label}>Its name *</Text>
									<FieldPick
										fields={variantsField.fields || []}
										kinds={KINDS.variantName}
										value={draft.product.variant?.name}
										required
										onChange={v => setProduct({ variant: { ...draft.product.variant!, name: v || '' } })}
									/>
									<Text {...help}>What the customer picks, e.g. Large.</Text>
								</Box>
								<Box>
									<Text {...label}>Its price</Text>
									<Dropdown
										size='sm'
										value={variantMode}
										onChange={v => {
											const { price, priceChange, ...rest } = draft.product.variant!;
											setProduct({ variant: { ...rest, ...(v === 'change' && { priceChange: '' }), ...(v === 'price' && { price: '' }) } });
										}}
										items={[
											{ value: 'same', label: 'The product’s price' },
											{ value: 'change', label: 'The product’s, plus or minus' },
											{ value: 'price', label: 'A price of its own' },
										]}
									/>
									{variantMode !== 'same' && (
										<Box mt={2}>
											<FieldPick
												fields={variantsField.fields || []}
												kinds={KINDS.number}
												value={variantMode === 'change' ? draft.product.variant?.priceChange : draft.product.variant?.price}
												required
												onChange={v => setProduct({ variant: { ...draft.product.variant!, [variantMode === 'change' ? 'priceChange' : 'price']: v || '' } })}
											/>
										</Box>
									)}
								</Box>
								<Box>
									<Text {...label}>Its stock</Text>
									<FieldPick
										fields={variantsField.fields || []}
										kinds={KINDS.number}
										value={draft.product.variant?.stock}
										onChange={v => {
											const { stock, ...rest } = draft.product.variant!;
											setProduct({ variant: v ? { ...rest, stock: v } : rest });
										}}
									/>
									<Text {...help}>None: the product’s stock counts for all of them.</Text>
								</Box>
							</Grid>
						</Box>
					)}

					{product && (
						<Box>
							<Text
								fontSize='13px'
								fontWeight='600'
								mb={2}>
								Signed-in customers’ carts
							</Text>
							<Grid
								templateColumns={{ base: '1fr', md: 'repeat(3, minmax(0, 1fr))' }}
								gap={4}>
								<Box>
									<Text {...label}>Kept in</Text>
									<Dropdown
										size='sm'
										value={draft.cart?.model || NONE}
										onChange={v => {
											const m = cartModels.find(x => x.name === v);
											const ref = m?.fields.find(f => f.kind === 'reference' && f.ref === draft.product.model);
											setDraft({ ...draft, cart: m ? { model: m.name, fields: { product: ref?.key || '', quantity: '' } } : null });
										}}
										items={[{ value: NONE, label: 'MINT (nothing to set up)' }, ...cartModels.map(m => ({ value: m.name, label: m.title }))]}
									/>
									<Text {...help}>
										A model of yours shows every cart line as a record your team can see. Its public API must be on, owner-only.
										Guests’ carts stay in their browser either way.
									</Text>
								</Box>
								{cartModel && (
									<>
										<Box>
											<Text {...label}>Quantity *</Text>
											<FieldPick
												fields={cartModel.fields}
												kinds={KINDS.cartQuantity}
												value={draft.cart?.fields.quantity}
												required
												onChange={v => setDraft({ ...draft, cart: { ...draft.cart!, fields: { ...draft.cart!.fields, quantity: v || '' } } })}
											/>
										</Box>
										<Box>
											<Text {...label}>Variant{draft.product.fields.variants ? ' *' : ''}</Text>
											<FieldPick
												fields={cartModel.fields}
												kinds={KINDS.cartVariant}
												value={draft.cart?.fields.variant}
												onChange={v => {
													const { variant, ...rest } = draft.cart!.fields;
													setDraft({ ...draft, cart: { ...draft.cart!, fields: v ? { ...rest, variant: v } : rest } });
												}}
											/>
										</Box>
										<Box>
											<Text {...label}>Label</Text>
											<FieldPick
												fields={cartModel.fields}
												kinds={KINDS.cartLabel}
												value={draft.cart?.fields.label}
												onChange={v => {
													const { label: _l, ...rest } = draft.cart!.fields;
													setDraft({ ...draft, cart: { ...draft.cart!, fields: v ? { ...rest, label: v } : rest } });
												}}
											/>
											<Text {...help}>Filled in with the product’s name and variant.</Text>
										</Box>
									</>
								)}
							</Grid>
						</Box>
					)}

					{product && (
						<Box id='shop-orders'>
							<Flex
								align='center'
								justify='space-between'
								mb={2}>
								<Text
									fontSize='13px'
									fontWeight='600'>
									Orders — where checkout writes them
								</Text>
								<GuideLink section='shop-orders' />
							</Flex>
							<Grid
								templateColumns={{ base: '1fr', md: 'repeat(3, minmax(0, 1fr))' }}
								gap={4}>
								<Box>
									<Text {...label}>Orders model</Text>
									<Dropdown
										size='sm'
										value={draft.order?.model || NONE}
										onChange={v => {
											if (v === NONE) return setDraft({ ...draft, order: null });
											const m = models.find(x => x.name === v);
											const items = m?.fields.find(f => f.kind === 'sectionlist');
											const status = m?.fields.find(f => f.kind === 'select' && /status/i.test(f.key));
											setDraft({ ...draft, order: { model: v, fields: { items: items?.key || '', status: status?.key || '' }, item: { name: '', quantity: '', unitPrice: '' }, statuses: { pending: '', paid: '' } } });
										}}
										items={[{ value: NONE, label: '— No checkout yet —' }, ...orderModels.map(m => ({ value: m.name, label: m.title }))]}
									/>
									<Text {...help}>Needs a list of items and a status. Without it the cart works, checkout doesn’t.</Text>
								</Box>
								{orderModel && draft.order && (
									<>
										<Box>
											<Text {...label}>Items list *</Text>
											<FieldPick
												fields={orderModel.fields}
												kinds={['sectionlist']}
												value={draft.order.fields.items}
												required
												onChange={v => setOrder({ fields: { ...draft.order!.fields, items: v || '' }, item: { name: '', quantity: '', unitPrice: '' } })}
											/>
										</Box>
										<Box>
											<Text {...label}>Status *</Text>
											<FieldPick
												fields={orderModel.fields}
												kinds={['select', 'text']}
												value={draft.order.fields.status}
												required
												onChange={v => setOrder({ fields: { ...draft.order!.fields, status: v || '' }, statuses: { pending: '', paid: '' } })}
											/>
										</Box>
									</>
								)}
							</Grid>
							{orderModel && draft.order && (
								<Flex
									direction='column'
									gap={4}
									mt={4}>
									<Grid
										templateColumns={{ base: '1fr', md: 'repeat(3, minmax(0, 1fr))' }}
										gap={4}>
										{(['pending', 'paid', 'cancelled'] as const).map(k => (
											<Box key={k}>
												<Text {...label}>
													{k === 'pending' ? 'Waiting for payment *' : k === 'paid' ? 'Paid *' : 'Cancelled'}
												</Text>
												{orderStatus?.kind === 'select' ? (
													<Dropdown
														size='sm'
														value={draft.order!.statuses[k] || (k === 'cancelled' ? NONE : '')}
														placeholder='Pick a status'
														onChange={v => setOrder({ statuses: { ...draft.order!.statuses, [k]: v === NONE ? undefined : v } as ShopOrderMapping['statuses'] })}
														items={[...(k === 'cancelled' ? [{ value: NONE, label: '— None —' }] : []), ...(orderStatus.options || [])]}
													/>
												) : (
													<Input
														size='sm'
														value={draft.order!.statuses[k] || ''}
														onChange={e => setOrder({ statuses: { ...draft.order!.statuses, [k]: e.target.value } as ShopOrderMapping['statuses'] })}
													/>
												)}
												<Text {...help}>
													{k === 'pending' ? 'New orders start here.' : k === 'paid' ? 'Set only when the payment provider confirms.' : 'If the payment page can’t be opened.'}
												</Text>
											</Box>
										))}
									</Grid>
									<Box>
										<Text
											fontSize='13px'
											fontWeight='600'
											mb={2}>
											Each item
										</Text>
										<Grid
											templateColumns={{ base: '1fr', md: 'repeat(3, minmax(0, 1fr))' }}
											gap={4}>
											{ITEM_FIELDS.map(f => (
												<Box key={f.key}>
													<Text {...label}>
														{f.label}
														{f.required ? ' *' : ''}
													</Text>
													<FieldPick
														fields={orderItemsField?.fields || []}
														kinds={f.kinds}
														value={draft.order!.item[f.key]}
														required={f.required}
														onChange={v => {
															const item: any = { ...draft.order!.item, [f.key]: v };
															if (!v) delete item[f.key];
															setOrder({ item });
														}}
													/>
												</Box>
											))}
										</Grid>
									</Box>
									<Box>
										<Text
											fontSize='13px'
											fontWeight='600'
											mb={2}>
											The buyer and the money
										</Text>
										<Grid
											templateColumns={{ base: '1fr', md: 'repeat(4, minmax(0, 1fr))' }}
											gap={4}>
											{ORDER_FIELDS.map(f => (
												<Box key={f.key}>
													<Text {...label}>{f.label}</Text>
													<FieldPick
														fields={orderModel.fields}
														kinds={f.kinds}
														value={draft.order!.fields[f.key]}
														onChange={v => {
															const fields: any = { ...draft.order!.fields, [f.key]: v };
															if (!v) delete fields[f.key];
															setOrder({ fields });
														}}
													/>
													{f.help && <Text {...help}>{f.help}</Text>}
												</Box>
											))}
										</Grid>
										<Text {...help}>Saving makes the status and payment reference read-only on your public API — only checkout sets them.</Text>
									</Box>
								</Flex>
							)}
						</Box>
					)}

					<Flex
						gap={2}
						wrap='wrap'>
						<Button
							size='sm'
							disabled={!dirty || !draft.product.model}
							loading={saving.isLoading && !clearing}
							onClick={() => onSave(draft)}>
							Save shop
						</Button>
						{dirty && (
							<Button
								size='sm'
								variant='ghost'
								onClick={() => setDraft(startOf(data))}>
								Discard
							</Button>
						)}
						{data.guess && JSON.stringify(draft) !== JSON.stringify(data.guess) && (
							<Button
								size='sm'
								variant='outline'
								onClick={() => setDraft(data.guess)}>
								Use the suggestion
							</Button>
						)}
						{(data.shop || data.saved) && (
							<Button
								size='sm'
								variant='ghost'
								colorPalette='red'
								onClick={() => setClearing(true)}>
								Clear
							</Button>
						)}
					</Flex>
				</Flex>
			)}

			<PromptDialog
				open={clearing}
				onClose={() => setClearing(false)}
				tone='danger'
				title='Clear the shop?'
				description='The cart switches off on your site straight away. Customers’ saved carts are kept and come back when you set the shop up again.'
				confirmLabel='Clear the shop'
				loading={saving.isLoading}
				onConfirm={() => onSave(null)}
			/>
		</Panel>
	);
};

export default ShopPanel;
