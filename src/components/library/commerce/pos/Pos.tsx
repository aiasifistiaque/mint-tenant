'use client';

import { FC, KeyboardEvent, ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { Badge, Box, Button, Center, Drawer, Field, Flex, Grid, IconButton, Image, Input, Portal, SegmentGroup, Skeleton, Spinner, Text } from '@chakra-ui/react';
import { Clock, Minus, Pause, Percent, Plus, Printer, ScanBarcode, ShoppingBag, Tag, Trash2, User, X } from 'lucide-react';
import { useIsMobile } from '../../hooks';
import { DrawerContentContainer } from '../../components/table/table-components/pop-modals';
import { Dialog, DialogBody, DialogCloseButton, DialogFooter, DialogHeader, DiscardButton } from '../..';
import { styles } from '../../config';
import { getProjectSlug } from '../../config/lib/constants/panel';
import { Dropdown, EmptyState } from '../../cl';
import { toaster } from '@/components/ui/toaster';
import { useGetAllQuery, usePostMutation } from '../../store/services/commonApi';
import {
	useCreateStoreSaleMutation,
	useDiscardStoreHeldMutation,
	useGetPosSetupQuery,
	useGetStoreCatalogueQuery,
	useGetStoreCategoriesQuery,
	useGetStoreHeldQuery,
	useHoldStoreSaleMutation,
	useLazyLookupStoreCodeQuery,
	useQuoteStoreBasketMutation,
} from '../../store/services/commerceApi';
import type { CommerceView, PosSetup, StoreCatalogueProduct, StoreDiscount, StoreItem, StoreOrderDetail, StorePaymentInput, StoreQuote } from '../../store/services/commerceApi';
import GuideLink from '../../tenant/GuideLink';
import { help } from '../sections';
import { PayDialog } from './pay';
import { OpenShift, ShiftDialog } from './shift';
import { moneyFor, printReceipt, receiptHtml } from './receipt';

/**
 * The POS (backend docs/ecommerce EC-07): pick a register, open its shift,
 * scan or tap items in, add a customer, discounts and a coupon, take the
 * money, print the receipt. Every figure on screen comes from the store's
 * quote — the browser only says what's in the basket.
 */

type Line = { variant: string; name: string; sku: string; price: number; quantity: number; discount: StoreDiscount };
type Customer = { _id: string; name: string; phone?: string; storeCredit?: number };

const errorText = (r: any) => r?.error?.data?.message || r?.data?.message || 'Something went wrong — try again.';
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
const registerKey = () => `mint-pos-register:${getProjectSlug() || ''}`;
const remembered = () => {
	try {
		return localStorage.getItem(registerKey()) || '';
	} catch {
		return '';
	}
};

/* ------------------------------------------------------------ small dialogs */

const DiscountDialog: FC<{ open: boolean; onClose: () => void; title: string; value: StoreDiscount; currency: string; onSave: (d: StoreDiscount) => void }> = ({ open, onClose, title, value, currency, onSave }) => {
	const [type, setType] = useState<'percent' | 'amount'>('percent');
	const [n, setN] = useState('');
	useEffect(() => {
		if (open) {
			setType(value?.type || 'percent');
			setN(value?.value ? String(value.value) : '');
		}
	}, [open]);
	const save = () => {
		const v = Number(n);
		onSave(v > 0 ? { type, value: type === 'percent' ? Math.min(v, 100) : v } : null);
		onClose();
	};
	return (
		<Dialog
			isOpen={open}
			onClose={onClose}
			size='xs'
			forceModal>
			<DialogHeader>{title}</DialogHeader>
			<DialogCloseButton />
			<DialogBody>
				<Flex
					direction='column'
					gap={3}>
					<SegmentGroup.Root
						size='sm'
						value={type}
						onValueChange={d => setType((d.value as any) || 'percent')}
						w='fit-content'>
						<SegmentGroup.Indicator />
						<SegmentGroup.Items
							items={[
								{ value: 'percent', label: '% off' },
								{ value: 'amount', label: `${currency} off` },
							]}
						/>
					</SegmentGroup.Root>
					<Input
						size='sm'
						type='number'
						min={0}
						autoFocus
						aria-label='Discount'
						value={n}
						onChange={e => setN(e.target.value)}
						onKeyDown={e => e.key === 'Enter' && save()}
					/>
				</Flex>
			</DialogBody>
			<DialogFooter>
				{value ? (
					<DiscardButton
						onClick={() => {
							onSave(null);
							onClose();
						}}>
						Remove
					</DiscardButton>
				) : (
					<DiscardButton onClick={onClose}>Cancel</DiscardButton>
				)}
				<Button
					{...(styles.MODAL_BUTTON as any)}
					onClick={save}>
					Apply
				</Button>
			</DialogFooter>
		</Dialog>
	);
};

const CustomerDialog: FC<{ open: boolean; onClose: () => void; route: string; onPick: (c: Customer) => void }> = ({ open, onClose, route, onPick }) => {
	const [q, setQ] = useState('');
	const [search, setSearch] = useState('');
	const [adding, setAdding] = useState(false);
	const [name, setName] = useState('');
	const [phone, setPhone] = useState('');
	const [post, posting] = usePostMutation();
	useEffect(() => {
		const t = setTimeout(() => setSearch(q.trim()), 250);
		return () => clearTimeout(t);
	}, [q]);
	useEffect(() => {
		if (open) {
			setQ('');
			setAdding(false);
			setName('');
			setPhone('');
		}
	}, [open]);
	const { data, isFetching } = useGetAllQuery({ path: route, search, limit: 8, sort: '-lastOrderAt' }, { skip: !open });
	const people: Customer[] = data?.doc || [];
	const pick = (c: Customer) => {
		onPick(c);
		onClose();
	};
	const create = async () => {
		if (!name.trim()) return;
		const res: any = await post({ path: route, body: { name: name.trim(), phone: phone.trim() } });
		if ('error' in res) return toaster.create({ type: 'error', title: errorText(res) });
		pick(res.data?.doc || res.data);
	};
	return (
		<Dialog
			isOpen={open}
			onClose={onClose}
			size='sm'
			forceModal>
			<DialogHeader>{adding ? 'New customer' : 'Customer'}</DialogHeader>
			<DialogCloseButton />
			<DialogBody>
				{adding ? (
					<Flex
						direction='column'
						gap={3}>
						<Field.Root>
							<Field.Label fontSize='13px'>Name</Field.Label>
							<Input
								size='sm'
								autoFocus
								value={name}
								onChange={e => setName(e.target.value)}
							/>
						</Field.Root>
						<Field.Root>
							<Field.Label fontSize='13px'>Phone</Field.Label>
							<Input
								size='sm'
								value={phone}
								onChange={e => setPhone(e.target.value)}
								onKeyDown={e => e.key === 'Enter' && create()}
							/>
						</Field.Root>
					</Flex>
				) : (
					<>
						<Input
							size='sm'
							autoFocus
							placeholder='Find by name, phone or email'
							value={q}
							onChange={e => setQ(e.target.value)}
						/>
						<Box
							mt={2}
							minH='120px'>
							{isFetching && !people.length ? (
								<Skeleton h='120px' />
							) : !people.length ? (
								<Text {...help}>{search ? 'No one by that name — add them as new.' : 'No customers yet.'}</Text>
							) : (
								people.map(c => (
									<Flex
										key={c._id}
										asChild
										w='full'
										justify='space-between'
										align='center'
										px={2}
										py={2}
										borderRadius='md'
										textAlign='left'
										_hover={{ bg: 'bg.muted' }}>
										<button
											type='button'
											onClick={() => pick(c)}>
											<Box>
												<Text fontSize='14px'>{c.name}</Text>
												{c.phone && <Text {...help}>{c.phone}</Text>}
											</Box>
											{!!c.storeCredit && <Badge colorPalette='green'>Credit {c.storeCredit}</Badge>}
										</button>
									</Flex>
								))
							)}
						</Box>
					</>
				)}
			</DialogBody>
			<DialogFooter>
				{adding ? (
					<>
						<DiscardButton onClick={() => setAdding(false)}>Back</DiscardButton>
						<Button
							{...(styles.MODAL_BUTTON as any)}
							loading={posting.isLoading}
							onClick={create}>
							Add customer
						</Button>
					</>
				) : (
					<Button
						{...(styles.MODAL_BUTTON as any)}
						onClick={() => {
							setAdding(true);
							setName(q);
						}}>
						New customer
					</Button>
				)}
			</DialogFooter>
		</Dialog>
	);
};

const VariantDialog: FC<{ product: StoreCatalogueProduct | null; onClose: () => void; currency: string; onPick: (v: StoreItem) => void }> = ({ product, onClose, currency, onPick }) => {
	const m = moneyFor(currency);
	return (
		<Dialog
			isOpen={!!product}
			onClose={onClose}
			size='sm'
			forceModal>
			<DialogHeader description='Which one?'>{product?.name}</DialogHeader>
			<DialogCloseButton />
			<DialogBody>
				<Grid
					templateColumns='repeat(auto-fill, minmax(140px, 1fr))'
					gap={2}>
					{(product?.variants || [])
						.filter(v => v.active)
						.map(v => (
							<Flex
								key={v.variant}
								asChild
								direction='column'
								align='flex-start'
								p={3}
								borderWidth='1px'
								borderColor='border'
								borderRadius='md'
								textAlign='left'
								_hover={{ borderColor: 'fg.muted' }}>
								<button
									type='button'
									onClick={() => {
										onPick(v);
										onClose();
									}}>
									<Text
										fontSize='14px'
										fontWeight='600'>
										{v.title || v.name}
									</Text>
									<Text fontSize='13px'>{m(v.price)}</Text>
									{v.trackStock && v.onHand !== null && (
										<Text
											{...help}
											color={v.onHand > 0 ? 'fg.muted' : 'red.fg'}>
											{v.onHand > 0 ? `${v.onHand} here` : 'None here'}
										</Text>
									)}
								</button>
							</Flex>
						))}
				</Grid>
			</DialogBody>
		</Dialog>
	);
};

const HeldDialog: FC<{ open: boolean; onClose: () => void; register: string; currency: string; onResume: (o: any) => void }> = ({ open, onClose, register, currency, onResume }) => {
	const m = moneyFor(currency);
	const { data, isLoading } = useGetStoreHeldQuery({ register }, { skip: !open || !register });
	const [discard] = useDiscardStoreHeldMutation();
	const docs = data?.docs || [];
	return (
		<Dialog
			isOpen={open}
			onClose={onClose}
			size='md'
			forceModal>
			<DialogHeader description='Baskets put aside at this register. Nothing was taken from stock or paid.'>Held sales</DialogHeader>
			<DialogCloseButton />
			<DialogBody>
				{isLoading ? (
					<Skeleton h='120px' />
				) : !docs.length ? (
					<Text {...help}>Nothing held.</Text>
				) : (
					<Flex
						direction='column'
						gap={2}>
						{docs.map(o => (
							<Flex
								key={o._id}
								align='center'
								gap={3}
								p={3}
								borderWidth='1px'
								borderColor='border'
								borderRadius='md'>
								<Box flex={1}>
									<Text
										fontSize='14px'
										fontWeight='600'>
										{o.customerInfo?.name || 'No customer'} · {m(o.total)}
									</Text>
									<Text {...help}>
										{plural(o.items.reduce((s, it) => s + it.quantity, 0), 'item')} · {new Date(o.createdAt).toLocaleTimeString()}
										{o.note ? ` · ${o.note}` : ''}
									</Text>
								</Box>
								<Button
									size='xs'
									variant='outline'
									onClick={() => discard(o._id)}>
									Discard
								</Button>
								<Button
									size='xs'
									{...(styles.MODAL_BUTTON as any)}
									onClick={() => {
										onResume(o);
										onClose();
									}}>
									Resume
								</Button>
							</Flex>
						))}
					</Flex>
				)}
			</DialogBody>
		</Dialog>
	);
};

const ReceiptDialog: FC<{ detail: StoreOrderDetail | null; setup: PosSetup; onClose: () => void }> = ({ detail, setup, onClose }) => {
	const m = moneyFor(setup.currency);
	const html = useMemo(() => (detail ? receiptHtml(detail, setup) : ''), [detail]);
	const change = detail?.payments.reduce((s, p) => s + (p.change || 0), 0) || 0;
	return (
		<Dialog
			isOpen={!!detail}
			onClose={onClose}
			size='sm'
			forceModal>
			<DialogHeader description={change ? `Give ${m(change)} change.` : 'Paid in full.'}>Sale {detail?.order.code}</DialogHeader>
			<DialogCloseButton />
			<DialogBody>
				<Box
					borderWidth='1px'
					borderColor='border'
					borderRadius='md'
					overflow='hidden'
					bg='white'>
					<iframe
						title='Receipt'
						srcDoc={html}
						style={{ width: '100%', height: '420px', border: 0, display: 'block' }}
					/>
				</Box>
			</DialogBody>
			<DialogFooter>
				<DiscardButton onClick={() => printReceipt(html)}>
					<Printer size={14} /> Print
				</DiscardButton>
				<Button
					{...(styles.MODAL_BUTTON as any)}
					onClick={onClose}>
					New sale
				</Button>
			</DialogFooter>
		</Dialog>
	);
};

/* --------------------------------------------------------------- the POS */

const Pos: FC<{ store: CommerceView }> = ({ store }) => {
	const [register, setRegister] = useState('');
	useEffect(() => setRegister(remembered()), []);
	const { data: setup, isLoading } = useGetPosSetupQuery(register || undefined);
	const registers = setup?.registers || [];
	const reg = registers.find(r => r._id === register) || null;
	useEffect(() => {
		// The remembered register is gone, or there's only one: pick for them.
		if (setup && !reg && registers.length === 1) choose(registers[0]._id);
	}, [setup, reg]);
	const choose = (id: string) => {
		setRegister(id);
		try {
			localStorage.setItem(registerKey(), id);
		} catch {}
	};

	if (isLoading || !setup)
		return (
			<Center flex={1}>
				<Spinner size='sm' />
			</Center>
		);
	if (!registers.length)
		return (
			<Center flex={1}>
				<EmptyState
					title='No registers'
					description='Add a register to an outlet on the Registers page, then sell from it here.'
				/>
			</Center>
		);
	const outletName = (id: string) => setup.outlets.find(o => o._id === id)?.name || 'Outlet';
	const picker = (
		<Dropdown
			size='sm'
			w='240px'
			aria-label='Register'
			value={register}
			placeholder='Choose a register…'
			onChange={choose}
			items={registers.map(r => ({ value: r._id, label: `${r.name} · ${outletName(r.outlet)}` }))}
		/>
	);
	if (!reg)
		return (
			<Center
				flex={1}
				flexDir='column'
				gap={3}>
				<Text fontWeight='600'>Which register are you at?</Text>
				{picker}
			</Center>
		);
	const shiftsOn = setup.features.includes('shifts');
	if (shiftsOn && !setup.shift)
		return (
			<Flex
				direction='column'
				flex={1}>
				<Flex
					px={4}
					py={2}
					borderBottomWidth='1px'
					borderColor='border'>
					{picker}
				</Flex>
				<OpenShift
					register={reg}
					currency={setup.currency}
				/>
			</Flex>
		);
	return (
		<Till
			key={reg._id}
			store={store}
			setup={setup}
			register={reg}
			picker={picker}
		/>
	);
};

const Till: FC<{ store: CommerceView; setup: PosSetup; register: { _id: string; name: string; outlet: string }; picker: ReactNode }> = ({ store, setup, register, picker }) => {
	const m = moneyFor(setup.currency);
	const outlet = register.outlet;
	const has = (f: string) => setup.features.includes(f);
	const routes = ['order', 'payment', 'stock', 'movement', 'variant', 'product', 'customer', 'coupon', 'credit', 'shift'].map(k => store.installed[k]?.route).filter(Boolean) as string[];

	const [lines, setLines] = useState<Line[]>([]);
	const [customer, setCustomer] = useState<Customer | null>(null);
	const [couponInput, setCouponInput] = useState('');
	const [couponCode, setCouponCode] = useState('');
	const [orderDiscount, setOrderDiscount] = useState<StoreDiscount>(null);
	const [heldId, setHeldId] = useState<string | null>(null);
	const [quote, setQuote] = useState<StoreQuote | null>(null);
	const [quoteError, setQuoteError] = useState('');

	const [q, setQ] = useState('');
	const [search, setSearch] = useState('');
	const [category, setCategory] = useState('');
	const [variantsOf, setVariantsOf] = useState<StoreCatalogueProduct | null>(null);
	const [discountFor, setDiscountFor] = useState<string | 'order' | null>(null);
	const [dialog, setDialog] = useState<'customer' | 'pay' | 'held' | 'shift' | null>(null);
	const [receipt, setReceipt] = useState<StoreOrderDetail | null>(null);
	const scan = useRef<HTMLInputElement>(null);

	useEffect(() => {
		const t = setTimeout(() => setSearch(q.trim()), 250);
		return () => clearTimeout(t);
	}, [q]);
	const { data: cat, isFetching } = useGetStoreCatalogueQuery({ outlet, q: search || undefined, category: category || undefined, limit: 60 });
	const { data: cats } = useGetStoreCategoriesQuery(undefined, { skip: !store.installed.category, refetchOnMountOrArgChange: true });
	const { data: held } = useGetStoreHeldQuery({ register: register._id }, { skip: !has('held') });
	const [lookup] = useLazyLookupStoreCodeQuery();
	const [runQuote] = useQuoteStoreBasketMutation();
	const [sell, selling] = useCreateStoreSaleMutation();
	const [hold, holding] = useHoldStoreSaleMutation();

	const basket = () => ({
		outlet,
		customer: customer?._id || null,
		lines: lines.map(l => ({ variant: l.variant, quantity: l.quantity, ...(l.discount && { discount: l.discount }) })),
		...(orderDiscount && { orderDiscount }),
		...(couponCode && { couponCode }),
	});

	// The store works out every figure; ask again whenever the basket changes.
	useEffect(() => {
		if (!lines.length) {
			setQuote(null);
			setQuoteError('');
			return;
		}
		let live = true;
		const t = setTimeout(async () => {
			const res: any = await runQuote(basket());
			if (!live) return;
			if ('error' in res) setQuoteError(errorText(res));
			else {
				setQuote(res.data);
				setQuoteError('');
			}
		}, 200);
		return () => {
			live = false;
			clearTimeout(t);
		};
	}, [lines, customer, couponCode, orderDiscount]);

	const add = (it: { variant: string; name: string; sku: string; price: number }, qty = 1) =>
		setLines(ls => {
			const i = ls.findIndex(l => l.variant === it.variant);
			if (i >= 0) return ls.map((l, j) => (j === i ? { ...l, quantity: l.quantity + qty } : l));
			return [...ls, { variant: it.variant, name: it.name, sku: it.sku, price: it.price, quantity: qty, discount: null }];
		});
	const setQty = (variant: string, n: number) => setLines(ls => (n <= 0 ? ls.filter(l => l.variant !== variant) : ls.map(l => (l.variant === variant ? { ...l, quantity: n } : l))));
	const pickProduct = (p: StoreCatalogueProduct) => {
		const live = p.variants.filter(v => v.active);
		if (live.length === 1) add(live[0]);
		else if (live.length) setVariantsOf(p);
	};
	const clear = () => {
		setLines([]);
		setCustomer(null);
		setCouponCode('');
		setCouponInput('');
		setOrderDiscount(null);
		setHeldId(null);
		if (window.innerWidth >= 800) scan.current?.focus();
	};

	// Enter in the search box: a barcode or SKU adds its item; one match adds it.
	const onScan = async (e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key !== 'Enter' || !q.trim()) return;
		const code = q.trim();
		const res = await lookup({ code, outlet });
		if (res.data) {
			add(res.data);
			setQ('');
			return;
		}
		const found = cat?.doc || [];
		if (found.length === 1) {
			pickProduct(found[0]);
			setQ('');
		} else if (!found.length) toaster.create({ type: 'warning', title: `Nothing for sale with “${code}”` });
	};

	const lineOf = (variant: string) => quote?.lines.find(l => l.variant === variant);
	const problems = [...(quote?.problems || []), ...(quote?.warnings || []), ...(quoteError ? [quoteError] : [])];
	const canPay = !!lines.length && !!quote && !quote.problems.length && !quoteError && !quote.warnings.length;

	const pay = async (payments: StorePaymentInput[]) => {
		const res: any = await sell({ ...basket(), register: register._id, payments, ...(heldId && { heldId }), routes });
		if ('error' in res) {
			const extra = res.error?.data?.problems;
			return toaster.create({ type: 'error', title: errorText(res), ...(extra?.length > 1 && { description: extra.slice(1).join(' · ') }) });
		}
		setDialog(null);
		setReceipt(res.data);
		clear();
	};
	const holdSale = async () => {
		const res: any = await hold({ ...basket(), register: register._id });
		if ('error' in res) return toaster.create({ type: 'error', title: errorText(res) });
		if (heldId) await fetchDiscard(heldId);
		toaster.create({ type: 'success', title: 'Held — resume it from Held sales' });
		clear();
	};
	const [discardHeld] = useDiscardStoreHeldMutation();
	const fetchDiscard = (id: string) => discardHeld(id).catch(() => null);
	const resume = (o: any) => {
		setLines(o.items.map((it: any) => ({ variant: it.variant, name: it.name, sku: it.sku, price: it.unitPrice, quantity: it.quantity, discount: null })));
		setCustomer(o.customerInfo || null);
		setCouponCode(o.couponCode || '');
		setCouponInput(o.couponCode || '');
		setOrderDiscount(null);
		setHeldId(o._id);
	};

	const isMobile = useIsMobile();
	const [basketOpen, setBasketOpen] = useState(false);
	const count = lines.reduce((n, l) => n + l.quantity, 0);
	const discountLine = discountFor && discountFor !== 'order' ? lines.find(l => l.variant === discountFor) : null;
	const products = cat?.doc || [];
	const heldCount = held?.docs?.length || 0;

	const basketPane = (
				<Flex
					direction='column'
					w={{ base: 'full', lg: '400px' }}
					flex={{ base: 1, lg: 'none' }}
					flexShrink={0}
					minH={0}
					borderLeftWidth={{ base: 0, lg: '1px' }}
					borderTopWidth={{ base: '1px', lg: 0 }}
					borderColor='border'
					bg='bg.panel'>
					<Flex
						px={4}
						py={3}
						align='center'
						gap={2}
						borderBottomWidth='1px'
						borderColor='border'>
						<User size={16} />
						{customer ? (
							<>
								<Box
									flex={1}
									minW={0}>
									<Text
										fontSize='14px'
										fontWeight='600'
										truncate>
										{customer.name}
									</Text>
									{has('store-credit') && !!customer.storeCredit && <Text {...help}>Store credit {m(customer.storeCredit)}</Text>}
								</Box>
								<IconButton
									aria-label='Remove the customer'
									size='xs'
									variant='ghost'
									onClick={() => setCustomer(null)}>
									<X size={14} />
								</IconButton>
							</>
						) : (
							<Button
								size='sm'
								variant='ghost'
								px={1}
								onClick={() => setDialog('customer')}>
								Add a customer{setup.pos.customerRequired ? ' (needed)' : ''}
							</Button>
						)}
					</Flex>

					<Box
						flex={1}
						minH={0}
						overflowY='auto'
						px={4}
						py={2}>
						{!lines.length ? (
							<Center
								h='full'
								minH='120px'>
								<Text {...help}>Scan or tap an item to start.</Text>
							</Center>
						) : (
							lines.map(l => {
								const ql = lineOf(l.variant);
								return (
									<Box
										key={l.variant}
										py={2.5}
										borderBottomWidth='1px'
										borderColor='border'>
										<Flex
											justify='space-between'
											gap={2}>
											<Box minW={0}>
												<Text
													fontSize='14px'
													fontWeight='500'
													truncate>
													{l.name}
												</Text>
												<Text {...help}>
													{m(ql?.unitPrice ?? l.price)}
													{ql?.discount ? ` · −${m(ql.discount)}` : ''}
												</Text>
											</Box>
											<Text
												fontSize='14px'
												fontWeight='600'
												whiteSpace='nowrap'>
												{m(ql?.total ?? l.price * l.quantity)}
											</Text>
										</Flex>
										<Flex
											align='center'
											gap={1}
											mt={1.5}>
											<IconButton
												aria-label='One fewer'
												size='xs'
												variant='outline'
												onClick={() => setQty(l.variant, l.quantity - 1)}>
												<Minus size={12} />
											</IconButton>
											<Input
												size='xs'
												w='48px'
												textAlign='center'
												aria-label={`${l.name} quantity`}
												value={l.quantity}
												onChange={e => {
													const n = parseInt(e.target.value, 10);
													if (Number.isFinite(n)) setQty(l.variant, n);
												}}
											/>
											<IconButton
												aria-label='One more'
												size='xs'
												variant='outline'
												onClick={() => setQty(l.variant, l.quantity + 1)}>
												<Plus size={12} />
											</IconButton>
											<Box flex={1} />
											{has('discounts') && (
												<IconButton
													aria-label='Discount this item'
													size='xs'
													variant={l.discount ? 'subtle' : 'ghost'}
													onClick={() => setDiscountFor(l.variant)}>
													<Percent size={12} />
												</IconButton>
											)}
											<IconButton
												aria-label={`Remove ${l.name}`}
												size='xs'
												variant='ghost'
												onClick={() => setQty(l.variant, 0)}>
												<Trash2 size={12} />
											</IconButton>
										</Flex>
									</Box>
								);
							})
						)}
					</Box>

					<Box
						px={4}
						py={3}
						borderTopWidth='1px'
						borderColor='border'>
						{(has('coupons') || has('discounts')) && !!lines.length && (
							<Flex
								gap={2}
								mb={3}>
								{has('coupons') &&
									(couponCode ? (
										<Button
											size='xs'
											variant='subtle'
											onClick={() => {
												setCouponCode('');
												setCouponInput('');
											}}>
											<Tag size={12} /> {couponCode} <X size={12} />
										</Button>
									) : (
										<Flex
											flex={1}
											gap={1}>
											<Input
												size='xs'
												placeholder='Coupon code'
												aria-label='Coupon code'
												value={couponInput}
												onChange={e => setCouponInput(e.target.value.toUpperCase())}
												onKeyDown={e => e.key === 'Enter' && setCouponCode(couponInput.trim())}
											/>
											<Button
												size='xs'
												variant='outline'
												disabled={!couponInput.trim()}
												onClick={() => setCouponCode(couponInput.trim())}>
												Apply
											</Button>
										</Flex>
									))}
								{has('discounts') && (
									<Button
										size='xs'
										variant={orderDiscount ? 'subtle' : 'outline'}
										onClick={() => setDiscountFor('order')}>
										<Percent size={12} />
										{orderDiscount ? (orderDiscount.type === 'percent' ? `${orderDiscount.value}% off` : `${m(orderDiscount.value)} off`) : 'Discount'}
									</Button>
								)}
							</Flex>
						)}
						{!!problems.length && (
							<Box mb={2}>
								{problems.map(p => (
									<Text
										key={p}
										fontSize='12px'
										color='red.fg'>
										{p}
									</Text>
								))}
							</Box>
						)}
						<Flex
							direction='column'
							gap={0.5}
							fontSize='13px'
							mb={3}>
							<Flex justify='space-between'>
								<Text color='fg.muted'>Subtotal</Text>
								<Text>{m(quote?.subtotal ?? 0)}</Text>
							</Flex>
							{!!quote?.discount && (
								<Flex justify='space-between'>
									<Text color='fg.muted'>Discount{quote.coupon ? ` (incl. ${quote.coupon.code})` : ''}</Text>
									<Text>−{m(quote.discount)}</Text>
								</Flex>
							)}
							{!!quote?.tax && (
								<Flex justify='space-between'>
									<Text color='fg.muted'>{quote.taxMode === 'inclusive' ? 'Tax (included)' : 'Tax'}</Text>
									<Text>{m(quote.tax)}</Text>
								</Flex>
							)}
							<Flex
								justify='space-between'
								fontSize='18px'
								fontWeight='700'
								mt={1}>
								<Text>Total</Text>
								<Text>{m(quote?.total ?? 0)}</Text>
							</Flex>
						</Flex>
						<Flex gap={2}>
							{has('held') && (
								<Button
									size='lg'
									variant='outline'
									disabled={!lines.length}
									loading={holding.isLoading}
									onClick={holdSale}>
									<Pause size={16} /> Hold
								</Button>
							)}
							<IconButton
								aria-label='Clear the basket'
								size='lg'
								variant='outline'
								disabled={!lines.length}
								onClick={clear}>
								<Trash2 size={16} />
							</IconButton>
							<Button
								{...(styles.MODAL_BUTTON as any)}
								size='lg'
								flex={1}
								disabled={!canPay || (setup.pos.customerRequired && !customer)}
								onClick={() => {
									setBasketOpen(false);
									setDialog('pay');
								}}>
								Pay {m(quote?.total ?? 0)}
							</Button>
						</Flex>
					</Box>
				</Flex>
	);

	return (
		<Flex
			direction='column'
			flex={1}
			minH={0}>
			{/* The register's bar */}
			<Flex
				px={4}
				py={2}
				gap={2}
				align='center'
				wrap='wrap'
				borderBottomWidth='1px'
				borderColor='border'>
				{picker}
				{setup.shift && (
					<Button
						size='sm'
						variant='ghost'
						onClick={() => setDialog('shift')}>
						<Clock size={14} /> Shift since {new Date(setup.shift.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
					</Button>
				)}
				<Box flex={1} />
				<GuideLink section='store-selling' />
				{has('held') && (
					<Button
						size='sm'
						variant='outline'
						onClick={() => setDialog('held')}>
						Held sales{heldCount ? ` (${heldCount})` : ''}
					</Button>
				)}
			</Flex>

			<Flex
				flex={1}
				minH={0}
				direction={{ base: 'column', lg: 'row' }}
				overflowY='hidden'>
				{/* Items */}
				<Flex
					direction='column'
					flex={1}
					minW={0}
					minH={0}
					p={{ base: 3, lg: 4 }}
					gap={3}>
					<Flex
						align='center'
						gap={2}
						borderWidth='1px'
						borderColor='border'
						borderRadius='md'
						px={2.5}
						bg='bg.panel'>
						<ScanBarcode size={16} />
						<Input
							ref={scan}
							size='md'
							border='none'
							px={0}
							autoFocus={!isMobile}
							_focusVisible={{ outline: 'none' }}
							value={q}
							placeholder='Scan a barcode, or find by name or SKU'
							onChange={e => setQ(e.target.value)}
							onKeyDown={onScan}
						/>
						{q && (
							<IconButton
								aria-label='Clear search'
								size='xs'
								variant='ghost'
								onClick={() => setQ('')}>
								<X size={14} />
							</IconButton>
						)}
					</Flex>
					{!!cats?.doc?.length && (
						<Flex
							gap={1.5}
							wrap={{ base: 'nowrap', lg: 'wrap' }}
							overflowX={{ base: 'auto', lg: 'visible' }}
							flexShrink={0}
							css={{ scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
							{[{ _id: '', name: 'All' }, ...cats.doc].map((c: any) => (
								<Button
									key={c._id}
									size='xs'
									flexShrink={0}
									variant={category === c._id ? 'solid' : 'outline'}
									onClick={() => setCategory(c._id)}>
									{c.name}
								</Button>
							))}
						</Flex>
					)}
					<Box
						flex={1}
						minH={0}
						overflowY='auto'>
						{isFetching && !products.length ? (
							<Skeleton h='200px' />
						) : !products.length ? (
							<Text {...help}>{search ? `Nothing matches “${search}”.` : 'No products for sale yet — add them on the Products page.'}</Text>
						) : (
							<Grid
								templateColumns='repeat(auto-fill, minmax(150px, 1fr))'
								gap={2.5}>
								{products.map(p => {
									const live = p.variants.filter(v => v.active);
									const prices = live.map(v => v.price);
									const low = Math.min(...prices);
									const one = live.length === 1 ? live[0] : null;
									const stock = live.reduce((s, v) => s + (v.onHand || 0), 0);
									return (
										<Flex
											key={p._id}
											asChild
											direction='column'
											align='stretch'
											textAlign='left'
											borderWidth='1px'
											borderColor='border'
											borderRadius='lg'
											overflow='hidden'
											bg='bg.panel'
											opacity={live.length ? 1 : 0.5}
											_hover={{ borderColor: 'fg.muted' }}>
											<button
												type='button'
												disabled={!live.length}
												onClick={() => pickProduct(p)}>
												{p.image ? (
													<Image
														src={p.image}
														alt=''
														h='90px'
														w='full'
														objectFit='cover'
													/>
												) : (
													<Center
														h='60px'
														bg='bg.muted'
														fontSize='20px'
														fontWeight='700'
														color='fg.muted'>
														{p.name.slice(0, 2).toUpperCase()}
													</Center>
												)}
												<Box p={2.5}>
													<Text
														fontSize='13px'
														fontWeight='600'
														lineClamp={2}>
														{p.name}
													</Text>
													<Text fontSize='13px'>
														{live.length > 1 && prices.some(x => x !== low) ? 'from ' : ''}
														{m(low)}
													</Text>
													{p.trackStock && (
														<Text
															{...help}
															mt={0.5}
															color={stock > 0 ? 'fg.muted' : 'red.fg'}>
															{stock > 0 ? `${stock} here` : 'None here'}
															{!one && live.length > 1 ? ` · ${live.length} options` : ''}
														</Text>
													)}
												</Box>
											</button>
										</Flex>
									);
								})}
							</Grid>
						)}
					</Box>
				</Flex>

				{!isMobile && basketPane}
			</Flex>

			{isMobile && (
				<>
					<Flex
						flexShrink={0}
						align='center'
						gap={3}
						px={4}
						pt={3}
						pb='max(12px, env(safe-area-inset-bottom))'
						borderTopWidth='1px'
						borderColor='border'
						bg='bg.panel'>
						<Box flex={1} minW={0}>
							<Text fontSize='12px' color='fg.muted'>
								{count} item{count === 1 ? '' : 's'}
							</Text>
							<Text fontSize='17px' fontWeight='700'>
								{m(quote?.total ?? 0)}
							</Text>
						</Box>
						<Button
							size='lg'
							{...(styles.MODAL_BUTTON as any)}
							onClick={() => setBasketOpen(true)}>
							<ShoppingBag size={16} /> {lines.length ? 'View basket' : 'Basket'}
						</Button>
					</Flex>
					<Drawer.Root
						lazyMount
						unmountOnExit
						placement='bottom'
						open={basketOpen}
						onOpenChange={d => setBasketOpen(d.open)}>
						<Portal>
							<Drawer.Backdrop />
							<Drawer.Positioner>
								<DrawerContentContainer h='92dvh' maxH='92dvh'>
									<Flex direction='column' flex={1} minH={0}>
										{basketPane}
									</Flex>
								</DrawerContentContainer>
							</Drawer.Positioner>
						</Portal>
					</Drawer.Root>
				</>
			)}

			<VariantDialog
				product={variantsOf}
				onClose={() => setVariantsOf(null)}
				currency={setup.currency}
				onPick={v => add(v)}
			/>
			<DiscountDialog
				open={!!discountFor}
				onClose={() => setDiscountFor(null)}
				title={discountFor === 'order' ? 'Discount on the whole order' : `Discount on ${discountLine?.name || 'this item'}`}
				value={discountFor === 'order' ? orderDiscount : discountLine?.discount || null}
				currency={setup.currency}
				onSave={d => (discountFor === 'order' ? setOrderDiscount(d) : setLines(ls => ls.map(l => (l.variant === discountFor ? { ...l, discount: d } : l))))}
			/>
			{store.installed.customer && (
				<CustomerDialog
					open={dialog === 'customer'}
					onClose={() => setDialog(null)}
					route={store.installed.customer.route}
					onPick={setCustomer}
				/>
			)}
			<PayDialog
				open={dialog === 'pay'}
				onClose={() => setDialog(null)}
				total={quote?.total ?? 0}
				currency={setup.currency}
				tenders={setup.tenders}
				credit={customer ? customer.storeCredit || 0 : null}
				busy={selling.isLoading}
				onPay={pay}
			/>
			{has('held') && (
				<HeldDialog
					open={dialog === 'held'}
					onClose={() => setDialog(null)}
					register={register._id}
					currency={setup.currency}
					onResume={resume}
				/>
			)}
			{setup.shift && (
				<ShiftDialog
					open={dialog === 'shift'}
					onClose={() => setDialog(null)}
					shiftId={setup.shift._id}
					currency={setup.currency}
				/>
			)}
			<ReceiptDialog
				detail={receipt}
				setup={setup}
				onClose={() => {
					setReceipt(null);
					scan.current?.focus();
				}}
			/>
		</Flex>
	);
};

export default Pos;
