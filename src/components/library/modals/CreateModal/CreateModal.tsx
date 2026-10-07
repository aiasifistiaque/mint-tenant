'use client';

import React, { FormEvent, KeyboardEvent, useEffect, useState } from 'react';
import { Box, Button, Flex, Kbd, Skeleton, Text, useDisclosure } from '@chakra-ui/react';
import { Pencil, Plus } from 'lucide-react';

import { useCustomToast, useIsMobile, useFormData } from '../../hooks';

import {
	ModalFormSection,
	usePostMutation,
	useUpdateByIdMutation,
	FormMain,
	useLazyGetByIdToEditQuery,
	DiscardButton,
	DialogCloseButton,
	DialogHeader,
	DialogFooter,
	Dialog,
	DialogBody,
	useGetSchemaQuery,
	convertToFormFields,
	createFormFields,
	MenuItem,
} from '../..';
import { styles } from '../../config';

import CreateModalProps from './types';
import { withoutHidden } from '../../functions/formRules';
import { mutedForUpdate } from '../../functions/fieldLocks';

/** 'invoice-items' -> 'invoice item', for "Edit invoice item". */
export const nounOf = (path?: string) => {
	const words = String(path || 'record')
		.replace(/[-_]+/g, ' ')
		.trim()
		.toLowerCase();
	if (/ies$/.test(words)) return words.replace(/ies$/, 'y');
	if (/(ss|us)$/.test(words)) return words;
	return words.replace(/s$/, '');
};

/** 'Customers' -> 'Customer', 'Categories' -> 'Category' — a page's title as one of its records, case kept. */
export const singularOf = (title?: string) => {
	const t = String(title || '').trim();
	if (/ies$/i.test(t)) return t.replace(/ies$/i, m => (m === 'IES' ? 'Y' : 'y'));
	if (/(ss|us|is)$/i.test(t)) return t;
	return t.replace(/s$/i, '');
};

/** How a record is named in the header: its code and its name, when it has them. */
export const recordLabel = (doc: any) => {
	if (!doc || typeof doc !== 'object') return '';
	const name = doc.name || doc.title || doc.label || doc.email || '';
	const code = doc.code || doc.invoiceId || '';
	return [code, name].filter(Boolean).join(' · ');
};

/** "5 minutes ago", "3 days ago" — how fresh the record being edited is. */
export const ago = (value?: string | number | Date) => {
	const t = value ? new Date(value).getTime() : NaN;
	if (!Number.isFinite(t)) return '';
	const s = Math.round((t - Date.now()) / 1000);
	const units: [Intl.RelativeTimeFormatUnit, number][] = [
		['year', 31536000],
		['month', 2592000],
		['day', 86400],
		['hour', 3600],
		['minute', 60],
	];
	const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
	for (const [unit, size] of units) if (Math.abs(s) >= size) return rtf.format(Math.round(s / size), unit);
	return 'just now';
};

/** The record's status beside the title — a quiet pill, not a coloured badge. */
export const StatusPill = ({ value }: { value?: any }) =>
	typeof value === 'string' && value && value.length <= 24 ? (
		<Box
			as='span'
			flexShrink={0}
			px={2}
			py='1px'
			borderWidth='1px'
			borderColor='border'
			borderRadius='full'
			bg='bg.subtle'
			color='fg.muted'
			fontSize='11px'
			fontWeight='500'
			lineHeight='18px'
			textTransform='capitalize'>
			{value.replace(/[-_]+/g, ' ')}
		</Box>
	) : null;

/** ⌘ on a Mac, Ctrl elsewhere. */
const MOD = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl';

/**
 * The left of a form dialog's footer: how many fields changed (or which are
 * required, on a new record) and the save shortcut.
 */
export const FooterStatus = ({ isUpdate, changes = 0 }: { isUpdate?: boolean; changes?: number }) => (
	<Flex
		mr='auto'
		align='center'
		gap={2}
		fontSize='xs'
		color='fg.muted'
		minW={0}>
		{isUpdate ? (
			<>
				<Box
					w='6px'
					h='6px'
					borderRadius='full'
					flexShrink={0}
					bg={changes ? 'orange.400' : 'border.emphasized'}
				/>
				<Text
					color={changes ? 'fg' : 'fg.muted'}
					truncate>
					{changes ? `${changes} unsaved change${changes === 1 ? '' : 's'}` : 'No changes yet'}
				</Text>
			</>
		) : (
			<Text truncate>
				Fields marked{' '}
				<Text
					as='span'
					color='red.500'>
					*
				</Text>{' '}
				are required
			</Text>
		)}
		<Flex
			align='center'
			gap={1}
			ml={2}
			display={{ base: 'none', lg: 'flex' }}
			color='fg.subtle'>
			<Kbd size='sm'>{MOD}</Kbd>
			<Kbd size='sm'>Enter</Kbd>
			<Text as='span'>to save</Text>
		</Flex>
	</Flex>
);

