'use client';

import { FC, useEffect, useState } from 'react';
import { Box, Button, Flex, Input, Switch, Text } from '@chakra-ui/react';
import { radius } from '../..';
import GuideLink from '../../tenant/GuideLink';
import { toaster } from '@/components/ui/toaster';
import { useGetCommerceSettingsQuery, useSaveCommerceSettingsMutation } from '../../store/services/commerceApi';

/**
 * Store settings → Delivery → Buyer check (backend docs/couriers BUYER_CHECK.md BC1, BC4; CR-22): the levels — Safe
 * from this % delivered, Check first from this %, Risky below — and whether orders are checked as they come in.
 */
const BuyerCheckSettings: FC = () => {
	const { data } = useGetCommerceSettingsQuery();
	const [save, saving] = useSaveCommerceSettingsMutation();
	const delivery: any = data?.answers?.delivery;
	const bc = delivery?.buyerCheck || { safe: 80, checkFirst: 50, auto: true };
	const [safe, setSafe] = useState(String(bc.safe));
	const [checkFirst, setCheckFirst] = useState(String(bc.checkFirst));
	useEffect(() => {
		setSafe(String(bc.safe));
		setCheckFirst(String(bc.checkFirst));
	}, [bc.safe, bc.checkFirst]);
	if (!delivery) return null;

	const put = async (next: { safe?: number; checkFirst?: number; auto?: boolean }, ok: string) => {
		const res: any = await save({ answers: { delivery: { ...delivery, buyerCheck: { ...bc, ...next } } } });
		if ('error' in res) toaster.error({ title: res.error?.data?.problems?.[0] || res.error?.data?.message || 'Couldn’t save it — try again.' });
		else toaster.success({ title: ok });
	};
	const changed = String(bc.safe) !== safe || String(bc.checkFirst) !== checkFirst;

	return (
		<Box
			id='store-buyer-check-settings'
			borderWidth='1px'
			borderColor='border'
			borderRadius={radius.CONTAINER}
			bg='bg.panel'
			p={4}>
			<Flex
				justify='space-between'
				align='baseline'
				gap={3}>
				<Box>
					<Text fontWeight='600'>Buyer check</Text>
					<Text
						fontSize='13px'
						color='fg.muted'>
						How often a buyer’s phone takes its parcels — from your couriers and your own orders — shown on each order as Safe, Check first, Risky or New buyer.
					</Text>
				</Box>
				<GuideLink section='store-buyer-check-settings' />
			</Flex>
			<Switch.Root
				mt={4}
				size='sm'
				checked={bc.auto !== false}
				disabled={saving.isLoading}
				onCheckedChange={e => put({ auto: !!e.checked }, e.checked ? 'Orders are checked as they come in' : 'Orders aren’t checked by themselves now — you can still check by hand')}>
				<Switch.HiddenInput />
				<Switch.Control />
				<Switch.Label fontSize='13px'>Check website and phone orders as they come in</Switch.Label>
			</Switch.Root>
			<Flex
				mt={4}
				gap={3}
				wrap='wrap'
				align='flex-end'>
				<Box w='150px'>
					<Text
						fontSize='13px'
						fontWeight='500'
						mb={1}>
						Safe from (%)
					</Text>
					<Input
						size='sm'
						type='number'
						min={1}
						max={100}
						value={safe}
						onChange={e => setSafe(e.target.value)}
					/>
				</Box>
				<Box w='150px'>
					<Text
						fontSize='13px'
						fontWeight='500'
						mb={1}>
						Check first from (%)
					</Text>
					<Input
						size='sm'
						type='number'
						min={0}
						max={100}
						value={checkFirst}
						onChange={e => setCheckFirst(e.target.value)}
					/>
				</Box>
				<Button
					size='sm'
					variant='outline'
					disabled={!changed}
					loading={saving.isLoading}
					onClick={() => put({ safe: Number(safe), checkFirst: Number(checkFirst) }, 'Buyer check levels saved')}>
					Save levels
				</Button>
			</Flex>
			<Text
				mt={2}
				fontSize='12px'
				color='fg.muted'>
				Below Check first is Risky. Under 3 known parcels is New buyer.
			</Text>
		</Box>
	);
};

export default BuyerCheckSettings;
