'use client';

import { FC, useEffect, useState } from 'react';
import { Badge, Box, Button, CloseButton, Dialog, Flex, Input, Portal, Switch, Text, Textarea } from '@chakra-ui/react';
import { Code as CodeIcon, Plus } from 'lucide-react';
import { ModalFooter, PromptDialog } from '@/components/library';
import { Dropdown } from '@/components/library/cl';
import { radius } from '@/components/library/config';
import GuideLink from '@/components/library/tenant/GuideLink';
import type { SiteConfig, SiteTag } from '@/components/library/store/services/tenantApi';
import { Field, SettingCard, errorText, useSave } from './parts';

/**
 * Code: named pieces of HTML added to every page (the AGS head tags) — a chat
 * widget, another provider's tag, a verification snippet. Each is added,
 * edited, switched off or removed on its own, and saved straight away.
 */

type Props = { config: SiteConfig; canBuild: boolean };

const PLACES = [
	{ value: 'head', label: 'In <head>', hint: 'Meta tags, styles, scripts that must load first' },
	{ value: 'bodyStart', label: 'Start of <body>', hint: 'e.g. a <noscript> fallback' },
	{ value: 'bodyEnd', label: 'End of <body>', hint: 'Chat widgets and scripts that can wait' },
] as const;
const placeLabel = (v: string) => PLACES.find(p => p.value === v)?.label || v;
const BLANK: SiteTag = { name: '', location: 'head', content: '', enabled: true };

const TagDialog: FC<{ tag: SiteTag | null; isNew: boolean; saving: boolean; error: any; onClose: () => void; onSave: (t: SiteTag) => void }> = ({
	tag,
	isNew,
	saving,
	error,
	onClose,
	onSave,
}) => {
	const [draft, setDraft] = useState<SiteTag>(BLANK);
	const [touched, setTouched] = useState(false);
	useEffect(() => {
		if (tag) {
			setDraft(tag);
			setTouched(false);
		}
	}, [tag]);
	const set = (patch: Partial<SiteTag>) => setDraft(d => ({ ...d, ...patch }));
	const missing = !draft.name.trim() ? 'Give it a name.' : !draft.content.trim() ? 'Paste the code.' : '';
	const save = () => {
		setTouched(true);
		if (!missing) onSave({ ...draft, name: draft.name.trim() });
	};

	return (
		<Dialog.Root
			placement='center'
			size='lg'
			open={!!tag}
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
							px={{ base: 4, md: 6 }}
							pt={{ base: 4, md: 5 }}
							pb={{ base: 3, md: 4 }}>
							<Flex
								align='center'
								justify='space-between'
								gap={3}
								w='full'
								pr={6}>
								<Dialog.Title fontSize='16px'>{isNew ? 'Add code' : 'Edit code'}</Dialog.Title>
								<GuideLink section='site-code' />
							</Flex>
							<Dialog.CloseTrigger asChild>
								<CloseButton size='sm' />
							</Dialog.CloseTrigger>
						</Dialog.Header>
						<Dialog.Body
							px={{ base: 4, md: 6 }}
							pt={0}
							pb={{ base: 4, md: 5 }}>
							<Flex
								direction='column'
								gap={4}>
								<Flex
									gap={3}
									direction={{ base: 'column', md: 'row' }}>
									<Box flex={1}>
										<Field
											label='Name'
											help='So you know what it is later'>
											<Input
												size='sm'
												autoFocus
												maxLength={80}
												placeholder='e.g. Chat widget'
												value={draft.name}
												onChange={e => set({ name: e.target.value })}
											/>
										</Field>
									</Box>
									<Box w={{ base: 'full', md: '200px' }}>
										<Field
											label='Where'
											help={PLACES.find(p => p.value === draft.location)?.hint}>
											<Dropdown
												size='sm'
												value={draft.location}
												onChange={v => set({ location: v as SiteTag['location'] })}
												items={PLACES.map(p => ({ value: p.value, label: p.label }))}
											/>
										</Field>
									</Box>
								</Flex>
								<Field
									label='Code'
									help='HTML — <script>, <meta>, <link>, <noscript>… Scripts run.'>
									<Textarea
										size='sm'
										rows={10}
										fontFamily='mono'
										fontSize='12px'
										spellCheck={false}
										placeholder={'<script src="https://…"></script>'}
										value={draft.content}
										onChange={e => set({ content: e.target.value })}
									/>
								</Field>
								<Flex
									gap={3}
									align='center'>
									<Switch.Root
										checked={draft.enabled}
										colorPalette='brand'
										onCheckedChange={d => set({ enabled: d.checked })}>
										<Switch.HiddenInput />
										<Switch.Control />
										<Switch.Label fontSize='13px'>On the site</Switch.Label>
									</Switch.Root>
								</Flex>
								{(touched && missing) || error ? (
									<Text
										fontSize='12.5px'
										color='red.fg'>
										{touched && missing ? missing : errorText(error)}
									</Text>
								) : null}
								<Text
									fontSize='12px'
									color='fg.muted'>
									Only add code you trust: it runs on your site with full access to the page and its visitors.
								</Text>
							</Flex>
						</Dialog.Body>
						<ModalFooter>
							<Button
								px={3}
								size='sm'
								variant='outline'
								onClick={onClose}>
								Cancel
							</Button>
							<Button
								px={3}
								size='sm'
								loading={saving}
								onClick={save}>
								{isNew ? 'Add' : 'Save'}
							</Button>
						</ModalFooter>
					</Dialog.Content>
				</Dialog.Positioner>
			</Portal>
		</Dialog.Root>
	);
};

