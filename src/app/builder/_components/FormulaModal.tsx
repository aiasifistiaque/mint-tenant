'use client';

import { FC, useEffect, useMemo, useState } from 'react';
import { Badge, Box, Button, CloseButton, Dialog, Flex, Grid, Input, Portal, Text } from '@chakra-ui/react';
import { Calculator, CheckCircle2, CircleAlert } from 'lucide-react';
import { AlertDialogContent, AlertDialogHeader, ModalFooter } from '@/components/library';
import DiscardButton from '@/components/library/components/buttons/DiscardButton';
import { Dropdown } from '@/components/library/cl';
import { FieldInfo, checkFormula, evaluate } from '@/components/library/functions/formula';
import FormulaEditor from './FormulaEditor';

/**
 * Writing a formula field's formula — `due = total - paid`. It's built by
 * clicking (FormulaEditor: fields, numbers, + − × ÷, If… go into the
 * formula's highlighted box), or typed once unlocked. Either way it's checked as it changes —
 * that it parses, that every name is a number field, that it doesn't use
 * itself — with the problem pointed at, and a small calculator to try it on
 * sample numbers. The server runs the same checks before it publishes.
 */

type Props = {
	isOpen: boolean;
	onClose: () => void;
	onSave: (formula: string) => void;
	/** The formula field, and what it's called. */
	fieldKey: string;
	fieldTitle?: string;
	formula: string;
	/** Every settings field, with whether it holds a number. */
	fields: FieldInfo[];
};