/**
 * A form dialog's keys: Enter alone doesn't submit (it's easy to hit mid-form)
 * but still makes a new line in a textarea; ⌘/Ctrl+Enter saves from anywhere.
 */
export const formKeys = (canSave: boolean) => (e: KeyboardEvent<HTMLFormElement>) => {
	if (e.key !== 'Enter') return;
	if (e.metaKey || e.ctrlKey) {
		e.preventDefault();
		if (canSave) e.currentTarget.requestSubmit();
		return;
	}
	if ((e.target as HTMLElement)?.tagName !== 'TEXTAREA') e.preventDefault();
};

/** Placeholder rows while the record loads, instead of an empty form. */
export const FormSkeleton = () => (
	<Flex
		direction='column'
		gap={5}
		py={2}>
		<Skeleton
			h='14px'
			w='120px'
		/>
		{[0, 1, 2].map(i => (
			<Flex
				key={i}
				gap={4}>
				<Box flex={1}>
					<Skeleton
						h='12px'
						w='80px'
						mb={2}
					/>
					<Skeleton h='36px' />
				</Box>
				<Box flex={1}>
					<Skeleton
						h='12px'
						w='80px'
						mb={2}
					/>
					<Skeleton h='36px' />
				</Box>
			</Flex>
		))}
	</Flex>
);

