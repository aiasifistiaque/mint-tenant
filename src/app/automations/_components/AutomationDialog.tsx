'use client';

import { FC, ReactNode, useEffect, useState } from 'react';
import { Box, Button, Checkbox, CloseButton, Dialog, Flex, Input, Portal, Text } from '@chakra-ui/react';
import { Plus, Zap } from 'lucide-react';
import { AlertDialogContent, AlertDialogHeader, DiscardButton, ModalFooter } from '@/components/library';
import { CopyValue, Dropdown } from '@/components/library/cl';
import GuideLink from '@/components/library/tenant/GuideLink';
import ConditionsEditor from '@/app/builder/_components/ConditionsEditor';
import type { Automation, AutomationAction, AutomationEvent, AutomationInput } from '@/components/library/store/services/tenantApi';
import ActionEditor, { ErrorLine, Person } from './ActionEditor';
import { ACTION_LABEL, PICKABLE_ACTIONS, DATE_KINDS, DATE_UNITS, EMPTY, EVENT_WORD, Page, conditionFields, inputOf, newAction, sentence } from './model';

/**
 * Adding or changing an automation (backend docs/automations): its name, the
 * trigger (page, events, which changed fields count — or a date of the record
 * being reached, EC-42), conditions, and the
 * actions in order. The sentence at the top says what it does. A server
 * refusal carries `on` — the input at fault — and shows under it.
 */

const EVENTS: AutomationEvent[] = ['create', 'update', 'delete'];
const SAVE_HINT = 'It runs after the record is saved, in the background — the save never waits for it or fails because of it.';
const DATE_HINT = 'It runs on each record’s date (checked every minute). Saving a record moves its run; clearing the date or deleting the record drops it; a date already passed when it’s saved doesn’t run. The conditions are checked when it runs.';

const Section: FC<{ title: string; hint?: string; guide?: string; children: ReactNode }> = ({ title, hint, guide, children }) => (
	<Box>
		<Flex
			align='baseline'
			justify='space-between'
			gap={3}>
			<Text
				fontSize='14px'
				fontWeight='600'>
				{title}
			</Text>
			{guide && <GuideLink section={guide} />}
		</Flex>
		{hint && (
			<Text
				fontSize='12.5px'
				color='fg.muted'
				mt={0.5}
				mb={2}>
				{hint}
			</Text>
		)}
		<Box mt={hint ? 0 : 2}>{children}</Box>
	</Box>
);

