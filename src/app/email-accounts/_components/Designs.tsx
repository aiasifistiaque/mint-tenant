'use client';

import { FC, useState } from 'react';
import { Badge, Box, Button, Flex, IconButton, Input, Menu, Portal, Skeleton, Text } from '@chakra-ui/react';
import { Ellipsis, Plus } from 'lucide-react';
import { PromptDialog } from '@/components/library';
import { Panel } from '@/components/library/cl';
import GuideLink from '@/components/library/tenant/GuideLink';
import { toaster } from '@/components/ui/toaster';
import {
	useGetMailDesignsQuery,
	useRemoveMailDesignMutation,
	useSendMailDesignTestMutation,
	useSetDefaultMailDesignMutation,
} from '@/components/library/store/services/tenantApi';
import type { MailDesign } from '@/components/library/store/services/tenantApi';
import DesignDialog from './DesignDialog';

/**
 * How the project's emails look (Project → Email, docs/messaging M-03a): its
 * designs, the default one every email goes out in, and New / Edit / Make
 * default / Send a test / Remove. No design: MINT's classic look.
 */

/** A small picture of a design: its header and button colours on its page colour. */
const Swatch: FC<{ d: MailDesign }> = ({ d }) => (
	<Flex
		boxSize='36px'
		flexShrink={0}
		borderRadius='md'
		borderWidth='1px'
		borderColor='border'
		overflow='hidden'
		direction='column'
		bg={d.style === 'plain' ? '#ffffff' : d.colors.page}>
		{d.style === 'designed' && d.header.show && (
			<Box
				h='10px'
				bg={d.header.background}
			/>
		)}
		<Flex
			flex='1'
			direction='column'
			justify='center'
			gap='3px'
			px='6px'>
			<Box
				h='2px'
				w='70%'
				bg={d.colors.text}
				opacity={0.5}
			/>
			<Box
				h='4px'
				w='45%'
				borderRadius='sm'
				bg={d.colors.button}
			/>
		</Flex>
	</Flex>
);

const DesignRow: FC<{ design: MailDesign; onEdit: () => void; onDefault: () => void; onSendTest: () => void; onRemove: () => void }> = ({ design: d, onEdit, onDefault, onSendTest, onRemove }) => (
	<Flex
		data-testid='mail-design'
		align='center'
		gap={3}
		px={3}
		py={3}
		borderWidth='1px'
		borderColor={d.isDefault ? 'border.emphasized' : 'border'}
		borderRadius='lg'>
		<Swatch d={d} />
		<Box
			flex='1'
			minW={0}>
			<Flex
				align='center'
				gap={2}
				wrap='wrap'>
				<Text
					fontSize='14px'
					fontWeight='600'>
					{d.name}
				</Text>
				{d.isDefault && (
					<Badge
						size='sm'
						colorPalette='blue'>
						Default
					</Badge>
				)}
			</Flex>
			<Text
				fontSize='13px'
				color='fg.muted'
				truncate>
				{d.style === 'plain' ? 'Plain — your words and a signature' : `Designed${d.header.show ? (d.header.logo ? ' — logo header' : ' — name header') : ''}, ${d.width} px`}
			</Text>
		</Box>
		<Button
			size='xs'
			variant='outline'
			onClick={onEdit}>
			Edit
		</Button>
		<Menu.Root positioning={{ placement: 'bottom-end' }}>
			<Menu.Trigger asChild>
				<IconButton
					aria-label={`More for ${d.name}`}
					size='sm'
					variant='ghost'>
					<Ellipsis size={16} />
				</IconButton>
			</Menu.Trigger>
			<Portal>
				<Menu.Positioner>
					<Menu.Content minW='180px'>
						{!d.isDefault && (
							<Menu.Item
								value='default'
								onClick={onDefault}>
								Make default
							</Menu.Item>
						)}
						<Menu.Item
							value='send-test'
							onClick={onSendTest}>
							Send a test email
						</Menu.Item>
						<Menu.Separator />
						<Menu.Item
							value='remove'
							color='fg.error'
							onClick={onRemove}>
							Remove
						</Menu.Item>
					</Menu.Content>
				</Menu.Positioner>
			</Portal>
		</Menu.Root>
	</Flex>
);