const CreateModal = (props: CreateModalProps) => {
	const {
		data,
		trigger,
		path,
		title,
		type,
		id,
		isMenu,
		invalidate,
		children,
		doc,
		prompt,
		populate,
		layout,
		icon,
		open: controlledOpen,
		onClose: onControlledClose,
	} = props;

	// Controlled mode (see types.tsx): when `open` is passed, this dialog is
	// rendered by the caller outside its own trigger's lifecycle — no internal
	// trigger, no internal open state.
	const isControlled = controlledOpen !== undefined;
	const { open: internalOpen, onOpen, onClose: internalOnClose } = useDisclosure();
	const isOpen = isControlled ? controlledOpen : internalOpen;

	const [fetch, { data: prevData, isFetching, isUninitialized }] = useLazyGetByIdToEditQuery();
	const [formData, setFormData] = useFormData<any>(data, populate || prevData);
	const isMobile = useIsMobile();

	const [callApi, result] = usePostMutation();
	const [updateApi, updateResult] = useUpdateByIdMutation();

	const [schema, setSchema] = useState<any>([]);

	const { data: schemaData, isFetching: schemaLoading } = useGetSchemaQuery(path, {
		skip: !layout,
	});

	const initializeForm = () => {
		let newFieldData = {};

		data?.map(field => {
			if (field?.getValue) newFieldData = { ...newFieldData, [field.name]: field?.getValue(doc) };
			if (field?.value) newFieldData = { ...newFieldData, [field.name]: field?.value };
		});

		setFormData((prev: any) => ({ ...prev, ...newFieldData }));
		if (type == 'update') {
			if (populate) {
				setFormData(populate);
				return;
			}
			fetch({ path, id });
		}
	};

	// Uncontrolled path: the trigger's onClick calls this directly.
	const onModalOpen = () => {
		onOpen();
		initializeForm();
	};

	// Controlled path: there's no trigger onClick to hang initialization off
	// of, so run it whenever the caller flips `open` to true.
	useEffect(() => {
		if (isControlled && controlledOpen) initializeForm();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isControlled, controlledOpen]);

	const { isSuccess, isLoading } = type === 'update' ? updateResult : result;

	const [changedData, setChangedData] = useState({});

	useEffect(() => {
		if (schemaData) {
			if (layout) {
				let newFieldData = {};
				const fields = convertToFormFields({ schema: schemaData, layout: layout });
				setSchema(fields);
				fields?.map(field => {
					if (field?.getValue)
						newFieldData = { ...newFieldData, [field.name]: field?.getValue(doc) };
					if (field?.value) newFieldData = { ...newFieldData, [field.name]: field?.value };
				});

				setFormData({ ...formData, ...newFieldData });
			} else {
				setSchema(data);
			}
		}
	}, [schemaLoading]);

	const successText = prompt?.successMsg
		? prompt?.successMsg
		: type == 'update'
		? 'Information Updated Successfully'
		: 'Item added successfully';

	useCustomToast({
		successText,
		...result,
	});

	useCustomToast({
		successText,
		...updateResult,
	});

	const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		e.stopPropagation();

		let findExcludedFields: any = [];

		if (layout) {
			const fields: any = convertToFormFields({ schema: schemaData, layout: layout });
			findExcludedFields = fields.filter((field: any) => field?.isExcluded);
		} else {
			findExcludedFields = data.filter((field: any) => field?.isExcluded);
		}

		const toPostData = { ...formData };

		// Remove excluded fields from toPostData
		findExcludedFields.forEach((field: any) => {
			if (field.name in toPostData) delete toPostData[field.name];
		});

		// Fields hidden by their conditions aren't sent (the server drops them too).
		const shownFields = layout ? convertToFormFields({ schema: schemaData, layout: layout }) : data;
		if (type === 'update')
			updateApi({ path, id: id || 'id', body: withoutHidden(changedData, shownFields, formData), invalidate });
		else callApi({ path, body: withoutHidden(toPostData, shownFields, formData), invalidate });
	};

	const onModalClose = () => {
		setFormData({});
		result.reset();
		if (isControlled) onControlledClose?.();
		else internalOnClose();
	};

	useEffect(() => {
		if (isLoading) return;
		if (isSuccess) onModalClose();
	}, [isLoading]);

	useEffect(() => {
		if (populate) return;
		if (prevData) setFormData(prevData);
	}, [prevData, isFetching]);

	const isUpdate = type === 'update';
	const changes = Object.keys(changedData || {}).length;
	const loadingRecord = isUpdate && !populate && (isFetching || isUninitialized) && !prevData;
	// Nothing to send: an update only sends the fields that changed.
	const saveDisabled = loadingRecord || (isUpdate && changes === 0);

	// A generic "Edit" / "Update" from a menu says less than "Edit invoice".
	const genericTitle = !title || ['edit', 'update', 'create', 'add'].includes(String(title).toLowerCase());
	const heading =
		prompt?.title || (genericTitle ? `${isUpdate ? 'Edit' : 'New'} ${nounOf(path)}` : title);
	const record = prevData || populate || doc;
	// Editing: what this record can't change (locked by its state, or never after
	// it's created) shows muted with the reason — the server refuses it anyway.
	const muted = (fields: any[]) => (isUpdate && record ? mutedForUpdate(fields, record) : fields);
	const updated = isUpdate ? ago(record?.updatedAt) : '';
	const subheading = isUpdate
		? [recordLabel(record), updated && `Updated ${updated}`].filter(Boolean).join(' · ')
		: undefined;

	const footer = (
		<>
			{!isMobile && (
				<FooterStatus
					isUpdate={isUpdate}
					changes={changes}
				/>
			)}
			{!isMobile && (
				<DiscardButton
					disabled={isLoading}
					onClick={onModalClose}>
					Cancel
				</DiscardButton>
			)}
			<Button
				{...(styles.MODAL_BUTTON as any)}
				{...(isMobile && { w: 'full' })}
				type='submit'
				disabled={saveDisabled}
				loading={isLoading}
				loadingText={isUpdate ? 'Saving' : 'Creating'}
				spinnerPlacement='start'>
				{prompt?.btnText || (isUpdate ? 'Save changes' : `Create ${nounOf(path)}`)}
			</Button>
		</>
	);

	return (
		<>
			{isControlled ? null : isMenu ? (
				<MenuItem
					asChild
					icon={icon}
					onClick={onModalOpen}>
					{children || trigger || title || path}
				</MenuItem>
			) : (
				<Flex onClick={onModalOpen}>{children || trigger || title || path}</Flex>
			)}

			<Dialog
				isOpen={isOpen}
				onClose={onModalClose}>
				<form
					onSubmit={handleSubmit}
					onKeyDown={formKeys(!saveDisabled && !isLoading)}>
					<DialogHeader
						divider
						icon={isUpdate ? <Pencil size={17} strokeWidth={1.75} /> : <Plus size={18} strokeWidth={1.75} />}
						badge={isUpdate && <StatusPill value={record?.status} />}
						description={subheading || prompt?.description || undefined}>
						{heading}
					</DialogHeader>
					<DialogCloseButton top={{ base: 4, md: 5 }} />

					<DialogBody pt={{ base: 4, md: 5 }}>
						<ModalFormSection>
							{loadingRecord ? (
								<FormSkeleton />
							) : layout ? (
								!schemaLoading && (
									<>
										<FormMain
											fields={muted(createFormFields({ schema: schemaData, layout }))}
											formData={formData}
											setFormData={setFormData}
											setChangedData={setChangedData}
											isModal={true}
										/>
									</>
								)
							) : (
								<FormMain
									fields={muted(data)}
									formData={formData}
									setFormData={setFormData}
									setChangedData={setChangedData}
									isModal={true}
								/>
							)}
						</ModalFormSection>
					</DialogBody>
					{/* Pinned under the form on every screen; on a phone it holds the one
					    full-width primary button, inset like the fields above it. */}
					<DialogFooter>{footer}</DialogFooter>
				</form>
			</Dialog>
		</>
	);
};

export default CreateModal;
