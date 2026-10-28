'use client';

import { FC, useEffect, useMemo, useState } from 'react';
import { Badge, Box, Button, Center, Flex, Grid, Skeleton, Spinner, Text } from '@chakra-ui/react';
import { AlertTriangle, Check, CircleCheck, Package, ScanBarcode, Settings2 } from 'lucide-react';
import { Panel } from '../cl';
import GuideLink from '../tenant/GuideLink';
import { projectHref } from '../config/lib/constants/panel';
import { useAppDispatch } from '../hooks/useReduxHooks';
import { SIDEBAR_TAGS, commerceApi, useGetCommerceSettingsQuery, useSaveCommerceSettingsMutation, useStartCommerceSetupMutation } from '../store/services/commerceApi';
import type { CommerceAnswers, CommerceSection, CommerceStep, CommerceView } from '../store/services/commerceApi';
import { SECTIONS, help } from './sections';

/**
 * Set up your store (backend docs/ecommerce EC-04): the wizard a new
 * e-commerce project opens on. One step per section of the store's settings,
 * each saved when you go on (so leaving and coming back resumes), then a
 * review and **Set up my store** — built in the background while this page
 * shows progress; a failure says why and can be tried again.
 */

const STEPS: CommerceStep[] = [...SECTIONS.map(s => s.key), 'review'];
const TITLE: Record<CommerceStep, string> = { ...(Object.fromEntries(SECTIONS.map(s => [s.key, s.title])) as Record<CommerceSection, string>), review: 'Review' };

const Stepper: FC<{ step: number; onPick: (i: number) => void; reached: number }> = ({ step, onPick, reached }) => (
	<Flex
		gap={2}
		mb={5}
		align='center'
		wrap='wrap'>
		{STEPS.map((s, i) => (
			<Flex
				key={s}
				asChild
				onClick={() => i <= reached && onPick(i)}
				align='center'
				gap={1.5}
				cursor={i > reached ? 'default' : 'pointer'}
				color={i <= step ? 'fg' : 'fg.subtle'}>
				<button
					type='button'
					disabled={i > reached}>
					<Flex
						align='center'
						justify='center'
						boxSize='20px'
						borderRadius='full'
						borderWidth='1px'
						borderColor={i <= step ? 'fg' : 'border'}
						bg={i < step ? 'fg' : 'transparent'}
						color={i < step ? 'bg' : 'inherit'}
						fontSize='11px'
						fontFamily='mono'>
						{i < step ? <Check size={11} /> : i + 1}
					</Flex>
					<Text
						fontSize='12px'
						display={{ base: i === step ? 'block' : 'none', md: 'block' }}>
						{TITLE[s]}
					</Text>
					{i < STEPS.length - 1 && (
						<Box
							w='12px'
							h='1px'
							bg='border'
						/>
					)}
				</button>
			</Flex>
		))}
	</Flex>
);

const Problems: FC<{ list?: string[] }> = ({ list }) =>
	list?.length ? (
		<Box
			mt={4}
			p={3}
			borderRadius='md'
			bg='red.subtle'
			color='red.fg'
			fontSize='13px'>
			{list.map(p => (
				<Text key={p}>{p}</Text>
			))}
		</Box>
	) : null;

/** One line a section's answers come to, for the review. */
const summaryOf = (key: CommerceSection, a: CommerceAnswers, v: CommerceView): string => {
	const label = (list: { id: string; label?: string; name?: string }[], ids: string[]) =>
		ids.map(id => list.find(x => x.id === id)?.label || list.find(x => x.id === id)?.name || id).join(', ');
	switch (key) {
		case 'store':
			return `Sells in ${a.store.currency}; orders ${a.store.orderPrefix || 'ORD'}00001…; ${a.store.negativeStock ? 'stock may go below zero' : 'never sells more than an outlet has'}; ${a.store.guestCheckout === false ? 'website buyers sign in first' : 'guest checkout on the website'}`;
		case 'outlets':
			return a.outlets.map(o => `${o.name} (${o.code}, ${o.kind})`).join(' · ');
		case 'products':
			return [a.products.variations ? `Variations by ${a.products.options.join(', ')}` : 'No variations', a.products.barcodes && 'barcodes', a.products.brands && 'brands', a.products.trackStock ? 'stock tracked' : 'stock not tracked']
				.filter(Boolean)
				.join('; ');
		case 'payments':
			return [label(v.offered.tenders, a.payments.tenders), ...a.payments.custom, a.payments.gateways.length && `online: ${label(v.offered.gateways, a.payments.gateways)}`].filter(Boolean).join(', ');
		case 'returns':
			return a.returns.allowed
				? `Within ${a.returns.windowDays ? `${a.returns.windowDays} days` : 'any time'}${a.returns.partial ? ', partly' : ''}; refund by ${label(v.offered.refundMethods.map(m => ({ ...m, label: m.id === 'original' ? 'the way they paid' : m.label })), a.returns.refundMethods)}${a.returns.storeCredit ? '; store credit' : ''}`
				: 'No returns';
		case 'delivery':
			return a.delivery.enabled ? `${a.delivery.rates.map(r => `${r.name} ${r.amount}`).join(', ') || 'No shipping charges'}${a.delivery.couriers.length ? `; ${label(v.offered.couriers, a.delivery.couriers)}` : ''}` : 'No delivery';
		case 'pos':
			return [
				a.pos.receipt.size === 'a4' ? 'A4 receipts' : '80 mm receipts',
				a.pos.shifts && 'shifts',
				a.pos.held && 'held sales',
				a.pos.discounts && 'discounts',
				a.pos.coupons && 'coupons',
				a.pos.tax.mode === 'none' ? 'no tax' : `${a.pos.tax.rates.map(r => `${r.name} ${r.rate}%`).join(', ')} ${a.pos.tax.mode === 'inclusive' ? 'in prices' : 'added'}`,
			]
				.filter(Boolean)
				.join(', ');
	}
};

