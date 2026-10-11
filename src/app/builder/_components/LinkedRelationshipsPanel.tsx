'use client';

import { FC, useState } from 'react';
import { Badge, Box, Button, Flex, IconButton, Text } from '@chakra-ui/react';
import { ArrowLeftRight, Link2, Pencil, Plus, Trash2 } from 'lucide-react';
import { PromptDialog, useGetIncomingLinkedQuery } from '@/components/library';
import { Panel } from '@/components/library/cl';
import { ModelField } from './filterTypes';
import { SettingsField } from './SettingsEditor';
import { DocLink } from './ui';
import { ToneTitle } from './areas';
import LinkedRuleDialog from './LinkedRuleDialog';
import { LinkedRule, cleanRule, newRule, ruleProblems, ruleSentence } from './linkedRules';

/**
 * The Linked Relationships tab: this page's rules that change the records its
 * records pick (a payment marking its invoice paid), each shown as the
 * sentence it reads as, and — read only — the rules on other pages that
 * change this page's records. Rules are part of the page's config: they're
 * saved with the draft and go live when the page is published.
 */

type Props = {
	route: string;
	title: string;
	rules: LinkedRule[];
	onChange: (rules: LinkedRule[]) => void;
	fields: SettingsField[];
	modelFields: ModelField[];
	disabled?: boolean;
	/** Off in the model wizard: a page that doesn't exist yet has nothing pointing at it. */
	showIncoming?: boolean;
};

const labelOf = (fields: SettingsField[], key: string) => {
	const f = fields.find(x => x.key === key);
	return f?.schema?.label || f?.title || key;
};

/** Problems the editor holds a save back for, across every rule. */
export const linkedProblems = (rules: LinkedRule[] = []) => rules.flatMap(ruleProblems);

const LinkedRelationshipsPanel: FC<Props> = ({ route, title, rules, onChange, fields, modelFields, disabled, showIncoming = true }) => {
	const [editing, setEditing] = useState<{ index: number; rule: LinkedRule } | null>(null);
	const [removing, setRemoving] = useState<number | null>(null);
	const { data: incoming } = useGetIncomingLinkedQuery(route, { skip: !route || !showIncoming });

	// Labels of the linked page aren't loaded here: the card names its fields by key, the dialog by label.
	const sentence = (r: LinkedRule) => {
		const via = fields.find(f => f.key === r.target.via);
		return ruleSentence(r, { self: k => labelOf(fields, k), target: k => k, title, targetTitle: via?.schema?.label || via?.title || 'record' });
	};

	const save = (rule: LinkedRule) => {
		const clean = cleanRule(rule);
		onChange(editing && editing.index >= 0 ? rules.map((r, i) => (i === editing.index ? clean : r)) : [...rules, clean]);
		setEditing(null);
	};

	return (
		<Flex
			direction='column'
			gap={5}>
			<Panel
				title={
					<ToneTitle
						icon={Link2}
						palette='green'>
						This page changes…
					</ToneTitle>
				}
				subtitle={`Rules that run when a ${title} is saved, and change the records it picks.`}
				actions={<DocLink section='linked-relationships' />}>
				<Flex
					direction='column'
					gap={3}>
					{!rules.length && (
						<Text
							fontSize='sm'
							color='fg.muted'>
							No rules yet. Example: when a payment is added with “Mark as paid” ticked, set its invoice’s status to Paid
							and copy the payment date there.
						</Text>
					)}
					{rules.map((r, i) => {
						const problems = ruleProblems(r);
						return (
							<Flex
								key={r.id || i}
								gap={3}
								align='flex-start'
								px={3}
								py={2.5}
								borderWidth='1px'
								borderColor={problems.length ? 'border.warning' : 'border'}
								borderRadius='md'
								opacity={r.enabled === false ? 0.6 : 1}>
								<Box
									flex='1'
									minW={0}>
									<Flex
										align='center'
										gap={2}
										mb={1}>
										<Text
											fontSize='sm'
											fontWeight='600'>
											{r.name || 'Untitled rule'}
										</Text>
										{r.enabled === false && <Badge size='sm'>Off</Badge>}
										{r.block && (
											<Badge
												size='sm'
												colorPalette='red'>
												Refuses
											</Badge>
										)}
										{r.fromApi && (
											<Badge
												size='sm'
												colorPalette='purple'>
												Website saves too
											</Badge>
										)}
										{r.asSystem && (
											<Badge
												size='sm'
												colorPalette='orange'>
												Allowed anyway
											</Badge>
										)}
									</Flex>
									<Text
										fontSize='sm'
										color='fg.muted'>
										{sentence(r)}
									</Text>
									{problems.length > 0 && (
										<Text
											fontSize='xs'
											color='orange.fg'
											mt={1}>
											{problems.map(p => p.replace(/^[^:]*: /, '')).join(' · ')}
										</Text>
									)}
								</Box>
								<IconButton
									aria-label='Edit this rule'
									size='xs'
									variant='ghost'
									disabled={disabled}
									onClick={() => setEditing({ index: i, rule: r })}>
									<Pencil size={14} />
								</IconButton>
								<IconButton
									aria-label='Delete this rule'
									size='xs'
									variant='ghost'
									disabled={disabled}
									onClick={() => setRemoving(i)}>
									<Trash2 size={14} />
								</IconButton>
							</Flex>
						);
					})}
					<Box>
						<Button
							size='sm'
							variant='outline'
							disabled={disabled}
							onClick={() => setEditing({ index: -1, rule: newRule() })}>
							<Plus size={14} /> Add a rule
						</Button>
					</Box>
				</Flex>
			</Panel>

			{showIncoming && (
				<Panel
					title={
						<ToneTitle
							icon={ArrowLeftRight}
							palette='green'>
							Changed by…
						</ToneTitle>
					}
					subtitle='Rules on other pages that change this page’s records. Edit them on those pages.'>
					{incoming?.doc?.length ? (
						<Flex
							direction='column'
							gap={1.5}>
							{incoming.doc.map((x, i) => (
								<Text
									key={i}
									fontSize='sm'>
									<strong>{x.title}</strong> — “{x.rule}”{' '}
									<Text
										as='span'
										color='fg.muted'>
										{x.block ? 'can refuse a save' : `can change ${x.fields.join(', ') || 'nothing yet'}`} (through its {x.via})
									</Text>
								</Text>
							))}
						</Flex>
					) : (
						<Text
							fontSize='sm'
							color='fg.muted'>
							No published rule on another page changes these records.
						</Text>
					)}
				</Panel>
			)}

			<Text
				fontSize='xs'
				color='fg.muted'>
				Totals that must always be right — amount paid, balance — are better as a rollup or a formula in Fields &amp; rules:
				worked out when read, they can’t drift. Use a linked relationship for a change that happens once — a status, a
				date, stock taken off.
			</Text>

			{editing && (
				<LinkedRuleDialog
					open
					onClose={() => setEditing(null)}
					onSave={save}
					rule={editing.rule}
					title={title}
					fields={fields}
					modelFields={modelFields}
				/>
			)}
			<PromptDialog
				open={removing !== null}
				onClose={() => setRemoving(null)}
				onConfirm={() => {
					onChange(rules.filter((_, i) => i !== removing));
					setRemoving(null);
				}}
				tone='danger'
				title='Delete this rule?'
				subject={removing !== null ? rules[removing]?.name || 'Untitled rule' : undefined}
				description='It stops running once the page is published. Changes it already made stay as they are.'
			/>
		</Flex>
	);
};

export default LinkedRelationshipsPanel;
