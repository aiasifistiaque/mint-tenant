'use client';

import { FC } from 'react';
import { Box, Button, Flex, IconButton, Switch, Text } from '@chakra-ui/react';
import { Eye, LayoutList, Plus, Trash2 } from 'lucide-react';
import { Panel } from '@/components/library/cl';
import { Rule } from '@/components/library/functions/formRules';
import { OPS_BY_KIND, RuleConditions, RuleField, conditionProblem, describeRule, fromUi, kindOf, toUi } from './FormRulesPanel';
import { ToneTitle } from './areas';
import { DocLink } from './ui';

/**
 * The record page's sections, shown only when needed (config `view[].showIf`
 * and `view[].hideEmpty`): a section that appears only when the record holds
 * certain values — "Bank details" when Method is Bank transfer — and one that
 * leaves out its fields with no value (and linked lists with no records).
 * Worked out on the server for the record page and the quick view
 * (viewDocument.controller); a section left with nothing to show goes too.
 */

const ICON = { size: 14, strokeWidth: 1.75 };

type ViewSection = { title?: string; showIf?: Rule; hideEmpty?: boolean; [k: string]: any };

const nameOf = (sec: ViewSection, i: number) => sec.title?.trim() || `Section ${i + 1}`;

const ViewSectionRulesPanel: FC<{
	sections: ViewSection[];
	onChange: (sections: ViewSection[]) => void;
	/** Every field of the record — a condition can test any of them. */
	fields: RuleField[];
}> = ({ sections, onChange, fields }) => {
	const byKey = new Map(fields.map(f => [f.key, f]));
	const labelOf = (k: string) => byKey.get(k)?.label || k;
	const optionLabel = (k: string, v: any) => {
		const f = byKey.get(k);
		if (kindOf(f) === 'record') return 'the picked record';
		const o = f?.options?.find(o => String(o.value) === String(v));
		return String(o?.label ?? v ?? '');
	};
	const set = (i: number, patch: Partial<ViewSection>) =>
		onChange(
			sections.map((sec, j) => {
				if (j !== i) return sec;
				const next: ViewSection = { ...sec, ...patch };
				if (!next.showIf) delete next.showIf;
				if (!next.hideEmpty) delete next.hideEmpty;
				return next;
			})
		);

	return (
		<Panel
			title={
				<ToneTitle
					icon={Eye}
					palette='green'>
					Sections shown only when needed
				</ToneTitle>
			}
			subtitle='For each section of the record page and quick view: show it only when the record holds certain values, and leave out fields that have no value. A section with nothing left to show is left out.'
			actions={<DocLink section='view-visibility' />}>
			{!sections.length ? (
				<Text
					fontSize='sm'
					color='fg.muted'>
					The record page has no sections yet — lay it out above first.
				</Text>
			) : (
				<Flex
					direction='column'
					gap={3}>
					{sections.map((sec, i) => {
						const ui = sec.showIf ? toUi(sec.showIf) : null;
						const problems = ui ? ui.conditions.map(c => conditionProblem(c, byKey)).filter(Boolean) : [];
						return (
							<Box
								key={i}
								borderWidth='1px'
								borderColor={problems.length ? 'red.muted' : 'border'}
								borderRadius='md'
								p={3}>
								<Flex
									align='center'
									gap={2}
									flexWrap='wrap'>
									<LayoutList size={13} />
									<Text
										fontSize='sm'
										fontWeight='600'>
										{nameOf(sec, i)}
									</Text>
									<Flex
										ml='auto'
										align='center'
										gap={3}
										flexWrap='wrap'>
										<Switch.Root
											size='sm'
											checked={!!sec.hideEmpty}
											onCheckedChange={e => set(i, { hideEmpty: e.checked })}>
											<Switch.HiddenInput />
											<Switch.Control />
											<Switch.Label fontSize='xs'>Hide fields with no value</Switch.Label>
										</Switch.Root>
										{sec.showIf ? (
											<IconButton
												size='2xs'
												variant='ghost'
												color='red.fg'
												aria-label={`Remove the condition on ${nameOf(sec, i)}`}
												title='Remove the condition — the section always shows'
												onClick={() => set(i, { showIf: undefined })}>
												<Trash2 {...ICON} />
											</IconButton>
										) : (
											<Button
												size='2xs'
												variant='outline'
												disabled={!fields.length}
												onClick={() => set(i, { showIf: { field: fields[0]?.key || '', operator: OPS_BY_KIND[kindOf(fields[0])][0] } })}>
												<Plus {...ICON} />
												Show only when…
											</Button>
										)}
									</Flex>
								</Flex>

								{sec.showIf && (
									<Box mt={2.5}>
										{ui && ui.conditions.length > 1 && (
											<Flex
												gap={1}
												mb={2}
												pl={5}>
												{(['all', 'any'] as const).map(m => (
													<Button
														key={m}
														size='2xs'
														variant={ui.mode === m ? 'solid' : 'outline'}
														onClick={() => set(i, { showIf: fromUi({ ...ui, mode: m }) })}>
														{m === 'all' ? 'all of these' : 'any of these'}
													</Button>
												))}
											</Flex>
										)}
										{ui ? (
											<RuleConditions
												ui={ui}
												onChange={next => set(i, { showIf: next.conditions.length ? fromUi(next) : undefined })}
												choices={fields}
												byKey={byKey}
											/>
										) : (
											<Text
												fontSize='xs'
												color='fg.muted'>
												Nested conditions — edit them in the source.
											</Text>
										)}
										<Text
											mt={2}
											fontSize='xs'
											color={problems.length ? 'red.fg' : 'fg.muted'}>
											{problems.length
												? problems.join(' · ')
												: `Shown when ${describeRule(sec.showIf, labelOf, optionLabel)}.`}
										</Text>
									</Box>
								)}
							</Box>
						);
					})}
				</Flex>
			)}
		</Panel>
	);
};

/** Section conditions that should stop a save. */
export const viewSectionProblems = (sections: ViewSection[] | undefined, fields: RuleField[]) => {
	const byKey = new Map(fields.map(f => [f.key, f]));
	const out: string[] = [];
	(sections || []).forEach((sec, i) => {
		const ui = sec.showIf ? toUi(sec.showIf) : null;
		const bad = ui ? ui.conditions.map(c => conditionProblem(c, byKey)).filter(Boolean) : [];
		if (bad.length) out.push(`${nameOf(sec, i)}: ${bad[0]}`);
	});
	return out;
};

export default ViewSectionRulesPanel;
