'use client';

import { FC, useEffect, useState } from 'react';
import { Flex, Grid, Input, Text } from '@chakra-ui/react';
import { Puzzle } from 'lucide-react';
import { PromptDialog, useMakeSectionReusableMutation } from '@/components/library';
import GuideLink from '@/components/library/tenant/GuideLink';
import { toaster } from '@/components/ui/toaster';
import { EditableField } from './modelKinds';

/** Lowercase letters, digits and dashes — a component address part, as the server tidies it. */
const tidy = (v: string) =>
	v
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');

type Props = {
	/** The model, by id. */
	modelId: string;
	/** The saved section or list of rows to make reusable; null when closed. */
	field: EditableField | null;
	/** The model has unsaved changes: it's made from what's saved, so those go first. */
	unsaved?: boolean;
	onClose: () => void;
	/** The model as it is after, from the server. */
	onDone: (model: any) => void;
};

/**
 * "Make reusable" (backend docs/cms CMS-03b): a model's section or list of
 * rows becomes a component other models can use too. Its fields move to the
 * component as they are; the field uses it, once or as a list as it was; the
 * records don't change.
 */
const MakeReusableDialog: FC<Props> = ({ modelId, field, unsaved, onClose, onDone }) => {
	const [make, { isLoading }] = useMakeSectionReusableMutation();
	const [title, setTitle] = useState('');
	const [category, setCategory] = useState('shared');
	const [name, setName] = useState('');
	const [error, setError] = useState('');

	useEffect(() => {
		if (!field) return;
		const t = field.label || field.key;
		setTitle(t);
		setCategory('shared');
		setName(tidy(t));
		setError('');
	}, [field?.uid]);

	const submit = async () => {
		if (!field || unsaved) return;
		setError('');
		try {
			const res = await make({ id: modelId, body: { field: field.key, category: tidy(category) || 'shared', name: tidy(name || title), title: title.trim() || field.label || field.key } }).unwrap();
			toaster.create({ title: `${field.label || field.key} is now the component ${res.component.title}`, description: 'Other models can use it under Build → Components.', type: 'success' });
			onDone(res.model);
			onClose();
		} catch (e: any) {
			setError(e?.data?.problems?.[0] || e?.data?.message || 'It couldn’t be made reusable');
		}
	};

	return (
		<PromptDialog
			open={!!field}
			onClose={onClose}
			onConfirm={submit}
			title={`Make ${field?.label || field?.key || 'this'} reusable?`}
			description={`It becomes a component other models can use too — ${field?.kind === 'sectionlist' ? 'as a list of rows' : 'once'}, as it is here. Its records don’t change.`}
			tone='default'
			icon={<Puzzle size={18} strokeWidth={1.75} />}
			confirmLabel='Make reusable'
			loading={isLoading}
			loadingText='Making it…'
			disabled={unsaved || !title.trim() || !tidy(name || title)}
			aside={<GuideLink section='models-components-reusable' />}>
			<Flex
				direction='column'
				gap={3}
				mt={1}>
				<Grid
					templateColumns='1fr'
					gap={1}>
					<Text
						fontSize='12.5px'
						fontWeight='600'>
						Title
					</Text>
					<Input
						size='sm'
						value={title}
						onChange={e => setTitle(e.target.value)}
					/>
				</Grid>
				<Grid
					templateColumns='1fr'
					gap={1}>
					<Text
						fontSize='12.5px'
						fontWeight='600'>
						Address
					</Text>
					<Flex
						align='center'
						gap={1.5}>
						<Input
							size='sm'
							fontFamily='mono'
							w='120px'
							value={category}
							onChange={e => setCategory(e.target.value)}
							aria-label='Category'
						/>
						<Text color='fg.muted'>.</Text>
						<Input
							size='sm'
							fontFamily='mono'
							flex={1}
							value={name}
							onChange={e => setName(e.target.value)}
							aria-label='Name'
						/>
					</Flex>
					<Text
						fontSize='12px'
						color='fg.muted'>
						Fixed once made — {tidy(category) || 'shared'}.{tidy(name || title) || 'name'}
					</Text>
				</Grid>
				{unsaved && (
					<Text
						fontSize='12.5px'
						color='orange.fg'>
						Save your changes first — the component is made from the model as it’s saved.
					</Text>
				)}
				{error && (
					<Text
						fontSize='12.5px'
						color='red.fg'>
						{error}
					</Text>
				)}
			</Flex>
		</PromptDialog>
	);
};

export default MakeReusableDialog;
