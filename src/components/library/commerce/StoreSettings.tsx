'use client';

import { FC, useEffect, useState } from 'react';
import { Box, Button, Flex, Skeleton, Text } from '@chakra-ui/react';
import { ChevronRight } from 'lucide-react';
import { Panel } from '../cl';
import GuideLink from '../tenant/GuideLink';
import { toaster } from '@/components/ui/toaster';
import { projectHref } from '../config/lib/constants/panel';
import { useGetCommerceSettingsQuery, useSaveCommerceSettingsMutation } from '../store/services/commerceApi';
import type { CommerceSection } from '../store/services/commerceApi';
import { SECTIONS, help } from './sections';

/**
 * Store settings (backend docs/ecommerce EC-04): the setup wizard's sections
 * on a built store, each card saved on its own. Switching a feature on shows
 * its pages; switching one off is refused while it holds what it made (the
 * server says why). Outlets are kept on their own page once the store is built.
 */

const Card: FC<{ k: CommerceSection }> = ({ k }) => {
	const { data } = useGetCommerceSettingsQuery();
	const [save, saving] = useSaveCommerceSettingsMutation();
	const section = SECTIONS.find(s => s.key === k)!;
	const [value, setValue] = useState<any>(null);
	const [problems, setProblems] = useState<string[]>([]);
	useEffect(() => {
		if (data) setValue(data.answers[k]);
	}, [data?.answers?.[k]]);
	if (!data || value === null) return null;
	const changed = JSON.stringify(value) !== JSON.stringify(data.answers[k]);
	const submit = async () => {
		const res: any = await save({ answers: { [k]: value } });
		if ('error' in res) {
			const p = res.error?.data?.problems;
			setProblems(p ? (Object.values(p).flat() as string[]) : [res.error?.data?.message || 'Couldn’t save — try again.']);
			return;
		}
		setProblems([]);
		toaster.create({ type: 'success', title: `${section.title} saved` });
	};
	return (
		<Panel
			id={section.anchor}
			title={section.title}
			subtitle={section.intro}
			actions={<GuideLink section={section.anchor} />}>
			<Box p={4}>
				<section.Editor
					value={value}
					onChange={setValue}
					offered={data.offered}
					built
				/>
				{problems.length > 0 && (
					<Box
						mt={4}
						p={3}
						borderRadius='md'
						bg='red.subtle'
						color='red.fg'
						fontSize='13px'>
						{problems.map(p => (
							<Text key={p}>{p}</Text>
						))}
					</Box>
				)}
				<Flex
					justify='flex-end'
					gap={2}
					mt={4}>
					{changed && (
						<Button
							size='sm'
							variant='ghost'
							onClick={() => {
								setValue(data.answers[k]);
								setProblems([]);
							}}>
							Undo changes
						</Button>
					)}
					<Button
						size='sm'
						disabled={!changed}
						loading={saving.isLoading}
						onClick={submit}>
						Save
					</Button>
				</Flex>
			</Box>
		</Panel>
	);
};

const StoreSettings: FC = () => {
	const { data, isLoading } = useGetCommerceSettingsQuery();
	if (isLoading || !data) return <Skeleton h='320px' />;
	const outlets = data.installed.outlet?.route;
	return (
		<Flex
			direction='column'
			gap={4}
			maxW='860px'>
			<Flex
				justify='space-between'
				align='baseline'
				gap={3}>
				<Text {...help}>What your store was set up with. Switching something on shows its pages; switching it off hides them — not while it still holds what it made.</Text>
				<GuideLink section='store-settings' />
			</Flex>
			{SECTIONS.map(s =>
				s.key === 'outlets' ? (
					<Panel
						key={s.key}
						id={s.anchor}
						title='Outlets'
						subtitle='Your shops and warehouses, each with its own stock.'>
						<Flex
							p={4}
							justify='space-between'
							align='center'
							gap={3}
							wrap='wrap'>
							<Text fontSize='13px'>Outlets are records of their own now — add, rename or close them on the Outlets page.</Text>
							{outlets && (
								<Button
									asChild
									size='sm'
									variant='outline'>
									<a href={projectHref(`/t/${outlets}`)}>
										Outlets
										<ChevronRight size={13} />
									</a>
								</Button>
							)}
						</Flex>
					</Panel>
				) : (
					<Card
						key={s.key}
						k={s.key}
					/>
				)
			)}
		</Flex>
	);
};

export default StoreSettings;
