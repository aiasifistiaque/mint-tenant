'use client';

import { FC, useEffect, useMemo, useState } from 'react';
import { Badge, Box, Button, CloseButton, Dialog, Flex, IconButton, Input, Portal, SegmentGroup, Text } from '@chakra-ui/react';
import { Link2, Plus, X } from 'lucide-react';
import { AlertDialogContent, AlertDialogHeader, ModalFooter, useGetBuilderRouteQuery } from '@/components/library';
import DiscardButton from '@/components/library/components/buttons/DiscardButton';
import { Dropdown } from '@/components/library/cl';
import ConditionsEditor from './ConditionsEditor';
import { ModelField } from './filterTypes';
import { SettingsField } from './SettingsEditor';
import { DocLink, FieldLabel, Toggle } from './ui';
import { ACTIONS, Assignment, HOW, HowKind, LinkedRule, UNDO, howOf, ruleProblems, ruleSentence, stepIsField, stepOf, withHow } from './linkedRules';

/**
 * One Linked Relationship, edited as the sentence it reads as: when this
 * record is added / edited / deleted, if…, update the record picked in…
 * (only if it…): set its fields — or refuse the save. Every choice is a
 * dropdown of real fields: this page's on the left, the linked page's on the
 * right (only those that may be edited there). The sentence on top follows
 * the choices. Nothing is saved until Save rule, and nothing goes live until
 * the page is published.
 */

type Props = {
	open: boolean;
	onClose: () => void;
	onSave: (rule: LinkedRule) => void;
	rule: LinkedRule;
	/** This page: its title, settings fields and model fields (for conditions). */
	title: string;
	fields: SettingsField[];
	modelFields: ModelField[];
};

const labelOf = (fields: SettingsField[], key: string) => {
	const f = fields.find(x => x.key === key);
	return f?.schema?.label || f?.title || key;
};

/** The linked page's settings fields, as it runs now (draft first: that's what the builder shows). */
const settingsOf = (data: any): SettingsField[] =>
	(data?.settings?.draft ?? data?.settings?.data)?.fields || data?.code?.settings?.fields || [];