const AutomationDialog: FC<{
	open: boolean;
	onClose: () => void;
	automation?: Automation | null;
	pages: Page[];
	people: Person[];
	saving?: boolean;
	/** The server's refusal: its message and the input it's about. */
	error?: { message: string; on?: string } | null;
	onSave: (a: AutomationInput) => void;
	onEdit: () => void;
}> = ({ open, onClose, automation, pages, people, saving, error, onSave, onEdit }) => {
	const [a, setA] = useState<AutomationInput>(EMPTY);
	useEffect(() => {
		if (open) setA(automation ? inputOf(automation) : { ...EMPTY, route: pages[0]?.route || '', actions: [newAction('notify')] });
	}, [open, automation?._id]);

	const set = (patch: Partial<AutomationInput>) => {
		onEdit();
		setA(x => ({ ...x, ...patch }));
	};
	const page = pages.find(p => p.route === a.route);
	const dateFields = (page?.fields || []).filter(f => DATE_KINDS.includes(f.kind));
	const errorAt = (path: string) => (error?.on === path ? error.message : undefined);
	const placed = !!error?.on && /^(name|route|on|date|changed|when|actions)/.test(error.on);
	const putAction = (i: number, x: AutomationAction) => set({ actions: a.actions.map((y, j) => (j === i ? x : y)) });
	const move = (i: number, by: -1 | 1) => {
		const list = [...a.actions];
		[list[i], list[i + by]] = [list[i + by], list[i]];
		set({ actions: list });
	};

	return (
		<Dialog.Root
			size='xl'
			placement='top'
			scrollBehavior='inside'
			open={open}
			onOpenChange={e => !e.open && onClose()}>
			<Portal>
				<Dialog.Backdrop />
				<Dialog.Positioner>
					<AlertDialogContent
						px={0}
						borderWidth='1px'
						borderColor='border'>
						<AlertDialogHeader>
							<Flex
								as='span'
								align='center'
								gap={2}>
								<Zap size={16} />
								{automation ? `Edit “${automation.name}”` : 'New automation'}
							</Flex>
						</AlertDialogHeader>
						<Dialog.CloseTrigger
							asChild
							top={2}
							right={2}>
							<CloseButton size='sm' />
						</Dialog.CloseTrigger>
						<Dialog.Body p={4}>
							<Flex
								direction='column'
								gap={6}>
								<Box
									px={3}
									py={2.5}
									borderRadius='md'
									bg='orange.subtle'
									color='orange.fg'
									fontSize='13px'>
									{sentence(a, pages)}
								</Box>

								<Section title='Name'>
									<Input
										size='sm'
										maxLength={80}
										value={a.name}
										placeholder='Won deal → tell the team'
										onChange={e => set({ name: e.target.value })}
									/>
									<ErrorLine text={errorAt('name')} />
								</Section>

								<Section
									title='When'
									hint={a.on.includes('date') ? DATE_HINT : SAVE_HINT}
									guide={a.on.includes('date') ? 'automation-date' : 'automation-trigger'}>
									<Flex
										direction='column'
										gap={3}>
										<Dropdown
											size='sm'
											value={a.route}
											placeholder='Choose a page'
											aria-label='Page'
											items={pages.map(p => ({ value: p.route, label: `A ${p.noun} is…` }))}
											onChange={v =>
												set({
													route: v,
													changed: [],
													when: [],
													...(a.date && { date: { ...a.date, field: '' } }),
													actions: a.actions.map(x => (x.type === 'update' ? { ...x, target: 'this', set: [{ field: '', value: '' }] } : x)),
												})
											}
										/>
										<ErrorLine text={errorAt('route')} />
										<Flex
											gap={4}
											wrap='wrap'>
											{EVENTS.map(ev => (
												<Checkbox.Root
													key={ev}
													size='sm'
													checked={a.on.includes(ev)}
													onCheckedChange={e => set({ on: EVENTS.filter(x => (x === ev ? !!e.checked : a.on.includes(x))) })}>
													<Checkbox.HiddenInput />
													<Checkbox.Control />
													<Checkbox.Label fontSize='13px'>{EVENT_WORD[ev]}</Checkbox.Label>
												</Checkbox.Root>
											))}
											{/* A date runs on its own: ticking it clears the others, and they clear it. */}
											<Checkbox.Root
												size='sm'
												checked={a.on.includes('date')}
												onCheckedChange={e =>
													set(
														e.checked
															? { on: ['date'], changed: [], date: a.date || { field: dateFields[0]?.key || '', amount: 0, unit: 'days', when: 'after' } }
															: { on: ['create'] }
													)
												}>
												<Checkbox.HiddenInput />
												<Checkbox.Control />
												<Checkbox.Label fontSize='13px'>{EVENT_WORD.date}</Checkbox.Label>
											</Checkbox.Root>
										</Flex>
										<ErrorLine text={errorAt('on')} />
										{a.on.includes('date') && page && (
											<Box>
												{dateFields.length ? (
													<Flex
														gap={2}
														align='center'
														wrap='wrap'>
														<Input
															size='sm'
															type='number'
															min={0}
															max={1000}
															w='72px'
															aria-label='How long'
															value={a.date?.amount ?? 0}
															onChange={e => set({ date: { ...a.date!, amount: Math.max(0, Math.floor(Number(e.target.value) || 0)) } })}
														/>
														<Box w='110px'>
															<Dropdown
																size='sm'
																aria-label='Unit'
																value={a.date?.unit || 'days'}
																items={DATE_UNITS}
																onChange={v => set({ date: { ...a.date!, unit: v as any } })}
															/>
														</Box>
														<Box w='110px'>
															<Dropdown
																size='sm'
																aria-label='Before or after'
																value={a.date?.when || 'after'}
																items={[
																	{ value: 'after', label: 'after' },
																	{ value: 'before', label: 'before' },
																]}
																onChange={v => set({ date: { ...a.date!, when: v as any } })}
															/>
														</Box>
														<Box
															flex='1'
															minW='160px'>
															<Dropdown
																size='sm'
																aria-label='Date field'
																placeholder='Choose a date field'
																value={a.date?.field || ''}
																items={dateFields.map(f => ({ value: f.key, label: `its ${f.label}` }))}
																onChange={v => set({ date: { ...a.date!, field: v } })}
															/>
														</Box>
													</Flex>
												) : (
													<Text
														fontSize='12.5px'
														color='fg.muted'>
														{page.title} has no date field — add one in the model builder first.
													</Text>
												)}
												<Text
													fontSize='12px'
													color='fg.subtle'
													mt={1.5}>
													0 — on the date itself. A date without a time is the start of that day.
												</Text>
												<ErrorLine text={errorAt('date.field') || errorAt('date.amount')} />
											</Box>
										)}
										{a.on.includes('update') && page && (
											<Box>
												<Text
													fontSize='12.5px'
													color='fg.muted'
													mb={1.5}>
													Changed: only when one of these fields changes. None ticked — any change.
												</Text>
												<Flex
													gap={3}
													wrap='wrap'>
													{page.fields.map(f => (
														<Checkbox.Root
															key={f.key}
															size='sm'
															checked={a.changed.includes(f.key)}
															onCheckedChange={e => set({ changed: e.checked ? [...a.changed, f.key] : a.changed.filter(k => k !== f.key) })}>
															<Checkbox.HiddenInput />
															<Checkbox.Control />
															<Checkbox.Label fontSize='13px'>{f.label}</Checkbox.Label>
														</Checkbox.Root>
													))}
												</Flex>
												<ErrorLine text={errorAt('changed')} />
											</Box>
										)}
									</Flex>
								</Section>

								<Section
									title='Only if'
									guide='automation-conditions'>
									<ConditionsEditor
										fields={conditionFields(page)}
										where={a.when as any}
										onChange={w => set({ when: w as any })}
										match={a.match}
										onMatch={m => set({ match: m })}
										hint='Checked on the record as it was saved.'
										emptyHint='Every time. Add a condition to run only sometimes — when Status is Won.'
									/>
									<ErrorLine text={error?.on?.startsWith('when') ? error.message : undefined} />
								</Section>

								<Section
									title='Then'
									hint='In order. If one fails, the rest don’t run, and Runs says why.'
									guide='automation-actions'>
									<Flex
										direction='column'
										gap={3}>
										{a.actions.map((x, i) => (
											<ActionEditor
												key={i}
												index={i}
												count={a.actions.length}
												action={x}
												onChange={y => putAction(i, y)}
												onRemove={() => set({ actions: a.actions.filter((_, j) => j !== i) })}
												onMove={by => move(i, by)}
												page={page}
												pages={pages}
												people={people}
												errorAt={errorAt}
											/>
										))}
										<ErrorLine text={errorAt('actions')} />
										{a.actions.length < 10 && (
											<Flex
												align='center'
												gap={2}>
												<Plus size={14} />
												<Dropdown
													size='sm'
													w='220px'
													value=''
													placeholder='Add an action'
													aria-label='Add an action'
													items={PICKABLE_ACTIONS.map(t => ({ value: t, label: ACTION_LABEL[t] }))}
													onChange={t => set({ actions: [...a.actions, newAction(t as AutomationAction['type'])] })}
												/>
											</Flex>
										)}
									</Flex>
								</Section>

								{automation?.secret && a.actions.some(x => x.type === 'webhook') && (
									<Section
										title='Webhook secret'
										hint='Your server checks x-mint-signature with it — sha256 HMAC of “<x-mint-timestamp>.<body>”, as for project webhooks.'
										guide='automation-actions'>
										<CopyValue
											value={automation.secret}
											display={`${automation.secret.slice(0, 10)}…`}
										/>
									</Section>
								)}

								{error && !placed && (
									<Text
										role='alert'
										fontSize='13px'
										color='red.fg'>
										{error.message}
									</Text>
								)}
							</Flex>
						</Dialog.Body>
						<ModalFooter>
							{error && placed && (
								<Text
									fontSize='12.5px'
									color='red.fg'
									flex={1}>
									{error.message}
								</Text>
							)}
							<DiscardButton onClick={onClose}>Cancel</DiscardButton>
							<Button
								size='sm'
								px={3}
								loading={saving}
								disabled={!a.name.trim() || !a.route || !a.on.length || !a.actions.length}
								onClick={() => onSave({ ...a, name: a.name.trim() })}>
								{automation ? 'Save' : 'Add the automation'}
							</Button>
						</ModalFooter>
					</AlertDialogContent>
				</Dialog.Positioner>
			</Portal>
		</Dialog.Root>
	);
};

export default AutomationDialog;
