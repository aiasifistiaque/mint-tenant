'use client';

import { FC, useEffect, useMemo, useState } from 'react';
import { Badge, Box, Button, CloseButton, Dialog, Flex, Input, Portal, Text } from '@chakra-ui/react';
import { AlertDialogContent, AlertDialogHeader, ModalFooter } from '@/components/library';
import DiscardButton from '@/components/library/components/buttons/DiscardButton';
import { DocLink } from '@/app/builder/_components/ui';
import FieldsEditor from './FieldsEditor';
import { EditableField, SUB_KINDS, validateFields } from './modelKinds';

/**
 * The fields of a Section or Section list — the model builder's own field
 * editor, one level down. A new section starts from a preset (title /
 * description / image, or an invoice line for a list) that can be changed
 * freely. Edits are staged here and only reach the model on Save.
 *
 * A list's number fields can be added up by the model's formulas —
 * sum(items.total) — and a row's formula fields are calculated from the
 * other values of the same row.
 */

type Props = {
	isOpen: boolean;
	onClose: () => void;
	field?: EditableField;
	onSave: (patch: Pick<EditableField, 'fields' | 'addLabel'>) => void;
	/**
	 * The row (or section) paths the model stores, when it's fixed — a code
	 * model's sub-schema, edited from the route builder. A field outside it
	 * would be dropped on save, so it's refused; a formula needs a number.
	 */
	stored?: { key: string; instance?: string }[];
};

const SectionFieldsModal: FC<Props> = ({ isOpen, onClose, field, onSave, stored }) => {
	const [fields, setFields] = useState<EditableField[]>([]);
	const [addLabel, setAddLabel] = useState('');
	const [tried, setTried] = useState(false);

	useEffect(() => {
		if (isOpen && field) {
			setFields(field.fields || []);
			setAddLabel(field.addLabel || '');
			setTried(false);
		}
	}, [isOpen, field]);

	const errors = useMemo(() => {
		const found = validateFields(fields, { sub: true });
		if (!stored) return found;
		const byKey = new Map(stored.map(x => [x.key, x]));
		for (const f of fields) {
			if (found[f.uid] || !f.key) continue;
			const path = byKey.get(f.key);
			if (!path)
				found[f.uid] = {
					on: 'key',
					message: `The model doesn’t store “${f.key}” — use one of ${stored.map(x => x.key).join(', ')}`,
				};
			else if ((f.kind === 'formula' || f.kind === 'number') && path.instance && path.instance !== 'Number')
				found[f.uid] = { on: 'key', message: `The model stores “${f.key}” as ${String(path.instance).toLowerCase()}, not a number` };
		}
		return found;
	}, [fields, stored]);
	const isList = field?.kind === 'sectionlist';
	const name = field?.label || field?.key || 'Section';
	const key = field?.key || 'items';
	const numbers = fields.filter(f => f.key && (f.kind === 'number' || f.kind === 'formula'));

	const save = () => {
		setTried(true);
		if (!fields.length || Object.keys(errors).length) return;
		onSave({ fields, addLabel: isList ? addLabel.trim() || undefined : undefined });
	};

	return (
		<Dialog.Root
			open={isOpen}
			onOpenChange={e => !e.open && onClose()}
			size='xl'
			placement='center'
			scrollBehavior='inside'>
			<Portal>
				<Dialog.Backdrop />
				<Dialog.Positioner>
					<AlertDialogContent maxW='960px'>
						<AlertDialogHeader>
							{isList ? 'Fields of each row' : 'Fields of the section'} — {name}
						</AlertDialogHeader>
						<Dialog.CloseTrigger
							asChild
							top={3}
							right={3}>
							<CloseButton size='sm' />
						</Dialog.CloseTrigger>

						<Dialog.Body p={4}>
							<Flex
								direction='column'
								gap={4}>
								<Text
									fontSize='sm'
									color='fg.muted'>
									{isList
										? 'Each row of the list has these fields; the form adds rows with them. A formula field here is calculated from the other values of the same row — total = quantity * rate.'
										: 'The section is filled in once per record, with these fields. Its number fields can be used by the model’s formulas as '}
									{!isList && (
										<Text
											as='span'
											fontSize='inherit'
											fontFamily='mono'>
											{key}.field
										</Text>
									)}
									{!isList && '.'}{' '}
									<DocLink section='models-sections' />
								</Text>

								{stored && (
									<Text
										fontSize='xs'
										color='fg.muted'>
										This model is defined in code: its {isList ? 'rows' : 'section'} can hold{' '}
										<Text
											as='span'
											fontSize='inherit'
											fontFamily='mono'>
											{stored.map(x => x.key).join(', ')}
										</Text>
										. Relabel, reorder, change inputs or make a number a formula here; a new field needs the model changed first.
									</Text>
								)}

								<FieldsEditor
									fields={fields}
									onChange={setFields}
									errors={tried ? errors : {}}
									targets={[]}
									kinds={SUB_KINDS}
									sub
								/>

								{isList && (
									<Box maxW='320px'>
										<Text
											fontSize='xs'
											fontWeight='600'
											mb={1.5}>
											Add button
										</Text>
										<Input
											size='sm'
											placeholder='Add row'
											value={addLabel}
											onChange={e => setAddLabel(e.target.value)}
										/>
									</Box>
								)}

								{isList && numbers.length > 0 && (
									<Flex
										gap={1.5}
										align='center'
										flexWrap='wrap'
										fontSize='xs'
										color='fg.muted'>
										<Text>In the model’s formulas:</Text>
										{numbers.map(f => (
											<Badge
												key={f.uid}
												size='sm'
												variant='subtle'
												fontFamily='mono'>
												sum({key}.{f.key})
											</Badge>
										))}
										<Badge
											size='sm'
											variant='subtle'
											fontFamily='mono'>
											count({key})
										</Badge>
									</Flex>
								)}

								{tried && !fields.length && (
									<Text
										fontSize='sm'
										color='red.fg'>
										Add at least one field.
									</Text>
								)}
							</Flex>
						</Dialog.Body>

						<ModalFooter>
							<DiscardButton onClick={onClose}>Cancel</DiscardButton>
							<Button
								size='sm'
								px={3}
								onClick={save}>
								Save fields
							</Button>
						</ModalFooter>
					</AlertDialogContent>
				</Dialog.Positioner>
			</Portal>
		</Dialog.Root>
	);
};

export default SectionFieldsModal;
