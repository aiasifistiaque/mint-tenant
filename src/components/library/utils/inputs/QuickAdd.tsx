'use client';
import { FC, FormEvent, KeyboardEvent, useEffect, useId, useState } from 'react';
import { Button, CloseButton, Dialog, IconButton, Portal, Spinner, Text } from '@chakra-ui/react';
import { Plus } from 'lucide-react';
import { FormMain, ModalFooter, radius, useGetConfigQuery, usePostMutation } from '../..';
import { useCustomToast } from '../../hooks';
import { Tooltip } from '@/components/ui/tooltip';

type Props = {
	/** The linked model's route, e.g. "categories". */
	model: string;
	/** What one record is called, for the tooltip and the title: "Category". */
	label?: string;
	/** Values the new record starts with (the picker's conditions). */
	prefill?: Record<string, any>;
	disabled?: boolean;
	/** The record as saved — the picker selects it. */
	onCreated: (doc: any) => void;
};

/**
 * The + beside a record picker: a modal with the linked model's create form.
 * Saved, the new record is handed back to the picker, which selects it.
 *
 * Portalled, but React events still bubble up the component tree — so the
 * submit stops here and doesn't also submit the form the picker sits in.
 */
const QuickAdd: FC<Props> = ({ model, label, prefill, disabled, onCreated }) => {
	const [open, setOpen] = useState(false);
	const { data, isFetching, isError } = useGetConfigQuery(model, { skip: !open || !model });
	const [formData, setFormData] = useState<any>({});
	const [, setChangedData] = useState<any>({});
	const [callApi, result] = usePostMutation();
	const formId = `quick-add-${useId()}`;
	const name = label || 'record';

	useCustomToast({ successText: `${name} added`, ...result });

	// The form's own defaults, then the picker's conditions — set once the form is known.
	useEffect(() => {
		if (!open || !data?.form) return;
		const defaults: any = {};
		for (const f of data.form) if (f?.value !== undefined) defaults[f.name] = f.value;
		setFormData({ ...defaults, ...(prefill || {}) });
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open, data]);

	useEffect(() => {
		if (!result.isSuccess || result.isLoading) return;
		const doc = result.data?.doc;
		if (doc) onCreated(doc);
		setOpen(false);
		result.reset();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [result.isSuccess, result.isLoading]);

	const submit = (e: FormEvent) => {
		e.preventDefault();
		e.stopPropagation();
		const body = { ...formData };
		for (const f of data?.form || []) if (f?.isExcluded) delete body[f.name];
		callApi({ path: model, body });
	};

	// Enter in a text input would submit half a record.
	const keyDown = (e: KeyboardEvent<HTMLFormElement>) => {
		if (e.key === 'Enter' && (e.target as HTMLElement)?.tagName === 'INPUT') e.preventDefault();
	};

	return (
		<>
			<Tooltip
				content={`Add a new ${name.toLowerCase()}`}
				openDelay={300}>
				<IconButton
					type='button'
					size='sm'
					variant='outline'
					flexShrink={0}
					aria-label={`Add a new ${name.toLowerCase()}`}
					disabled={disabled || !model}
					onClick={() => setOpen(true)}>
					<Plus size={16} />
				</IconButton>
			</Tooltip>

			<Dialog.Root
				size='lg'
				placement='center'
				scrollBehavior='inside'
				open={open}
				onOpenChange={e => {
					if (!e.open) {
						setOpen(false);
						result.reset();
					}
				}}>
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
								pb={{ base: 3, md: 4 }}
								pr={12}>
								<Dialog.Title fontSize='16px'>New {name.toLowerCase()}</Dialog.Title>
							</Dialog.Header>
							<Dialog.CloseTrigger
								asChild
								top={3}
								right={3}>
								<CloseButton size='sm' />
							</Dialog.CloseTrigger>
							<Dialog.Body
								px={{ base: 4, md: 6 }}
								pt={0}
								pb={{ base: 4, md: 5 }}>
								<form
									id={formId}
									onSubmit={submit}
									onKeyDown={keyDown}>
									{isFetching || !data ? (
										isError ? (
											<Text
												fontSize='sm'
												color='red.fg'>
												Couldn&apos;t load the form for {model}.
											</Text>
										) : (
											<Spinner size='sm' />
										)
									) : (
										<FormMain
											fields={data?.form || []}
											formData={formData}
											setFormData={setFormData}
											setChangedData={setChangedData}
											isModal={true}
										/>
									)}
								</form>
							</Dialog.Body>
							<ModalFooter>
								<Button
									size='sm'
									px={3}
									variant='outline'
									disabled={result.isLoading}
									onClick={() => setOpen(false)}>
									Cancel
								</Button>
								<Button
									size='sm'
									px={3}
									type='submit'
									form={formId}
									disabled={!data?.form}
									loading={result.isLoading}
									loadingText='Adding'>
									Add {name.toLowerCase()}
								</Button>
							</ModalFooter>
						</Dialog.Content>
					</Dialog.Positioner>
				</Portal>
			</Dialog.Root>
		</>
	);
};

export default QuickAdd;
