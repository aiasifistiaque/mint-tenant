'use client';

import { FC, useState } from 'react';
import { Badge, Box, Button, Dialog, Flex, Portal, Skeleton, Switch, Text } from '@chakra-ui/react';
import { ArrowLeft, CircleCheck, CircleAlert, CircleDashed, ExternalLink, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { dateTime } from '../../cl';
import { ModalFooter, radius, useIsMobile } from '../..';
import GuideLink from '../../tenant/GuideLink';
import { toaster } from '@/components/ui/toaster';
import { projectHref } from '../../config/lib/constants/panel';
import { useGetCommerceSettingsQuery, useSaveCommerceSettingsMutation } from '../../store/services/commerceApi';
import { useGetStoreCouriersQuery, useTestStoreCourierMutation } from '../../store/services/courierApi';
import type { CourierCard } from '../../store/services/courierApi';
import { CourierForm, errText } from './CourierCards';

/**
 * Delivery settings → couriers (backend docs/couriers CR-07): a card per
 * courier with its state at a glance — connected, tested, webhook — a link to
 * the courier's own docs, and a switch to use it for deliveries. Connecting
 * (the steps and the keys) is a window on a desktop and a page on a phone. A
 * courier that isn't connected and tested can't be switched on.
 */

const CONNECT_PATH = '/store/settings/delivery/connect';

type Tone = 'good' | 'bad' | 'idle';
const Status: FC<{ tone: Tone; children: string }> = ({ tone, children }) => (
	<Flex
		align='center'
		gap={1.5}
		fontSize='13px'
		color={tone === 'good' ? 'green.fg' : tone === 'bad' ? 'red.fg' : 'fg.muted'}>
		{tone === 'good' ? <CircleCheck size={14} /> : tone === 'bad' ? <CircleAlert size={14} /> : <CircleDashed size={14} />}
		<Text>{children}</Text>
	</Flex>
);

/** The card's own words for each state. */
const statesOf = (c: CourierCard) => {
	const conn = c.connection;
	const t = conn?.test;
	const connection: [Tone, string] = !conn ? ['idle', 'Not connected'] : conn.tested ? ['good', 'Connected'] : t && !t.ok ? ['bad', 'Connection failed'] : ['idle', 'Saved, not tested'];
	const tested: [Tone, string] = !conn ? ['idle', 'Not tested'] : conn.tested ? ['good', `Tested ${dateTime(t!.at)}`] : t ? ['bad', `Test failed ${dateTime(t.at)}`] : ['idle', 'Not tested yet'];
	const hook = conn?.webhook;
	const webhook: [Tone, string] | null =
		c.id === 'manual' ? null : !hook ? ['idle', 'Webhook: not set up'] : hook.lastAt ? ['good', `Webhook working — last update ${dateTime(hook.lastAt)}`] : ['idle', `Webhook: waiting for ${c.name}’s first update`];
	return { connection, tested, webhook };
};

const Card: FC<{ c: CourierCard; delivery: any; onConnect: (id: string) => void }> = ({ c, delivery, onConnect }) => {
	const [saveSettings, saving] = useSaveCommerceSettingsMutation();
	const [test, testing] = useTestStoreCourierMutation();
	const conn = c.connection;
	const usable = !!conn?.tested;
	const { connection, tested, webhook } = statesOf(c);

	const toggle = async (on: boolean) => {
		const couriers = on ? [...delivery.couriers.filter((x: string) => x !== c.id), c.id] : delivery.couriers.filter((x: string) => x !== c.id);
		const res: any = await saveSettings({ answers: { delivery: { ...delivery, couriers } } });
		if ('error' in res) {
			toaster.error({ title: res.error?.data?.message || 'Couldn’t change it — try again.' });
			return;
		}
		toaster.create({ type: 'success', title: on ? `${c.name} is on for deliveries` : `${c.name} is off for deliveries` });
	};
	const retest = async () => {
		try {
			const r: any = await test(c.id).unwrap();
			toaster.create({ type: r?.connection?.test?.ok === false ? 'warning' : 'success', title: r?.connection?.test?.message || 'Tested' });
		} catch (e) {
			toaster.error({ title: errText(e) });
		}
	};

	return (
		<Box
			id={`store-courier-${c.id}`}
			borderWidth='1px'
			borderColor='border'
			borderRadius={radius.CONTAINER}
			bg='bg.panel'
			p={4}>
			<Flex
				justify='space-between'
				align='flex-start'
				gap={3}>
				<Box minW={0}>
					<Flex
						align='center'
						gap={2}
						wrap='wrap'>
						<Text
							fontWeight='600'
							fontSize='15px'>
							{c.name}
						</Text>
						{c.sandbox && conn?.mode === 'test' && (
							<Badge
								size='sm'
								colorPalette='orange'>
								Test mode
							</Badge>
						)}
					</Flex>
					<Flex
						as='a'
						{...({ href: c.links.keys, target: '_blank', rel: 'noreferrer' } as any)}
						align='center'
						gap={1}
						mt={0.5}
						fontSize='12px'
						color='blue.fg'>
						{c.id === 'manual' ? 'About manual couriers' : `How to connect — ${c.name}’s docs`}
						<ExternalLink size={11} />
					</Flex>
				</Box>
				<Switch.Root
					size='sm'
					checked={c.on && usable}
					disabled={!usable || saving.isLoading}
					onCheckedChange={e => toggle(!!e.checked)}>
					<Switch.HiddenInput />
					<Switch.Control />
					<Switch.Label
						fontSize='13px'
						whiteSpace='nowrap'>
						Use for deliveries
					</Switch.Label>
				</Switch.Root>
			</Flex>

			<Flex
				direction='column'
				gap={1.5}
				mt={3}>
				<Status tone={connection[0]}>{connection[1]}</Status>
				<Status tone={tested[0]}>{tested[1]}</Status>
				{webhook && <Status tone={webhook[0]}>{webhook[1]}</Status>}
				{conn?.test && !conn.test.ok && (
					<Text
						fontSize='12px'
						color='red.fg'
						pl={5}>
						{conn.test.message}
					</Text>
				)}
			</Flex>

			{conn && (
				<Flex
					mt={3}
					gap={4}
					wrap='wrap'
					fontSize='12px'
					color='fg.muted'>
					<Text>Mode: {conn.mode === 'test' ? 'Test (sandbox)' : 'Live'}</Text>
					{conn.connectedBy && <Text>Connected by {conn.connectedBy}</Text>}
					{!!conn.webhook?.refusedCalls && <Text color='orange.fg'>{conn.webhook.refusedCalls} webhook call(s) refused — check the secret</Text>}
				</Flex>
			)}
			{c.warnings.map(w => (
				<Box
					key={w}
					mt={3}
					p={3}
					borderRadius='md'
					bg='orange.subtle'
					color='orange.fg'
					fontSize='12px'>
					{w}
				</Box>
			))}
			{!usable && (
				<Text
					mt={3}
					fontSize='12px'
					color='fg.muted'>
					{conn ? `Test the connection to use ${c.name} for deliveries.` : `Connect ${c.name} to use it for deliveries.`}
				</Text>
			)}

			<Flex
				mt={4}
				gap={2}
				justify='flex-end'
				wrap='wrap'>
				{conn && (
					<Button
						size='sm'
						variant='ghost'
						loading={testing.isLoading}
						onClick={retest}>
						<RefreshCw size={14} /> Test again
					</Button>
				)}
				<Button
					size='sm'
					variant={conn ? 'outline' : 'solid'}
					onClick={() => onConnect(c.id)}>
					{conn ? 'Manage connection' : 'Connect courier'}
				</Button>
			</Flex>
		</Box>
	);
};

/** A courier's steps and keys in a window. */
export const ConnectModal: FC<{ id: string | null; onClose: () => void }> = ({ id, onClose }) => {
	const { data } = useGetStoreCouriersQuery();
	const c = data?.couriers.find(k => k.id === id);
	return (
		<Dialog.Root
			placement='center'
			size='lg'
			scrollBehavior='inside'
			open={!!id}
			onOpenChange={e => !e.open && onClose()}>
			<Portal>
				<Dialog.Backdrop />
				<Dialog.Positioner>
					<Dialog.Content
						borderRadius={radius.MODAL}
						bg='bg.panel'
						borderWidth='1px'
						borderColor='border'>
						<Dialog.Header
							px={6}
							pt={5}
							pb={4}>
							<Dialog.Title fontSize='16px'>{c ? (c.connection ? `${c.name} connection` : `Connect ${c.name}`) : 'Courier'}</Dialog.Title>
						</Dialog.Header>
						<Dialog.Body
							px={6}
							pt={0}
							pb={5}>
							{c ? <CourierForm c={c} /> : <Skeleton h='200px' />}
						</Dialog.Body>
						<ModalFooter>
							<Button
								size='sm'
								variant='outline'
								px={3}
								onClick={onClose}>
								Close
							</Button>
						</ModalFooter>
					</Dialog.Content>
				</Dialog.Positioner>
			</Portal>
		</Dialog.Root>
	);
};

/** A phone's "Connect": the same steps and keys as a page of its own. */
export const ConnectPage: FC<{ id: string }> = ({ id }) => {
	const router = useRouter();
	const { data } = useGetStoreCouriersQuery();
	const c = data?.couriers.find(k => k.id === id);
	const back = () => router.replace(projectHref('/store/settings/delivery'));
	if (!data) return <Skeleton h='320px' />;
	return (
		<Flex
			direction='column'
			gap={4}>
			<Flex
				align='center'
				gap={3}>
				<Box
					as='button'
					aria-label='Back'
					onClick={back}>
					<ArrowLeft size={20} />
				</Box>
				<Text
					flex={1}
					fontSize='18px'
					fontWeight='600'>
					{c ? (c.connection ? `${c.name} connection` : `Connect ${c.name}`) : 'Courier not found'}
				</Text>
				<GuideLink section='store-couriers' />
			</Flex>
			{c && <CourierForm c={c} />}
		</Flex>
	);
};

const CourierList: FC = () => {
	const router = useRouter();
	const isMobile = useIsMobile();
	const { data, isLoading, error } = useGetStoreCouriersQuery();
	const { data: settings } = useGetCommerceSettingsQuery();
	const [open, setOpen] = useState<string | null>(null);
	if (isLoading || !settings) return <Skeleton h='200px' />;
	if (error || !data) return null;
	const connect = (id: string) => (isMobile ? router.push(projectHref(`${CONNECT_PATH}?courier=${id}`)) : setOpen(id));
	// Connected ones first, then the rest.
	const list = [...data.couriers].sort((a, b) => Number(!!b.connection?.tested) - Number(!!a.connection?.tested));
	return (
		<Flex
			direction='column'
			gap={4}
			id='store-couriers'>
			<Flex
				justify='space-between'
				align='baseline'
				gap={3}>
				<Box>
					<Text fontWeight='600'>Couriers</Text>
					<Text
						fontSize='13px'
						color='fg.muted'>
						Connect your own courier accounts — they bill you and pay your cash on delivery straight to you. Switch a courier on to send orders with it; switch it off any time.
					</Text>
				</Box>
				<GuideLink section='store-couriers' />
			</Flex>
			{list.map(c => (
				<Card
					key={c.id}
					c={c}
					delivery={settings.answers.delivery}
					onConnect={connect}
				/>
			))}
			<ConnectModal
				id={open}
				onClose={() => setOpen(null)}
			/>
		</Flex>
	);
};

export default CourierList;