const Designs: FC<{ userEmail: string }> = ({ userEmail }) => {
	const { data, isLoading, isError } = useGetMailDesignsQuery();
	const [setDefault] = useSetDefaultMailDesignMutation();
	const [remove, removing] = useRemoveMailDesignMutation();
	const [sendTest, sending] = useSendMailDesignTestMutation();
	// The dialogs live beside the rows, not inside their menus (a closed menu unmounts what's in it).
	const [editing, setEditing] = useState<{ design: MailDesign | null } | null>(null);
	const [removingOne, setRemovingOne] = useState<MailDesign | null>(null);
	const [testing, setTesting] = useState<MailDesign | null>(null);
	const [to, setTo] = useState('');
	const designs = data?.doc || [];

	const makeDefault = async (d: MailDesign) => {
		try {
			await setDefault(d._id).unwrap();
			toaster.create({ type: 'success', title: `The project’s emails now look like “${d.name}”.` });
		} catch (e: any) {
			toaster.create({ type: 'error', title: e?.data?.message || 'Not changed — try again.' });
		}
	};

	return (
		<Panel
			id='email-designs'
			title='How your emails look'
			subtitle='Plain, or designed with your logo, colours and footer — receipts, welcomes and automation emails go out in the default'
			actions={
				<Flex
					align='center'
					gap={3}>
					<GuideLink section='email-designs' />
					<Button
						size='sm'
						px={3}
						disabled={!data}
						onClick={() => setEditing({ design: null })}>
						<Plus size={14} />
						New design
					</Button>
				</Flex>
			}>
			{isError ? (
				<Text
					fontSize='13px'
					color='fg.muted'>
					Email designs arrive with the next update of MINT.
				</Text>
			) : isLoading || !data ? (
				<Skeleton h='72px' />
			) : designs.length === 0 ? (
				<Flex
					direction='column'
					align='center'
					textAlign='center'
					gap={3}
					py={6}>
					<Text
						fontSize='14px'
						fontWeight='600'>
						Your emails use MINT’s classic look
					</Text>
					<Text
						fontSize='13px'
						color='fg.muted'
						maxW='460px'>
						Make them yours: plain like a note you wrote, or designed with your logo, colours and your business details in the footer.
					</Text>
					<Button
						size='sm'
						px={3}
						onClick={() => setEditing({ design: null })}>
						<Plus size={14} />
						Design your emails
					</Button>
				</Flex>
			) : (
				<Flex
					direction='column'
					gap={2}>
					{designs.map(d => (
						<DesignRow
							key={d._id}
							design={d}
							onEdit={() => setEditing({ design: d })}
							onDefault={() => makeDefault(d)}
							onSendTest={() => {
								setTo('');
								setTesting(d);
							}}
							onRemove={() => setRemovingOne(d)}
						/>
					))}
				</Flex>
			)}

			{data && (
				<DesignDialog
					open={!!editing}
					design={editing?.design || null}
					view={data}
					onClose={() => setEditing(null)}
				/>
			)}

			<PromptDialog
				open={!!testing}
				onClose={() => setTesting(null)}
				title='Send a test email'
				description={testing ? `A sample email in “${testing.name}”, through the project’s default email account.` : ''}
				confirmLabel='Send'
				loading={sending.isLoading}
				onConfirm={async () => {
					if (!testing) return;
					try {
						const r = await sendTest({ id: testing._id, to: to.trim() || undefined }).unwrap();
						setTesting(null);
						toaster.create({ type: 'success', title: r.message });
					} catch (e: any) {
						toaster.create({ type: 'error', title: e?.data?.message || 'The test didn’t go — try again.' });
					}
				}}>
				<Input
					size='sm'
					type='email'
					value={to}
					placeholder={userEmail || 'you@example.com'}
					onChange={e => setTo(e.target.value)}
				/>
				<Text
					fontSize='12px'
					color='fg.muted'
					mt={1}>
					Empty sends it to you.
				</Text>
			</PromptDialog>

			<PromptDialog
				open={!!removingOne}
				onClose={() => setRemovingOne(null)}
				tone='danger'
				title='Remove this email design?'
				subject={removingOne?.name}
				description={
					removingOne?.isDefault
						? designs.length > 1
							? 'It’s the default — the oldest design left becomes the default. Automations that picked it use the default.'
							: 'It’s the only one — the project’s emails go back to MINT’s classic look.'
						: 'Automations that picked it use the default design.'
				}
				confirmLabel='Remove'
				loading={removing.isLoading}
				onConfirm={async () => {
					if (!removingOne) return;
					try {
						await remove(removingOne._id).unwrap();
						setRemovingOne(null);
						toaster.create({ type: 'success', title: 'Removed.' });
					} catch (e: any) {
						toaster.create({ type: 'error', title: e?.data?.message || 'Not removed — try again.' });
					}
				}}
			/>
		</Panel>
	);
};

export default Designs;