export const CodeTab: FC<Props> = ({ config, canBuild }) => {
	const tags = config.headTags;
	const [editing, setEditing] = useState<{ index: number; tag: SiteTag } | null>(null);
	const [removing, setRemoving] = useState<number | null>(null);
	const { save, saving, error, reset } = useSave('Code');

	const write = async (next: SiteTag[]) => save({ headTags: next.map(({ _id, name, location, content, enabled }) => ({ ...(_id && { _id }), name, location, content, enabled })) });
	const open = (index: number, tag: SiteTag) => {
		reset();
		setEditing({ index, tag });
	};

	return (
		<>
			<SettingCard
				id='code'
				title='Code on every page'
				description='Pieces of HTML your site’s analytics script adds to every page — a chat widget, a tag from another provider, a verification snippet. Each is saved as soon as you add, change or switch it.'
				aside={<GuideLink section='site-code' />}>
				<Flex
					direction='column'
					gap={2}>
					{!tags.length && (
						<Flex
							direction='column'
							align='center'
							gap={2}
							py={8}
							color='fg.muted'>
							<CodeIcon size={18} />
							<Text fontSize='13px'>No code yet.</Text>
						</Flex>
					)}
					{tags.map((tag, i) => (
						<Flex
							key={tag._id || i}
							align='center'
							gap={3}
							p={3}
							borderWidth='1px'
							borderColor='border.muted'
							borderRadius='md'
							wrap={{ base: 'wrap', md: 'nowrap' }}>
							<Box
								flex={1}
								minW={0}>
								<Flex
									align='center'
									gap={2}
									wrap='wrap'>
									<Text
										fontSize='13px'
										fontWeight='600'>
										{tag.name}
									</Text>
									<Badge
										size='sm'
										variant='outline'>
										{placeLabel(tag.location)}
									</Badge>
									{!tag.enabled && (
										<Badge
											size='sm'
											variant='subtle'>
											Off
										</Badge>
									)}
								</Flex>
								<Text
									fontSize='12px'
									fontFamily='mono'
									color='fg.muted'
									truncate
									mt={0.5}>
									{tag.content.replace(/\s+/g, ' ').trim()}
								</Text>
							</Box>
							<Flex
								gap={1}
								align='center'
								flexShrink={0}>
								<Switch.Root
									size='sm'
									checked={tag.enabled}
									disabled={!canBuild || saving}
									colorPalette='brand'
									aria-label={tag.enabled ? 'Switch off' : 'Switch on'}
									onCheckedChange={d => write(tags.map((t, j) => (j === i ? { ...t, enabled: d.checked } : t)))}>
									<Switch.HiddenInput />
									<Switch.Control />
								</Switch.Root>
								<Button
									size='xs'
									variant='ghost'
									disabled={!canBuild}
									onClick={() => open(i, tag)}>
									Edit
								</Button>
								<Button
									size='xs'
									variant='ghost'
									color='red.fg'
									disabled={!canBuild}
									onClick={() => setRemoving(i)}>
									Remove
								</Button>
							</Flex>
						</Flex>
					))}
					<Box mt={1}>
						<Button
							size='xs'
							variant='outline'
							disabled={!canBuild || tags.length >= 50}
							onClick={() => open(-1, { ...BLANK })}>
							<Plus size={13} />
							Add code
						</Button>
					</Box>
				</Flex>
			</SettingCard>

			<TagDialog
				tag={editing?.tag || null}
				isNew={editing?.index === -1}
				saving={saving}
				error={editing ? error : null}
				onClose={() => setEditing(null)}
				onSave={async tag => {
					const next = editing!.index === -1 ? [...tags, tag] : tags.map((t, j) => (j === editing!.index ? tag : t));
					if (await write(next)) setEditing(null);
				}}
			/>
			<PromptDialog
				open={removing !== null}
				onClose={() => setRemoving(null)}
				title='Remove this code?'
				description='It comes off every page of your site within a minute. To stop it for a while instead, switch it off.'
				subject={removing !== null ? tags[removing]?.name : undefined}
				confirmLabel='Remove'
				loading={saving}
				onConfirm={async () => {
					if (removing === null) return;
					if (await write(tags.filter((_, j) => j !== removing))) setRemoving(null);
				}}
			/>
		</>
	);
};
