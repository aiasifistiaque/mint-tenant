'use client';

import { FC, useEffect, useState } from 'react';
import { Box, Button, Flex, Grid, Input, Text } from '@chakra-ui/react';
import { ArrowLeft } from 'lucide-react';
import {
	Dialog,
	DialogBody,
	DialogCloseButton,
	DialogFooter,
	DialogHeader,
	DiscardButton,
	useCreateSiteContentMutation,
	useUpdateSiteContentMutation,
} from '@/components/library';
import type { ContentListModel, ContentType, SiteContent, SiteContentsPage } from '@/components/library';
import { Dropdown } from '@/components/library/cl';
import { styles } from '@/components/library/config';
import { BlockFields } from '@/components/library/utils/inputs/section/VBlocks';
import GuideLink from '@/components/library/tenant/GuideLink';
import { toaster } from '@/components/ui/toaster';
import ListEditor from './ListEditor';
import { typeIcon } from './typeIcon';

/**
 * Adding or changing one piece of a page (backend docs/cms D1): first what it
 * is — a Hero, Cards, Questions, a List… — then only that type's fields. A
 * List gets its own settings (ListEditor); every other type its fields as the
 * type (a component) defines them. Changing one can also move it to another
 * page.
 */

const LIST = 'content.list';
/** A List's words around the records; the rest is ListEditor's. */
const LIST_WORDS = ['eyebrow', 'heading', 'buttonLabel', 'buttonUrl'];
const SITE = 'site';

const TypeCard: FC<{ t: ContentType; onPick: () => void }> = ({ t, onPick }) => {
	const Icon = typeIcon(t.icon);
	return (
		<Flex
			as='button'
			onClick={onPick}
			gap={3}
			p={3}
			textAlign='left'
			align='flex-start'
			borderWidth='1px'
			borderColor='border'
			borderRadius='lg'
			bg='bg.panel'
			cursor='pointer'
			_hover={{ borderColor: 'border.emphasized', bg: 'bg.subtle' }}>
			<Flex
				boxSize='30px'
				flexShrink={0}
				align='center'
				justify='center'
				borderRadius='md'
				bg='violet.subtle'
				color='violet.fg'>
				<Icon size={15} />
			</Flex>
			<Box minW={0}>
				<Text
					fontSize='13.5px'
					fontWeight='600'>
					{t.title}
				</Text>
				<Text
					fontSize='12px'
					color='fg.muted'
					lineClamp={2}>
					{t.description}
				</Text>
			</Box>
		</Flex>
	);
};