const FormulaModal: FC<Props> = ({ isOpen, onClose, onSave, fieldKey, fieldTitle, formula, fields }) => {
	const [text, setText] = useState(formula);
	const [typing, setTyping] = useState(false);
	const [sample, setSample] = useState<Record<string, string>>({});
	// A fresh editor each time it opens, from the saved formula.
	const [session, setSession] = useState(0);

	useEffect(() => {
		if (isOpen) {
			setText(formula);
			setSample({});
			setSession(n => n + 1);
		}
	}, [isOpen, formula]);

	const name = fieldTitle || fieldKey;
	const hasLists = fields.some(f => f.list);
	const hasLinks = fields.some(f => f.linked);
	const checked = useMemo(() => (text.trim() ? checkFormula(text, fields, fieldKey) : null), [text, fields, fieldKey]);
	const labelOf = (key: string) => fields.find(f => f.key === key)?.label || key;
	function labelOfList(key: string) {
		return fields.find(f => f.key === key)?.label || key;
	}
	const infoOf = (key: string) => fields.find(f => f.key === key);
	// The sample values by their full key, so a dotted one (tax.amount, billing.fee) is read as typed.
	// A yes / no field is tried as yes or no, so if(isVip, …) reads "no" as not holding.
	const yesNo = (r: string, v: string) => (!infoOf(r)?.numeric && /^(yes|true|no|false)$/i.test(v.trim()) ? /^(yes|true)$/i.test(v.trim()) : v);
	const tried = checked?.ok ? Object.fromEntries(checked.refs.map(r => [r, yesNo(r, sample[r] ?? '')])) : {};
	const result = checked?.ok && checked.tree ? evaluate(checked.tree, tried, tried) : null;

	const firstAt = checked?.errors.find(e => typeof e.at === 'number')?.at;

	return (
		<Dialog.Root
			size='xl'
			// Tall: the body scrolls, the buttons stay in view.
			scrollBehavior='inside'
			// Pinned to the top: it grows and shrinks as the formula is checked
			// (errors, "Try it"), and centred, the buttons moved under the pointer.
			placement='top'
			open={isOpen}
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
								<Calculator size={16} />
								Formula for {name}
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
								gap={4}>
								<Text
									fontSize='sm'
									color='fg.muted'>
									{name} is worked out from other fields each time a record is saved — it can&apos;t be typed
									in. Build it with the buttons: each one goes into the highlighted box of the formula below. An
									empty field counts as 0.
									{hasLists && ' A list’s rows are used through their total, average or number of rows.'}
									{hasLinks && ' A linked record’s numbers are read through the link (0 when none is picked).'}
								</Text>

								<FormulaEditor
									key={session}
									initial={formula}
									onText={(t, typed) => {
										setText(t);
										setTyping(typed);
									}}
									fields={fields}
									self={fieldKey}
									invalid={!!checked && !checked.ok}
								/>

								{/* Whether it works, and what it works out. */}
								<Box>
									{!checked ? null : !checked.ok ? (
										<Box mt={2}>
											{typing && typeof firstAt === 'number' && (
												<Box
													as='pre'
													fontFamily='mono'
													fontSize='xs'
													color='fg.muted'
													whiteSpace='pre'
													overflowX='auto'
													mb={1}>
													{text.replace(/\n/g, ' ')}
													{'\n'}
													<Box
														as='span'
														color='red.fg'>
														{' '.repeat(firstAt)}^
													</Box>
												</Box>
											)}
											{checked.errors.map((e, i) => (
												<Flex
													key={i}
													gap={1.5}
													align='flex-start'
													color='red.fg'
													fontSize='sm'>
													<Box mt='3px'>
														<CircleAlert size={14} />
													</Box>
													<Text>{e.message}</Text>
												</Flex>
											))}
										</Box>
									) : (
										<Flex
											mt={2}
											direction='column'
											gap={1.5}>
											<Flex
												gap={1.5}
												align='center'
												color='green.fg'
												fontSize='sm'>
												<CheckCircle2 size={14} />
												<Text>
													Valid —{' '}
													<Text
														as='span'
														fontFamily='mono'
														color='fg'>
														{fieldKey} = {checked.formatted}
													</Text>
												</Text>
											</Flex>
											{checked.refs.length > 0 && (
												<Flex
													gap={1}
													align='center'
													flexWrap='wrap'>
													<Text
														fontSize='xs'
														color='fg.muted'>
														Uses
													</Text>
													{checked.refs.map(r => (
														<Badge
															key={r}
															size='sm'
															variant='subtle'>
															{labelOf(r)}
														</Badge>
													))}
												</Flex>
											)}
										</Flex>
									)}
								</Box>

								{/* Try it on sample numbers. */}
								{checked?.ok && checked.refs.length > 0 && (
									<Box
										borderWidth='1px'
										borderColor='border.muted'
										borderRadius='md'
										p={3}>
										<Text
											fontSize='xs'
											fontWeight='600'
											mb={2}>
											Try it
										</Text>
										<Grid
											templateColumns='repeat(auto-fill, minmax(140px, 1fr))'
											gap={2}>
											{checked.refs.map(r => (
												<Box key={r}>
													<Text
														fontSize='11px'
														color='fg.muted'
														mb={1}
														truncate>
														{infoOf(r)?.inList ? `${labelOf(r)}, each row` : infoOf(r)?.list ? `Rows in ${labelOf(r)}` : labelOf(r)}
													</Text>
													{infoOf(r)?.options?.length || infoOf(r)?.yesNo ? (
														<Dropdown
															size='xs'
															placeholder='Pick one'
															value={sample[r] ?? ''}
															onChange={(v: string) => setSample(s => ({ ...s, [r]: v }))}>
															{(infoOf(r)?.yesNo
																? [
																		{ value: 'yes', label: 'Yes' },
																		{ value: 'no', label: 'No' },
																  ]
																: infoOf(r)!.options!.map(o => ({ value: String(o.value), label: String(o.label ?? o.value) }))
															).map(o => (
																<option
																	key={o.value}
																	value={o.value}>
																	{o.label}
																</option>
															))}
														</Dropdown>
													) : (
														<Input
															size='xs'
															type={infoOf(r)?.inList || !infoOf(r)?.numeric ? 'text' : 'number'}
															placeholder={infoOf(r)?.inList ? '5, 3, 2' : infoOf(r)?.numeric || infoOf(r)?.list ? '0' : 'its value'}
															value={sample[r] ?? ''}
															onChange={e => setSample(s => ({ ...s, [r]: e.target.value }))}
														/>
													)}
												</Box>
											))}
										</Grid>
										<Text
											mt={2.5}
											fontSize='sm'>
											{name} ={' '}
											<Text
												as='span'
												fontWeight='600'
												fontFamily='mono'>
												{result === null ? 'empty (divides by 0)' : result.toLocaleString(undefined, { maximumFractionDigits: 10 })}
											</Text>
										</Text>
									</Box>
								)}
							</Flex>
						</Dialog.Body>

						<ModalFooter>
							<DiscardButton onClick={onClose}>Cancel</DiscardButton>
							<Button
								size='sm'
								px={3}
								disabled={!checked?.ok}
								onClick={() => checked?.formatted && onSave(checked.formatted)}>
								Save formula
							</Button>
						</ModalFooter>
					</AlertDialogContent>
				</Dialog.Positioner>
			</Portal>
		</Dialog.Root>
	);
};

export default FormulaModal;