const Building: FC<{ since: string | null }> = ({ since }) => {
	const [now, setNow] = useState(Date.now());
	useEffect(() => {
		const t = setInterval(() => setNow(Date.now()), 1000);
		return () => clearInterval(t);
	}, []);
	const secs = since ? Math.max(0, Math.round((now - new Date(since).getTime()) / 1000)) : 0;
	return (
		<Panel>
			<Center
				flexDirection='column'
				gap={3}
				py={14}
				px={4}
				textAlign='center'>
				<Spinner />
				<Text fontWeight='600'>Setting up your store…</Text>
				<Text {...help}>
					Products, variants, stock for each outlet, customers, orders, payments, returns{secs ? ` — ${secs} s` : ''}. It usually takes under a minute; you can leave this page.
				</Text>
			</Center>
		</Panel>
	);
};

const Ready: FC = () => (
	<Panel>
		<Flex
			direction='column'
			align='center'
			gap={3}
			py={12}
			px={4}
			textAlign='center'>
			<CircleCheck
				size={32}
				color='var(--chakra-colors-green-fg)'
			/>
			<Text
				fontWeight='600'
				fontSize='lg'>
				Your store is ready
			</Text>
			<Text
				{...help}
				maxW='460px'>
				Add your products — with their variants and opening stock — then open the POS. Everything you chose can be changed on Store settings.
			</Text>
			<Flex
				gap={2}
				mt={2}
				wrap='wrap'
				justify='center'>
				{/* A full load: the sidebar, pages and models of the new store all arrive at once. */}
				<Button
					asChild
					size='sm'>
					<a href={projectHref('/t/products')}>
						<Package size={14} />
						Add products
					</a>
				</Button>
				<Button
					asChild
					size='sm'
					variant='outline'>
					<a href={projectHref('/store/pos')}>
						<ScanBarcode size={14} />
						Open the POS
					</a>
				</Button>
				<Button
					asChild
					size='sm'
					variant='ghost'>
					<a href={projectHref('/store/settings')}>
						<Settings2 size={14} />
						Store settings
					</a>
				</Button>
			</Flex>
		</Flex>
	</Panel>
);