const ContentDialog: FC<{
	open: boolean;
	onClose: () => void;
	types: ContentType[];
	models: ContentListModel[];
	pages: SiteContentsPage[];
	/** The page it's added to (an id, or 'site'). */
	page: string;
	/** The one being changed; none to add one. */
	content?: SiteContent | null;
	/** Contents keep drafts until published (docs/cms D5). */
	drafts?: boolean;
}> = ({ open, onClose, types, models, pages, page, content, drafts }) => {
	const [uid, setUid] = useState<string>('');
	const [name, setName] = useState('');
	const [where, setWhere] = useState(page);
	const [data, setData] = useState<Record<string, any>>({});
	const [error, setError] = useState('');
	const [create, creating] = useCreateSiteContentMutation();
	const [update, updating] = useUpdateSiteContentMutation();

	useEffect(() => {
		if (!open) return;
		setUid(content?.type || '');
		setName(content?.name || '');
		setWhere(content ? content.page || SITE : page);
		setData(content?.data ? { ...content.data } : {});
		setError('');
	}, [open, content?._id]);

	const type = types.find(t => t.uid === uid);
	const pageName = where === SITE ? 'Whole site' : pages.find(p => p._id === where)?.name || 'this page';
	const Icon = typeIcon(type?.icon);

	const save = async () => {
		setError('');
		if (!type) return;
		const page = where === SITE ? null : where;
		const res: any = content
			? await update({ id: content._id, name: name.trim() || undefined, page, data })
			: await create({ page, type: type.uid, name: name.trim() || undefined, data });
		if ('error' in res) return setError(res.error?.data?.message || 'Couldn’t save — try again.');
		toaster.create({
			type: 'success',
			title: content ? 'Saved' : `${type.title} added to ${pageName}`,
			description: drafts ? 'A draft — Publish puts it on your site.' : undefined,
		});
		onClose();
	};

	return (
		<Dialog
			isOpen={open}
			onClose={onClose}
			size={type ? 'xl' : 'lg'}
			forceModal>
			<DialogHeader
				divider
				icon={<Icon size={17} strokeWidth={1.75} />}
				description={type ? type.description : `What goes on ${pageName}? Pick what it is; the form then asks only for that.`}>
				{content ? `Edit “${content.name}”` : type ? `New ${type.title.toLowerCase()}` : 'New content'}
			</DialogHeader>
			<DialogCloseButton />
			<DialogBody>
				{!type ? (
					<Grid
						templateColumns={{ base: '1fr', md: 'repeat(2, minmax(0, 1fr))' }}
						gap={2.5}>
						{types.map(t => (
							<TypeCard
								key={t.uid}
								t={t}
								onPick={() => {
									setUid(t.uid);
									setData(t.uid === LIST ? { limit: 6, sort: '-createdAt', match: 'all' } : {});
								}}
							/>
						))}
					</Grid>
				) : (
					<Flex
						direction='column'
						gap={4}>
						{!content && (
							<Button
								alignSelf='flex-start'
								size='xs'
								variant='ghost'
								ml={-2}
								onClick={() => setUid('')}>
								<ArrowLeft size={13} />
								Pick another type
							</Button>
						)}
						<Grid
							templateColumns={{ base: '1fr', md: 'repeat(2, minmax(0, 1fr))' }}
							gap={3}>
							<Box>
								<Text
									fontSize='13px'
									fontWeight='500'
									mb={1}>
									Name
								</Text>
								<Input
									size='sm'
									value={name}
									maxLength={120}
									placeholder={`${pageName} — ${type.title}`}
									onChange={e => setName(e.target.value)}
								/>
							</Box>
							<Box>
								<Text
									fontSize='13px'
									fontWeight='500'
									mb={1}>
									Page
								</Text>
								<Dropdown
									size='sm'
									value={where}
									onChange={setWhere}
									items={[{ value: SITE, label: 'Whole site — header, footer, every page' }, ...pages.map(p => ({ value: p._id, label: `${p.name} (${p.path})` }))]}
								/>
							</Box>
						</Grid>
						<BlockFields
							item={{ __component: type.uid, ...data }}
							type={{ uid: type.uid, title: type.title, dataModel: type.uid === LIST ? type.dataModel.filter(f => LIST_WORDS.includes(f.name)) : type.dataModel }}
							onChange={({ __component, _key, ...next }) => setData(d => ({ ...d, ...next }))}
						/>
						{type.uid === LIST && (
							<Box
								borderTopWidth='1px'
								borderColor='border.muted'
								pt={4}>
								<ListEditor
									data={data}
									onChange={setData}
									models={models}
								/>
							</Box>
						)}
						{error && (
							<Text
								role='alert'
								fontSize='13px'
								color='red.fg'>
								{error}
							</Text>
						)}
					</Flex>
				)}
			</DialogBody>
			<DialogFooter>
				<Box mr='auto'>
					<GuideLink section='site-contents' />
				</Box>
				<DiscardButton onClick={onClose}>Cancel</DiscardButton>
				<Button
					{...(styles.MODAL_BUTTON as any)}
					disabled={!type}
					loading={creating.isLoading || updating.isLoading}
					onClick={save}>
					{content ? 'Save' : type ? `Add to ${pageName}` : 'Add'}
				</Button>
			</DialogFooter>
		</Dialog>
	);
};

export default ContentDialog;
