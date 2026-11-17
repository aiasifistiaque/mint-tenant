'use client';

import { DragEvent, FC, useState } from 'react';
import { Box, Button, Flex, IconButton, Input, Switch, Text } from '@chakra-ui/react';
import { ArrowDown, ArrowUp, GripVertical, ListOrdered, PanelRight, Plus, Trash2, TriangleAlert } from 'lucide-react';
import { radius, PromptDialog } from '@/components/library';
import { Dropdown, Panel } from '@/components/library/cl';
import { ToneTitle } from './areas';
import { DocLink, Toggle } from './ui';

/**
 * Form in pages (backend docs/multi-page-forms): the add / edit page as steps —
 * 1 Basic info → 2 Pricing → 3 Inventory… People go through them one by one and
 * save once at the end.
 *
 * Steps group the form's sections; they hold no fields of their own (D1). The
 * config keeps `formSteps { enabled, review, reviewOn, steps: [{ key, title, description }] }`
 * and each section of `form` names its page with `step` (none, or a key no page
 * has → the last page, D3) and may sit in the page's side column (`side`, D12).
 * Steps only apply when the add form opens as its own page (D2).
 */

export type FormStep = { key: string; title: string; description?: string };
export type FormSteps = { enabled?: boolean; review?: boolean; reviewOn?: string; steps?: FormStep[] };
type Section = { sectionTitle?: string; fields?: any[]; step?: string; side?: boolean; [k: string]: any };

type Props = {
	value?: FormSteps;
	form: Section[];
	onChange: (patch: { formSteps?: FormSteps; form?: Section[] }) => void;
	/** The add button opens its own page (route.button.path). */
	opensAsPage: boolean;
	onOpenAsPage: () => void;
};

const ICON = { size: 14, strokeWidth: 1.75 };

/** A new page's key: s<n>, past every key in use, so renaming never moves a section (D11). */
const nextKey = (steps: FormStep[]) => {
	const n = Math.max(0, ...steps.map(s => Number(/^s(\d+)$/.exec(s.key)?.[1] || 0)));
	return `s${n + 1}`;
};

/** Problems the server would refuse, as messages (for the builder's Save). */
export const formStepsProblems = (fs?: FormSteps) => {
	if (!fs?.enabled) return [];
	const out: string[] = [];
	(fs.steps || []).forEach((s, i) => !String(s.title || '').trim() && out.push(`Page ${i + 1} needs a title`));
	if ((fs.steps || []).length > 12) out.push('A form can have up to 12 pages');
	return out;
};

const countFields = (s: Section) => (s.fields || []).flat().length;