const LinkedRuleDialog: FC<Props> = ({ open, onClose, onSave, rule, title, fields, modelFields }) => {
	const [r, setR] = useState<LinkedRule>(rule);
	useEffect(() => {
		if (open) setR(rule);
	}, [open, rule]);
	const set = (patch: Partial<LinkedRule>) => setR(x => ({ ...x, ...patch }));
	const setTarget = (patch: Partial<LinkedRule['target']>) => setR(x => ({ ...x, target: { ...x.target, ...patch } }));
	const setRow = (i: number, a: Assignment) => setR(x => ({ ...x, set: (x.set || []).map((y, j) => (j === i ? a : y)) }));

	// Fields that pick a record of another page — the only ones a rule can follow.
	const pickers = useMemo(() => fields.filter(f => typeof f.schema?.model === 'string' && f.schema.model), [fields]);
	const via = pickers.find(f => f.key === r.target.via);
	const targetRoute: string | undefined = r.target.route || via?.schema?.model;
	const { data: target, isFetching } = useGetBuilderRouteQuery(targetRoute as string, { skip: !open || !targetRoute });
	const targetFields = useMemo(() => settingsOf(target), [target]);
	const targetModelFields: ModelField[] = target?.fields || [];
	const targetTitle: string =
		(target?.config?.draft ?? target?.config?.data ?? target?.code?.config)?.route?.title || via?.schema?.label || via?.title || targetRoute || 'record';
	// What a rule may set: editable there, not worked out by itself.
	const settable = targetFields.filter(f => f.edit && f.schema?.type !== 'formula' && !f.rollup);
	const numbersHere = fields.filter(f => f.type === 'number');
	// Conditions may compare with one of this record's fields: "Balance is less than this Transfer’s Amount".
	const compareWith = { label: title, fields: fields.map(f => ({ key: f.key, label: labelOf(fields, f.key) })) };

	const isBlock = !!r.block;
	const problems = ruleProblems(r);
	const sentence = ruleSentence(r, {
		self: k => labelOf(fields, k),
		target: k => labelOf(targetFields, k),
		title,
		targetTitle,
	});

	const valueInput = (a: Assignment, i: number) => {
		const how = howOf(a);
		if (how === 'clear') return null;
		if (how === 'from')
			return (
				<Dropdown
					size='xs'
					w='180px'
					value={a.from || ''}
					placeholder='This record’s field'
					onChange={(v: string) => setRow(i, { field: a.field, from: v })}>
					{fields.map(f => (
						<option
							key={f.key}
							value={f.key}>
							{labelOf(fields, f.key)}
						</option>
					))}
				</Dropdown>
			);
		if (how === 'inc' || how === 'dec')
			return (
				<Flex
					gap={1}
					align='center'>
					<Dropdown
						size='xs'
						w='150px'
						value={stepIsField(a) ? String(stepOf(a)) : ''}
						placeholder='A number field…'
						onChange={(v: string) => setRow(i, { ...a, [how]: v })}>
						{numbersHere.map(f => (
							<option
								key={f.key}
								value={f.key}>
								{labelOf(fields, f.key)}
							</option>
						))}
					</Dropdown>
					<Text
						fontSize='xs'
						color='fg.muted'>
						or
					</Text>
					<Input
						size='xs'
						w='70px'
						type='number'
						placeholder='1'
						value={stepIsField(a) ? '' : String(stepOf(a) ?? '')}
						onChange={e => setRow(i, { ...a, [how]: e.target.value })}
					/>
				</Flex>
			);
		if (how === 'formula')
			return (
				<Input
					size='xs'
					w='240px'
					fontFamily='mono'
					placeholder='target.paidAmount + this.amount'
					value={a.formula || ''}
					onChange={e => setRow(i, { field: a.field, formula: e.target.value })}
				/>
			);
		// A value: a choice field offers its options, a yes/no field Yes/No.
		const tf = targetFields.find(f => f.key === a.field);
		const options: any[] = Array.isArray(tf?.schema?.options) ? tf!.schema.options : [];
		if (options.length)
			return (
				<Dropdown
					size='xs'
					w='180px'
					value={String(a.value ?? '')}
					placeholder='Pick a value'
					onChange={(v: string) => setRow(i, { field: a.field, value: v })}>
					{options.map((o: any) => {
						const v = String(o?.value ?? o);
						return (
							<option
								key={v}
								value={v}>
								{String(o?.label || v)}
							</option>
						);
					})}
				</Dropdown>
			);
		if (tf?.type === 'boolean')
			return (
				<Dropdown
					size='xs'
					w='110px'
					value={String(a.value ?? '')}
					placeholder='Pick'
					onChange={(v: string) => setRow(i, { field: a.field, value: v === 'true' })}>
					<option value='true'>Yes</option>
					<option value='false'>No</option>
				</Dropdown>
			);
		return (
			<Input
				size='xs'
				w='180px'
				type={tf?.type === 'number' ? 'number' : tf?.type === 'date' ? 'date' : 'text'}
				placeholder='Value'
				value={String(a.value ?? '')}
				onChange={e => setRow(i, { field: a.field, value: tf?.type === 'number' && e.target.value !== '' ? Number(e.target.value) : e.target.value })}
			/>
		);
	};

	return (
		<Dialog.Root
			size='xl'
			// Grows as rows are added: pinned to the top so the buttons don't move under the pointer.
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
								<Link2 size={16} />
								{rule.name ? `Edit “${rule.name}”` : 'New linked relationship'}
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
								gap={5}>
								{/* The sentence: what this rule does, in words. */}
								<Box
									px={3}
									py={2.5}
									borderRadius='md'
									bg='green.subtle'
									color='green.fg'
									fontSize='sm'>
									{sentence}
								</Box>

								<Box>
									<FieldLabel>Name</FieldLabel>
									<Input
										size='sm'
										placeholder='Mark invoice paid'
										value={r.name || ''}
										onChange={e => set({ name: e.target.value })}
									/>
								</Box>

								<Box>
									<FieldLabel>1 · When a {title} is…</FieldLabel>
									<Flex
										gap={2}
										flexWrap='wrap'>
										{ACTIONS.map(a => {
											const on = (r.on || []).includes(a.value);
											return (
												<Button
													key={a.value}
													size='xs'
													variant={on ? 'solid' : 'outline'}
													onClick={() => set({ on: on ? (r.on || []).filter(x => x !== a.value) : [...(r.on || []), a.value] })}>
													{a.label}
												</Button>
											);
										})}
									</Flex>
									{(r.on || []).includes('delete') && !isBlock && (
										<Text
											fontSize='xs'
											color='fg.muted'
											mt={1.5}>
											With “deleted” on, the changes are made when the record is deleted, instead of being taken back.
										</Text>
									)}
								</Box>

								<Box>
									<FieldLabel>2 · If (optional)</FieldLabel>
									<ConditionsEditor
										fields={modelFields}
										where={(r.when || []) as any}
										onChange={w => set({ when: w as any })}
										match={r.match}
										onMatch={m => set({ match: m })}
										compareWith={compareWith}
										hint='Only when these hold — Mark as paid is Yes'
										emptyHint='Every time'
									/>
								</Box>

								<Box>
									<FieldLabel>3 · Update the record picked in</FieldLabel>
									{pickers.length ? (
										<Dropdown
											size='sm'
											w='260px'
											value={r.target.via}
											placeholder='A field that picks a record'
											onChange={(v: string) => setR(x => ({ ...x, target: { via: v }, set: [{ field: '', value: '' }] }))}>
											{pickers.map(f => (
												<option
													key={f.key}
													value={f.key}>
													{labelOf(fields, f.key)} → {f.schema.model}
												</option>
											))}
										</Dropdown>
									) : (
										<Text
											fontSize='sm'
											color='fg.muted'>
											This page has no field that picks a record of another page. Add one in Fields &amp; rules first.
										</Text>
									)}
								</Box>

								{via && (
									<Box>
										<FieldLabel>Only if that {targetTitle} (optional)</FieldLabel>
										<ConditionsEditor
											fields={targetModelFields}
											where={(r.target.when || []) as any}
											onChange={w => setTarget({ when: w as any })}
											match={r.target.match}
											onMatch={m => setTarget({ match: m })}
											compareWith={compareWith}
											hint='Only when the linked record holds these — Status is not cancelled, or Balance is less than this record’s Amount'
											emptyHint='Any linked record'
										/>
									</Box>
								)}

								{via && (
									<Box>
										<FieldLabel>4 · Then</FieldLabel>
										<SegmentGroup.Root
											size='xs'
											mb={3}
											value={isBlock ? 'block' : 'set'}
											onValueChange={e =>
												e.value === 'block'
													? set({ block: { message: r.block?.message || '' } })
													: setR(x => {
															const { block, ...rest } = x;
															void block;
															return { ...rest, set: rest.set?.length ? rest.set : [{ field: '', value: '' }] };
													  })
											}>
											<SegmentGroup.Indicator />
											<SegmentGroup.Items
												items={[
													{ value: 'set', label: `Change the ${targetTitle}` },
													{ value: 'block', label: 'Refuse the save' },
												]}
											/>
										</SegmentGroup.Root>

										{isBlock ? (
											<Box>
												<Input
													size='sm'
													placeholder='This invoice is cancelled — it can’t take payments.'
													value={r.block?.message || ''}
													onChange={e => set({ block: { message: e.target.value } })}
												/>
												<Text
													fontSize='xs'
													color='fg.muted'
													mt={1.5}>
													Shown to whoever saves while the conditions above hold. Nothing is saved.
												</Text>
											</Box>
										) : (
											<Flex
												direction='column'
												gap={2}>
												{isFetching && !targetFields.length && (
													<Text
														fontSize='xs'
														color='fg.muted'>
														Loading {targetTitle}’s fields…
													</Text>
												)}
												{(r.set || []).map((a, i) => (
													<Box key={i}>
														<Flex
															gap={2}
															align='center'
															flexWrap='wrap'>
															<Dropdown
																size='xs'
																w='170px'
																value={a.field}
																placeholder={`${targetTitle} field`}
																onChange={(v: string) => setRow(i, { ...a, field: v })}>
																{settable.map(f => (
																	<option
																		key={f.key}
																		value={f.key}>
																		{labelOf(targetFields, f.key)}
																	</option>
																))}
															</Dropdown>
															<Dropdown
																size='xs'
																w='170px'
																value={howOf(a)}
																onChange={(v: string) => setRow(i, withHow(a, v as HowKind))}>
																{HOW.filter(h => !['inc', 'dec'].includes(h.value) || targetFields.find(f => f.key === a.field)?.type === 'number' || !a.field).map(h => (
																	<option
																		key={h.value}
																		value={h.value}>
																		{h.label}
																	</option>
																))}
															</Dropdown>
															{valueInput(a, i)}
															<IconButton
																aria-label='Remove this change'
																size='xs'
																variant='ghost'
																onClick={() => set({ set: (r.set || []).filter((_, j) => j !== i) })}>
																<X size={14} />
															</IconButton>
														</Flex>
														{/* A floor: a balance that can't go under 0 refuses the transfer instead. */}
														{['inc', 'dec'].includes(howOf(a)) && (
															<Flex
																gap={2}
																align='center'
																flexWrap='wrap'
																mt={1.5}
																pl={3}
																borderLeftWidth='2px'
																borderColor='border'>
																<Text
																	fontSize='xs'
																	color='fg.muted'>
																	Never below
																</Text>
																<Input
																	size='xs'
																	w='80px'
																	type='number'
																	placeholder='No limit'
																	value={String(a.min ?? '')}
																	onChange={e => setRow(i, { ...a, min: e.target.value === '' ? undefined : e.target.value })}
																/>
																{a.min !== undefined && a.min !== '' && (
																	<Input
																		size='xs'
																		flex='1'
																		minW='200px'
																		placeholder={`Message when it would — Not enough ${labelOf(targetFields, a.field).toLowerCase()}`}
																		value={a.message || ''}
																		onChange={e => setRow(i, { ...a, message: e.target.value })}
																	/>
																)}
															</Flex>
														)}
													</Box>
												))}
												<Flex
													align='center'
													gap={3}>
													<Button
														size='xs'
														variant='outline'
														onClick={() => set({ set: [...(r.set || []), { field: '', value: '' }] })}>
														<Plus size={14} /> Change another field
													</Button>
													<Text
														fontSize='xs'
														color='fg.muted'>
														Only fields that can be edited on {targetTitle} are offered.
													</Text>
												</Flex>
												{(r.set || []).some(a => howOf(a) === 'inc') && (
													<Text
														fontSize='xs'
														color='orange.fg'>
														Keeping a running total? A rollup on {targetTitle} adds up the linked records when it’s read and can never drift.
													</Text>
												)}
											</Flex>
										)}
									</Box>
								)}

								{via && !isBlock && (
									<Box>
										<FieldLabel>5 · When it stops holding</FieldLabel>
										<Text
											fontSize='xs'
											color='fg.muted'
											mb={2}>
											The {title} is deleted, the conditions no longer hold, or another {targetTitle} is picked.
										</Text>
										<Dropdown
											size='sm'
											w='220px'
											value={r.undo || 'revert'}
											onChange={(v: string) => set({ undo: v as any })}>
											{UNDO.map(u => (
												<option
													key={u.value}
													value={u.value}>
													{u.label}
												</option>
											))}
										</Dropdown>
										<Text
											fontSize='xs'
											color='fg.muted'
											mt={1.5}>
											{UNDO.find(u => u.value === (r.undo || 'revert'))?.hint}
										</Text>
									</Box>
								)}

								{via && (
									<Flex
										direction='column'
										gap={3}>
										<FieldLabel>Options</FieldLabel>
										<Toggle
											label={`Allow even if they can’t edit ${targetTitle}`}
											hint={`Without it, only people who may edit ${targetTitle} can save a ${title} this rule changes.`}
											checked={!!r.asSystem}
											onChange={v => set({ asSystem: v })}
										/>
										<Toggle
											label='Also for website and API saves'
											hint='Records saved through the public API (a website, an app) run this rule too, as the system. Off: a site can’t change linked records through it.'
											checked={!!r.fromApi}
											onChange={v => set({ fromApi: v })}
										/>
										<Toggle
											label='On'
											hint='Switch the rule off without deleting it.'
											checked={r.enabled !== false}
											onChange={v => set({ enabled: v })}
										/>
									</Flex>
								)}

								{problems.length > 0 && (
									<Flex
										gap={1.5}
										flexWrap='wrap'>
										{problems.map(p => (
											<Badge
												key={p}
												colorPalette='orange'
												variant='subtle'>
												{p.replace(/^[^:]*: /, '')}
											</Badge>
										))}
									</Flex>
								)}
							</Flex>
						</Dialog.Body>

						<ModalFooter>
							<Box mr='auto'>
								<DocLink section='linked-rule' />
							</Box>
							<DiscardButton onClick={onClose}>Cancel</DiscardButton>
							<Button
								size='sm'
								px={3}
								disabled={problems.length > 0}
								onClick={() => onSave(r)}>
								Save rule
							</Button>
						</ModalFooter>
					</AlertDialogContent>
				</Dialog.Positioner>
			</Portal>
		</Dialog.Root>
	);
};

export default LinkedRuleDialog;