const StoreSetup: FC = () => {
	const [polling, setPolling] = useState(false);
	const { data, isLoading } = useGetCommerceSettingsQuery(undefined, { pollingInterval: polling ? 2000 : 0 });
	const [save, saving] = useSaveCommerceSettingsMutation();
	const [start, starting] = useStartCommerceSetupMutation();
	const [step, setStep] = useState(0);
	const [reached, setReached] = useState(0);
	const [draft, setDraft] = useState<CommerceAnswers | null>(null);
	const [problems, setProblems] = useState<Partial<Record<CommerceSection, string[]>>>({});
	const [error, setError] = useState('');

	// Start where the wizard was left, with what was saved.
	useEffect(() => {
		if (!data || draft) return;
		setDraft(data.answers);
		const at = Math.max(0, STEPS.indexOf(data.step));
		setStep(at);
		setReached(at);
	}, [data]);
	useEffect(() => setPolling(data?.status === 'building'), [data?.status]);
	// Built: the sidebar trades "Set up your store" for the store's own pages.
	const dispatch = useAppDispatch();
	useEffect(() => {
		if (data?.status === 'ready') dispatch(commerceApi.util.invalidateTags(SIDEBAR_TAGS as any));
	}, [data?.status]);

	const key = STEPS[step];
	const section = useMemo(() => SECTIONS.find(s => s.key === key), [key]);

	if (isLoading || !data || !draft) return <Skeleton h='320px' />;
	if (data.status === 'building') return <Building since={data.startedAt} />;
	if (data.status === 'ready') return <Ready />;

	const go = (i: number) => {
		setStep(i);
		setReached(r => Math.max(r, i));
		setError('');
		window.scrollTo({ top: 0 });
	};

	/** Saves the step's section, then moves to `to`. */
	const saveAndGo = async (to: number) => {
		if (!section) return go(to);
		const res: any = await save({ answers: { [section.key]: draft[section.key] }, step: STEPS[Math.max(to, step)] });
		if ('error' in res) {
			setProblems(res.error?.data?.problems || { [section.key]: [res.error?.data?.message || 'Couldn’t save — try again.'] });
			return;
		}
		setProblems(p => ({ ...p, [section.key]: [] }));
		setDraft(d => ({ ...(d as CommerceAnswers), [section.key]: res.data.answers[section.key] }));
		go(to);
	};

	const setUp = async () => {
		setError('');
		const res: any = await start();
		if ('error' in res) {
			setError(res.error?.data?.message || 'The store couldn’t be set up — try again.');
			if (res.error?.data?.problems) setProblems(res.error.data.problems);
			return;
		}
		setPolling(true);
	};

	const needs = data.needs || {};
	return (
		<Box maxW='860px'>
			<Flex
				justify='space-between'
				align='baseline'
				gap={3}
				mb={1}>
				<Text {...help}>A few answers and your store is set up for you: products, stock, orders, a POS, returns and refunds. Everything can be changed later.</Text>
			</Flex>
			<Box mt={4}>
				<Stepper
					step={step}
					reached={reached}
					onPick={i => (i < step ? go(i) : saveAndGo(i))}
				/>
			</Box>

			{data.status === 'failed' && (
				<Flex
					gap={2}
					mb={4}
					p={3}
					borderRadius='md'
					bg='orange.subtle'
					color='orange.fg'
					fontSize='13px'>
					<AlertTriangle size={16} />
					<Box>
						<Text fontWeight='600'>The last setup didn’t finish: {data.error}</Text>
						{data.problems.map(p => (
							<Text key={p}>{p}</Text>
						))}
						<Text>Nothing was kept from it — check your answers and set it up again.</Text>
					</Box>
				</Flex>
			)}

			{section ? (
				<Panel
					title={section.title}
					subtitle={section.intro}
					actions={<GuideLink section={section.anchor} />}>
					<Box p={4}>
						<section.Editor
							value={draft[section.key]}
							onChange={(v: any) => setDraft(d => ({ ...(d as CommerceAnswers), [section.key]: v }))}
							offered={data.offered}
						/>
						<Problems list={problems[section.key]} />
					</Box>
				</Panel>
			) : (
				<Panel
					title='Review'
					subtitle='What your store will be set up with. Click a step to change it.'
					actions={<GuideLink section='store-review' />}>
					<Flex direction='column'>
						{SECTIONS.map((s, i) => (
							<Grid
								key={s.key}
								templateColumns={{ base: '1fr', md: '160px 1fr auto' }}
								gap={2}
								px={4}
								py={3}
								borderBottomWidth={i < SECTIONS.length - 1 ? '1px' : 0}
								borderColor='border.muted'
								alignItems='center'>
								<Text
									fontSize='13px'
									fontWeight='600'>
									{s.title}
								</Text>
								<Box>
									<Text fontSize='13px'>{summaryOf(s.key, draft, data)}</Text>
									{(needs[s.key] || []).map(p => (
										<Text
											key={p}
											fontSize='12px'
											color='red.fg'>
											{p}
										</Text>
									))}
								</Box>
								<Flex
									gap={2}
									align='center'>
									{needs[s.key]?.length ? <Badge colorPalette='red'>Needs a look</Badge> : null}
									<Button
										size='xs'
										variant='ghost'
										onClick={() => go(i)}>
										Change
									</Button>
								</Flex>
							</Grid>
						))}
					</Flex>
				</Panel>
			)}

			{error && (
				<Text
					mt={3}
					fontSize='13px'
					color='red.fg'>
					{error}
				</Text>
			)}
			<Flex
				justify='space-between'
				mt={4}>
				<Button
					size='sm'
					variant='ghost'
					disabled={step === 0}
					onClick={() => go(step - 1)}>
					Back
				</Button>
				{key === 'review' ? (
					<Button
						size='sm'
						loading={starting.isLoading}
						disabled={Object.keys(needs).length > 0}
						onClick={setUp}>
						Set up my store
					</Button>
				) : (
					<Button
						size='sm'
						loading={saving.isLoading}
						onClick={() => saveAndGo(step + 1)}>
						{step === STEPS.length - 2 ? 'Review' : 'Next'}
					</Button>
				)}
			</Flex>
		</Box>
	);
};

export default StoreSetup;
