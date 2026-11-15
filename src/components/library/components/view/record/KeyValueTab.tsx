'use client';

import { FC, useEffect, useState } from 'react';
import { Box, Button, Dialog, Flex, Portal, Text } from '@chakra-ui/react';
import { Pencil } from 'lucide-react';
import ModalFooter from '../../../modals/modal-components/CustomModalFooter';
import { radius } from '../../../config';
import { useGetByIdQuery, useUpdateByIdMutation } from '../../../store/services/commonApi';
import VKeyValue, { KvSection } from '../../../utils/inputs/VKeyValue';
import KeyValueSections from '../utils/render-view-item/KeyValueSections';
import GuideLink from '../../../tenant/GuideLink';
import { toaster } from '@/components/ui/toaster';

/**
 * A key-value field's own tab on a record's page (backend docs/key-values): its sections, and
 * "Edit <label>", a dialog with only that field — the rest of the record isn't touched.
 * The sections still follow the record's `from` field (a product's category), as in the full form.
 */

/** The record's key-value fields, in schema order: `{ key, label }`. */
export const keyValueFieldsOf = (schema: any): { key: string; label: string; field: any }[] =>
	Object.entries(schema || {})
		.filter(([, f]: any) => f?.type === 'keyvalue')
		.map(([key, f]: any) => ({ key, label: f?.label || f?.title || key, field: f }));

const filled = (v: any): KvSection[] => (Array.isArray(v) ? v.filter(s => s && Array.isArray(s.items) && s.items.length) : []);

type Props = { slug: string; id: string; fieldKey: string; label: string; field: any; schema: any; canEdit: boolean };

const KeyValueTab: FC<Props> = ({ slug, id, fieldKey, label, field, schema, canEdit }) => {
	const { data } = useGetByIdQuery({ path: slug, id });
	const doc = data?.doc || data;
	const saved = filled(doc?.[fieldKey]);
	const fromLabel = field?.kv?.from ? schema?.[field.kv.from]?.label || field.kv.from : '';

	const [open, setOpen] = useState(false);
	const [draft, setDraft] = useState<KvSection[]>([]);
	const [save, { isLoading }] = useUpdateByIdMutation();
	// Each opening starts from what's saved.
	useEffect(() => {
		if (open) setDraft(filled(doc?.[fieldKey]));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open]);

	const changed = JSON.stringify(draft) !== JSON.stringify(saved);

	const go = async () => {
		const res: any = await save({ path: slug, id, body: { [fieldKey]: draft }, invalidate: ['config', 'history'] });
		if ('error' in res) {
			toaster.create({ type: 'error', title: 'Didn’t save', description: res.error?.data?.message || undefined });
			return;
		}
		toaster.create({ type: 'success', title: `${label} saved` });
		setOpen(false);
	};

	return (
		<Flex
			direction='column'
			gap={4}
			w='full'>
			<Flex
				justify='space-between'
				align='center'
				gap={3}
				wrap='wrap'>
				<Text
					fontSize='13px'
					color='fg.muted'>
					{fromLabel ? `The sections come from this record’s ${fromLabel}.` : 'Sections of keys and their values.'}
				</Text>
				{canEdit && (
					<Button
						size='sm'
						variant='outline'
						onClick={() => setOpen(true)}>
						<Pencil size={14} />
						Edit {label.toLowerCase()}
					</Button>
				)}
			</Flex>

			{saved.length ? (
				<KeyValueSections value={saved} />
			) : (
				<Box
					borderWidth='1px'
					borderStyle='dashed'
					borderRadius='md'
					px={4}
					py={8}
					textAlign='center'>
					<Text
						fontSize='13px'
						color='fg.muted'>
						Nothing filled in yet{canEdit ? ` — use Edit ${label.toLowerCase()} to add the values.` : '.'}
					</Text>
				</Box>
			)}

			<Dialog.Root
				lazyMount
				unmountOnExit
				placement='center'
				size='lg'
				scrollBehavior='inside'
				open={open}
				onOpenChange={e => !e.open && !isLoading && setOpen(false)}>
				<Portal>
					<Dialog.Backdrop />
					<Dialog.Positioner px={4}>
						<Dialog.Content
							borderRadius={radius.MODAL}
							bg='bg.panel'
							borderWidth='1px'
							borderColor='border'>
							<Dialog.Header
								px={6}
								pt={5}
								pb={2}
								display='flex'
								justifyContent='space-between'
								alignItems='center'>
								<Dialog.Title fontSize='16px'>Edit {label.toLowerCase()}</Dialog.Title>
								<GuideLink section='key-values' />
							</Dialog.Header>
							<Dialog.Body
								px={6}
								pt={0}
								pb={5}>
								{doc && (
									<VKeyValue
										name={fieldKey}
										label={label}
										value={draft}
										onChange={e => setDraft(e.target.value)}
										kv={field?.kv}
										formData={doc}
										fromLabel={fromLabel}
										isDisabled={isLoading}
									/>
								)}
							</Dialog.Body>
							<ModalFooter>
								<Button
									size='sm'
									variant='outline'
									px={3}
									disabled={isLoading}
									onClick={() => setOpen(false)}>
									Cancel
								</Button>
								<Button
									size='sm'
									px={3}
									loading={isLoading}
									disabled={!changed}
									onClick={go}>
									Save
								</Button>
							</ModalFooter>
						</Dialog.Content>
					</Dialog.Positioner>
				</Portal>
			</Dialog.Root>
		</Flex>
	);
};

export default KeyValueTab;