const FormStepsPanel: FC<Props> = ({ value, form, onChange, opensAsPage, onOpenAsPage }) => {
	const steps = value?.steps || [];
	const enabled = !!value?.enabled;
	const keys = new Set(steps.map(s => s.key));
	const [removing, setRemoving] = useState<number | null>(null);
	const [dragging, setDragging] = useState<number | null>(null);

	const setSteps = (next: FormSteps) => onChange({ formSteps: next });
	const setStep = (i: number, patch: Partial<FormStep>) =>
		setSteps({ ...value, steps: steps.map((s, j) => (j === i ? { ...s, ...patch, ...(patch.description === '' && { description: undefined }) } : s)) });
	const setSection = (i: number, patch: Partial<Section>) => {
		const next = form.map((s, j) => {
			if (j !== i) return s;
			const out = { ...s, ...patch };
			if (!out.side) delete out.side;
			if (!out.step) delete out.step;
			return out;
		});
		onChange({ form: next });
	};

	/** On for the first time: a page per section (one page holding everything when there's one). */
	const turnOn = (on: boolean) => {
		if (!on) return setSteps({ ...value, enabled: false });
		if (steps.length) return setSteps({ ...value, enabled: true });
		if (form.length <= 1) {
			const title = form[0]?.sectionTitle || 'Details';
			return onChange({ formSteps: { ...value, enabled: true, steps: [{ key: 's1', title }] }, form: form.map(s => ({ ...s, step: 's1' })) });
		}
		const made = form.slice(0, 12).map((s, i) => ({ key: `s${i + 1}`, title: s.sectionTitle || `Page ${i + 1}` }));
		onChange({
			formSteps: { ...value, enabled: true, steps: made },
			form: form.map((s, i) => ({ ...s, step: made[Math.min(i, made.length - 1)].key })),
		});
	};

	const addPage = () => setSteps({ ...value, steps: [...steps, { key: nextKey(steps), title: `Page ${steps.length + 1}` }] });
	const move = (from: number, to: number) => {
		if (to < 0 || to >= steps.length || from === to) return;
		const next = [...steps];
		const [s] = next.splice(from, 1);
		next.splice(to, 0, s);
		setSteps({ ...value, steps: next });
	};
	/** A deleted page's sections move to the page before it (or after, for the first). */
	const removePage = (i: number) => {
		const gone = steps[i];
		const to = steps[i - 1] || steps[i + 1];
		onChange({
			formSteps: { ...value, steps: steps.filter((_, j) => j !== i), ...(value?.reviewOn === gone.key && { reviewOn: '' }) },
			form: form.map(s => (s.step === gone.key ? { ...s, step: to?.key } : s)),
		});
	};
	const addSection = (key: string) =>
		onChange({ form: [...form, { sectionTitle: 'New section', fields: [], step: key }] });

	// Sections on no page (or a page that's gone) show on the last one (D3).
	const lastKey = steps[steps.length - 1]?.key;
	const pageOf = (s: Section) => (s.step && keys.has(s.step) ? s.step : undefined);
	const unplaced = form.map((s, i) => ({ s, i })).filter(({ s }) => !pageOf(s));

	const sectionRow = (s: Section, i: number) => (
		<Flex
			key={i}
			align='center'
			gap={3}
			flexWrap='wrap'
			py={2}
			px={3}
			borderWidth='1px'
			borderColor='border'
			borderRadius={radius.CONTAINER}
			bg='bg.panel'>
			<Box
				flex='1'
				minW='160px'>
				<Text
					fontSize='sm'
					fontWeight='500'>
					{s.sectionTitle || 'Untitled section'}
				</Text>
				<Text
					fontSize='xs'
					color='fg.muted'>
					{countFields(s) ? `${countFields(s)} ${countFields(s) === 1 ? 'field' : 'fields'}` : 'No fields yet — add them in Sections of the form'}
				</Text>
			</Box>
			<Flex
				align='center'
				gap={2}>
				<Text
					fontSize='xs'
					color='fg.muted'>
					Page
				</Text>
				<Dropdown
					size='xs'
					w='170px'
					value={pageOf(s) || ''}
					placeholder='Not on a page'
					onChange={v => setSection(i, { step: v })}>
					{steps.map((p, n) => (
						<option
							key={p.key}
							value={p.key}>
							{n + 1}. {p.title || 'Untitled'}
						</option>
					))}
				</Dropdown>
			</Flex>
			<Switch.Root
				size='sm'
				checked={!!s.side}
				onCheckedChange={d => setSection(i, { side: d.checked })}>
				<Switch.HiddenInput />
				<Switch.Control />
				<Switch.Label
					fontSize='xs'
					display='flex'
					alignItems='center'
					gap={1}>
					<PanelRight size={12} />
					Side column
				</Switch.Label>
			</Switch.Root>
		</Flex>
	);

	return (
		<Panel
			title={
				<ToneTitle
					icon={ListOrdered}
					palette='orange'>
					Form in pages
				</ToneTitle>
			}
			subtitle='Split a long add / edit form into steps — Basic info, Pricing, Inventory… People go through them one by one and save once at the end.'
			actions={<DocLink section='form-steps' />}>
			<Flex
				id='form-steps'
				direction='column'
				gap={4}>
				<Toggle
					label='Split the form into pages'
					hint='Each page holds one or more of the sections below. Used when the add form opens as its own page.'
					checked={enabled}
					onChange={turnOn}
				/>

				{!opensAsPage && (
					<Flex
						align='center'
						justify='space-between'
						gap={3}
						flexWrap='wrap'
						p={3}
						borderRadius={radius.CONTAINER}
						bg='orange.subtle'
						color='orange.fg'>
						<Flex
							align='center'
							gap={2}>
							<TriangleAlert size={14} />
							<Text
								fontSize='xs'
								color='inherit'>
								The add button opens a pop-up, which shows every section at once. Pages need the form on its own page.
							</Text>
						</Flex>
						<Button
							size='xs'
							variant='outline'
							onClick={onOpenAsPage}>
							Open it as a page
						</Button>
					</Flex>
				)}

				{enabled && (
					<>
						<Toggle
							label='Review page'
							hint='A page that sums up what was filled in, with a link back to each page.'
							checked={!!value?.review}
							onChange={review => setSteps({ ...value, review })}
						/>
						{value?.review && steps.length > 1 && (
							<Flex
								align='center'
								gap={2}
								flexWrap='wrap'
								pl={1}>
								<Text
									fontSize='xs'
									color='fg.muted'>
									The summary goes
								</Text>
								<Dropdown
									size='xs'
									w='240px'
									value={steps.some((p, n) => n > 0 && p.key === value?.reviewOn) ? value!.reviewOn! : ''}
									onChange={v => setSteps({ ...value, reviewOn: v || '' })}>
									<option value=''>On a page of its own, last</option>
									{steps.slice(1).map((p, n) => (
										<option
											key={p.key}
											value={p.key}>
											At the top of {n + 2}. {p.title || 'Untitled'}
										</option>
									))}
								</Dropdown>
								<Text
									fontSize='xs'
									color='fg.subtle'>
									On a page: the summary of the pages before it, then its own sections — a last page “Review &amp; finalize” with the status.
								</Text>
							</Flex>
						)}

						<Flex
							direction='column'
							gap={3}>
							{steps.map((p, i) => {
								const own = form.map((s, n) => ({ s, n })).filter(({ s }) => pageOf(s) === p.key);
								return (
									<Box
										key={p.key}
										borderWidth='1px'
										borderColor={dragging === i ? 'orange.focusRing' : 'border'}
										borderRadius={radius.CONTAINER}
										bg='bg.subtle'
										p={3}
										onDragOver={(e: DragEvent) => dragging !== null && e.preventDefault()}
										onDrop={(e: DragEvent) => {
											e.preventDefault();
											if (dragging !== null) move(dragging, i);
											setDragging(null);
										}}>
										<Flex
											align='center'
											gap={2}>
											<Flex
												draggable
												onDragStart={(e: DragEvent) => {
													e.dataTransfer.effectAllowed = 'move';
													setDragging(i);
												}}
												onDragEnd={() => setDragging(null)}
												cursor='grab'
												color='fg.muted'
												aria-label='Drag to reorder'>
												<GripVertical {...ICON} />
											</Flex>
											<Flex
												align='center'
												justify='center'
												flexShrink={0}
												w='26px'
												h='26px'
												borderRadius='full'
												borderWidth='1.5px'
												borderColor='orange.solid'
												color='orange.fg'
												fontSize='xs'
												fontWeight='700'>
												{i + 1}
											</Flex>
											<Input
												size='sm'
												flex='1'
												bg='bg.panel'
												value={p.title}
												maxLength={60}
												placeholder='Page title — e.g. Pricing'
												onChange={e => setStep(i, { title: e.target.value })}
											/>
											<IconButton
												size='xs'
												variant='ghost'
												aria-label='Move up'
												disabled={i === 0}
												onClick={() => move(i, i - 1)}>
												<ArrowUp {...ICON} />
											</IconButton>
											<IconButton
												size='xs'
												variant='ghost'
												aria-label='Move down'
												disabled={i === steps.length - 1}
												onClick={() => move(i, i + 1)}>
												<ArrowDown {...ICON} />
											</IconButton>
											<IconButton
												size='xs'
												variant='ghost'
												aria-label='Delete page'
												disabled={steps.length === 1}
												onClick={() => setRemoving(i)}>
												<Trash2 {...ICON} />
											</IconButton>
										</Flex>
										<Input
											size='xs'
											mt={2}
											bg='bg.panel'
											value={p.description || ''}
											maxLength={200}
											placeholder='A short line under the title (optional)'
											onChange={e => setStep(i, { description: e.target.value })}
										/>
										<Flex
											direction='column'
											gap={2}
											mt={3}>
											{own.map(({ s, n }) => sectionRow(s, n))}
											{p.key === lastKey && unplaced.length > 0 && (
												<Text
													fontSize='xs'
													color='orange.fg'>
													Also shown here: {unplaced.map(({ s }) => s.sectionTitle || 'Untitled').join(', ')} (not on a page)
												</Text>
											)}
											{!own.length && !(p.key === lastKey && unplaced.length) && (
												<Text
													fontSize='xs'
													color='fg.muted'>
													No sections on this page yet — it’s skipped until it has one.
												</Text>
											)}
											<Button
												size='xs'
												variant='ghost'
												alignSelf='flex-start'
												onClick={() => addSection(p.key)}>
												<Plus {...ICON} />
												Add a section here
											</Button>
										</Flex>
									</Box>
								);
							})}
						</Flex>

						{unplaced.length > 0 && (
							<Box
								p={3}
								borderRadius={radius.CONTAINER}
								borderWidth='1px'
								borderColor='orange.muted'
								bg='orange.subtle'>
								<Flex
									align='center'
									gap={2}
									mb={2}
									color='orange.fg'>
									<TriangleAlert size={14} />
									<Text
										fontSize='xs'
										fontWeight='600'
										color='inherit'>
										{unplaced.length === 1 ? 'A section isn’t' : `${unplaced.length} sections aren’t`} on a page — {unplaced.length === 1 ? 'it shows' : 'they show'} on the last page.
									</Text>
								</Flex>
								<Flex
									direction='column'
									gap={2}>
									{unplaced.map(({ s, i }) => sectionRow(s, i))}
								</Flex>
							</Box>
						)}

						<Button
							size='sm'
							variant='outline'
							alignSelf='flex-start'
							disabled={steps.length >= 12}
							onClick={addPage}>
							<Plus {...ICON} />
							Add a page
						</Button>
					</>
				)}
			</Flex>
			<PromptDialog
				open={removing !== null}
				onClose={() => setRemoving(null)}
				onConfirm={() => {
					if (removing !== null) removePage(removing);
					setRemoving(null);
				}}
				tone='danger'
				title='Delete this page?'
				subject={removing !== null ? steps[removing]?.title || 'Untitled page' : undefined}
				description={
					removing !== null && (steps[removing - 1] || steps[removing + 1])
						? `Its sections move to “${(steps[removing - 1] || steps[removing + 1]).title || 'the next page'}”. Nothing changes until you publish.`
						: 'Nothing changes until you publish.'
				}
			/>
		</Panel>
	);
};

export default FormStepsPanel;
