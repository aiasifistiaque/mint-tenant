'use client';

import { FC, ReactNode, useEffect, useMemo, useState } from 'react';
import { Badge, Box, Button, Checkbox, Flex, Input, Link, Skeleton, Text, Textarea } from '@chakra-ui/react';
import { ShieldCheck } from 'lucide-react';
import { Dialog, DialogBody, DialogCloseButton, DialogFooter, DialogHeader, DiscardButton } from '../..';
import { Dropdown } from '../../cl';
import GuideLink from '../../tenant/GuideLink';
import { projectHref } from '../../config/lib/constants/panel';
import { toaster } from '@/components/ui/toaster';
import { useGetStoreCourierOptionsQuery, useGetStoreSendPrefillQuery, useLazyGetStoreDeliveryRiskQuery, useSendStoreOrderMutation } from '../../store/services/courierApi';
import type { AreaPicks } from '../../store/services/courierApi';
import { moneyFor } from '../pos/receipt';
import { manualNames } from './common';

/**
 * Send to courier (backend docs/couriers CR-05, CR-07): the parcel booked with
 * one of the store's connected couriers — recipient and cash to collect from
 * the order, the courier's areas pre-picked (remembered or matched, CR14),
 * the buyer's delivery record with Steadfast when wanted (CR-18).
 */

const errText = (e: any) => e?.data?.problems?.join('; ') || e?.data?.message || e?.message || 'Something went wrong';

const Field: FC<{ label: string; children: ReactNode; flex?: string; hint?: ReactNode }> = ({ label, children, flex = '1 1 200px', hint }) => (
	<Box flex={flex}>
		<Text
			fontSize='13px'
			fontWeight='500'
			mb={1}>
			{label}
		</Text>
		{children}
		{hint && (
			<Text
				fontSize='12px'
				color='fg.muted'
				mt={1}>
				{hint}
			</Text>
		)}
	</Box>
);

/** A courier's list (cities, zones, areas) as a dropdown; empty until its parent is picked. */
const OptionPick: FC<{ courier: string; what: string; parent?: string; value?: string; onChange: (v: string, label: string) => void; skip?: boolean; placeholder: string }> = ({
	courier,
	what,
	parent,
	value,
	onChange,
	skip,
	placeholder,
}) => {
	const { data, isFetching } = useGetStoreCourierOptionsQuery({ id: courier, what, parent }, { skip });
	const items = (data?.choices || []).map(c => ({ value: c.value, label: c.label }));
	return (
		<Dropdown
			size='sm'
			value={value || ''}
			placeholder={skip ? placeholder : isFetching ? 'Loading…' : placeholder}
			onChange={v => onChange(v, items.find(i => i.value === v)?.label || '')}
			items={items}
		/>
	);
};

export const SendToCourier: FC<{ open: boolean; onClose: () => void; orderId: string; currency: string; routes: string[]; onSent?: () => void }> = ({ open, onClose, orderId, currency, routes, onSent }) => {
	const m = moneyFor(currency);
	const { data, isFetching, refetch } = useGetStoreSendPrefillQuery(orderId, { skip: !open });
	const [send, sending] = useSendStoreOrderMutation();
	const [checkRisk, risk] = useLazyGetStoreDeliveryRiskQuery();
	const [courier, setCourier] = useState('');
	const [r, setR] = useState({ name: '', phone: '', address: '', area: '', city: '' });
	const [cod, setCod] = useState('');
	const [weight, setWeight] = useState('');
	const [items, setItems] = useState('');
	const [note, setNote] = useState('');
	const [picks, setPicks] = useState<AreaPicks>({});
	const [search, setSearch] = useState('');
	const [manualName, setManualName] = useState('');
	const [tracking, setTracking] = useState('');
	const [checked, setChecked] = useState(false);

	useEffect(() => {
		if (open) refetch();
	}, [open]);
	useEffect(() => {
		if (!data || !open) return;
		const p = data.prefill;
		setCourier(p.courier);
		setR({ name: p.recipient.name, phone: p.recipient.phone, address: p.recipient.address, area: p.recipient.area, city: p.recipient.city });
		setCod(String(p.cod));
		setWeight(String(p.weight));
		setItems(String(p.items));
		setNote('');
		setChecked(false);
		setTracking('');
	}, [data, open]);
	const c = data?.couriers.find(x => x.id === courier);
	useEffect(() => {
		setPicks(c?.areas?.picks || {});
		setSearch(c?.id === 'redx' ? r.city || '' : '');
		setManualName(manualNames(c?.settings?.names)[0] || '');
		if (c?.settings?.defaultWeight && data) setWeight(String(c.settings.defaultWeight));
	}, [courier, data]);
	const steadfastOn = !!data?.couriers.some(x => x.id === 'steadfast');

	const active = data?.active && data.active.status !== 'error' ? data.active : null;
	const uncertain = data?.active?.uncertain && data.active.courier === courier;
	const options = useMemo(() => {
		const o: Record<string, string> = {};
		if (courier === 'pathao' || courier === 'redx') Object.entries(picks).forEach(([k, v]) => v && (o[k] = String(v)));
		if (courier === 'manual') Object.assign(o, { name: manualName, tracking: tracking.trim() });
		return o;
	}, [courier, picks, manualName, tracking]);
	const needsArea = courier === 'redx' && !picks.area;

	const submit = async () => {
		try {
			const out = await send({
				id: orderId,
				courier,
				recipient: r,
				cod: Number(cod),
				weight: Number(weight) || undefined,
				items: Number(items) || undefined,
				note: note.trim() || undefined,
				options,
				...(uncertain && checked && { confirmNotBooked: true }),
				routes,
			}).unwrap();
			toaster.success({ title: `Sent to ${out.delivery.courierName} — ${out.delivery.code}`, description: out.delivery.trackingCode ? `Tracking ${out.delivery.trackingCode}` : undefined });
			onSent?.();
			onClose();
		} catch (e) {
			toaster.error({ title: errText(e) });
		}
	};

	return (
		<Dialog
			isOpen={open}
			onClose={onClose}
			size='lg'
			forceModal>
			<DialogHeader description='Book the parcel with your courier. Mint follows it from here and updates the order.'>Send to courier</DialogHeader>
			<DialogCloseButton />
			<DialogBody>
				{!data || isFetching ? (
					<Skeleton h='280px' />
				) : !data.couriers.length ? (
					<Box fontSize='14px'>
						<Text>No courier is connected yet.</Text>
						<Text
							mt={2}
							color='fg.muted'>
							Connect your own Steadfast, Pathao or RedX account — or name the couriers you use by hand — in{' '}
							<Link
								color='blue.fg'
								href={projectHref('/store/settings/delivery#store-couriers')}>
								Delivery settings
							</Link>
							.
						</Text>
					</Box>
				) : active ? (
					<Text fontSize='14px'>
						This order is already with {data.couriers.find(x => x.id === active.courier)?.name || active.courier} ({active.code}). Cancel that delivery first to send it again.
					</Text>
				) : (
					<Flex
						direction='column'
						gap={4}>
						<Flex
							gap={3}
							wrap='wrap'
							align='flex-end'>
							<Field label='Courier'>
								<Dropdown
									size='sm'
									value={courier}
									onChange={setCourier}
									items={data.couriers.map(x => ({ value: x.id, label: `${x.name}${x.mode === 'test' ? ' (test)' : ''}` }))}
								/>
							</Field>
							{steadfastOn && (
								<Box flex='1 1 200px'>
									<Button
										size='sm'
										variant='outline'
										loading={risk.isFetching}
										onClick={() => checkRisk({ id: orderId })}>
										<ShieldCheck size={14} /> Check the buyer
									</Button>
								</Box>
							)}
						</Flex>
						{(risk.data || risk.error) && (
							<Flex
								id='store-delivery-risk'
								p={3}
								borderRadius='md'
								bg={risk.data?.level === 'high' ? 'red.subtle' : risk.data?.level === 'medium' ? 'orange.subtle' : 'bg.muted'}
								fontSize='13px'
								gap={2}
								align='center'
								wrap='wrap'>
								{risk.data ? (
									<>
										<Badge colorPalette={risk.data.level === 'high' ? 'red' : risk.data.level === 'medium' ? 'orange' : risk.data.level === 'low' ? 'green' : 'gray'}>{risk.data.level === 'unknown' ? 'Not known' : `${risk.data.level} risk`}</Badge>
										<Text>{risk.data.summary}</Text>
										{risk.data.risk.delivered !== null && (
											<Text color='fg.muted'>
												{risk.data.risk.delivered} delivered · {risk.data.risk.cancelled ?? 0} refused (Steadfast)
											</Text>
										)}
									</>
								) : (
									<Text>{errText(risk.error)}</Text>
								)}
								<GuideLink section='store-delivery-risk' />
							</Flex>
						)}

						<Flex
							gap={3}
							wrap='wrap'>
							<Field label='Recipient'>
								<Input
									size='sm'
									value={r.name}
									onChange={e => setR({ ...r, name: e.target.value })}
								/>
							</Field>
							<Field label='Phone'>
								<Input
									size='sm'
									value={r.phone}
									onChange={e => setR({ ...r, phone: e.target.value })}
								/>
							</Field>
							<Field
								label='Address'
								flex='1 1 100%'>
								<Textarea
									size='sm'
									rows={2}
									value={r.address}
									onChange={e => setR({ ...r, address: e.target.value })}
								/>
							</Field>
							<Field label='Area'>
								<Input
									size='sm'
									value={r.area}
									onChange={e => setR({ ...r, area: e.target.value })}
								/>
							</Field>
							<Field label='City'>
								<Input
									size='sm'
									value={r.city}
									onChange={e => setR({ ...r, city: e.target.value })}
								/>
							</Field>
						</Flex>

						{courier === 'pathao' && (
							<Flex
								gap={3}
								wrap='wrap'>
								<Field
									label='Pathao city'
									hint={c?.areas?.from === 'remembered' ? 'As you picked for this address before' : c?.areas?.from === 'matched' ? 'Matched from the address — check it' : 'Optional: Pathao reads the address when left empty'}>
									<OptionPick
										courier='pathao'
										what='cities'
										value={picks.city}
										placeholder='City'
										onChange={(v, label) => setPicks({ city: v, cityName: label })}
									/>
								</Field>
								<Field label='Zone'>
									<OptionPick
										courier='pathao'
										what='zones'
										parent={picks.city}
										skip={!picks.city}
										value={picks.zone}
										placeholder={picks.city ? 'Zone' : 'Pick the city first'}
										onChange={(v, label) => setPicks({ city: picks.city, cityName: picks.cityName, zone: v, zoneName: label })}
									/>
								</Field>
								<Field label='Area'>
									<OptionPick
										courier='pathao'
										what='areas'
										parent={picks.zone}
										skip={!picks.zone}
										value={picks.area}
										placeholder={picks.zone ? 'Area' : 'Pick the zone first'}
										onChange={(v, label) => setPicks({ ...picks, area: v, areaName: label })}
									/>
								</Field>
							</Flex>
						)}
						{courier === 'redx' && (
							<Flex
								gap={3}
								wrap='wrap'>
								<Field
									label='Find the RedX area'
									hint='A district (Dhaka) or a post code (1216)'>
									<Input
										size='sm'
										value={search}
										onChange={e => setSearch(e.target.value)}
									/>
								</Field>
								<Field
									label='Delivery area'
									hint={c?.areas?.from === 'remembered' ? 'As you picked for this address before' : c?.areas?.from === 'matched' ? 'Matched from the address — check it' : 'RedX needs one'}>
									<OptionPick
										courier='redx'
										what='areas'
										parent={search.trim() || undefined}
										value={picks.area}
										placeholder='Area'
										onChange={(v, label) => setPicks({ area: v, areaName: label })}
									/>
								</Field>
							</Flex>
						)}
						{courier === 'manual' && (
							<Flex
								gap={3}
								wrap='wrap'>
								<Field label='Which courier'>
									<Dropdown
										size='sm'
										value={manualName}
										onChange={setManualName}
										items={manualNames(c?.settings?.names).map(n => ({ value: n, label: n }))}
									/>
								</Field>
								<Field
									label='Tracking code'
									hint='From their slip — the customer can follow it if the courier has a tracking page'>
									<Input
										size='sm'
										value={tracking}
										onChange={e => setTracking(e.target.value)}
									/>
								</Field>
							</Flex>
						)}

						<Flex
							gap={3}
							wrap='wrap'>
							<Field
								label='Cash to collect'
								hint={`What the order still owes: ${m(data.prefill.maxCod)}. 0 when it’s paid.`}>
								<Input
									size='sm'
									type='number'
									min={0}
									max={data.prefill.maxCod}
									value={cod}
									onChange={e => setCod(e.target.value)}
								/>
							</Field>
							<Field label='Weight (kg)'>
								<Input
									size='sm'
									type='number'
									min={0}
									step={0.1}
									value={weight}
									onChange={e => setWeight(e.target.value)}
								/>
							</Field>
							<Field label='Items'>
								<Input
									size='sm'
									type='number'
									min={1}
									value={items}
									onChange={e => setItems(e.target.value)}
								/>
							</Field>
						</Flex>
						<Field
							label='Note to the courier'
							flex='1 1 100%'>
							<Textarea
								size='sm'
								rows={2}
								placeholder='Call before coming, fragile…'
								value={note}
								onChange={e => setNote(e.target.value)}
							/>
						</Field>
						{uncertain && (
							<Box
								p={3}
								borderRadius='md'
								bg='orange.subtle'
								fontSize='13px'>
								<Text mb={2}>{data.active?.error}</Text>
								<Checkbox.Root
									checked={checked}
									onCheckedChange={e => setChecked(!!e.checked)}>
									<Checkbox.HiddenInput />
									<Checkbox.Control />
									<Checkbox.Label>I checked the courier’s panel — it isn’t there</Checkbox.Label>
								</Checkbox.Root>
							</Box>
						)}
						{data.active?.status === 'error' && !uncertain && data.active.error && (
							<Text
								fontSize='13px'
								color='red.fg'>
								Last try: {data.active.error}
							</Text>
						)}
					</Flex>
				)}
			</DialogBody>
			<DialogFooter>
				<GuideLink section='store-send-to-courier' />
				<DiscardButton onClick={onClose}>Cancel</DiscardButton>
				{data?.couriers.length && !active ? (
					<Button
						loading={sending.isLoading}
						disabled={!courier || needsArea || (uncertain && !checked) || (courier === 'manual' && !manualName)}
						onClick={submit}>
						Send to {c?.name || 'courier'}
					</Button>
				) : null}
			</DialogFooter>
		</Dialog>
	);
};

export default SendToCourier;
