'use client';

import { FC, useEffect, useState } from 'react';
import { Box, Button, Flex, Grid, Input, Text } from '@chakra-ui/react';
import { ArrowLeft, Search } from 'lucide-react';
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
import type { ContentBlock, ContentListModel, ContentType, SiteContent, SiteContentsPage } from '@/components/library';
import { Dropdown } from '@/components/library/cl';
import { styles } from '@/components/library/config';
import VBlocks, { BlockFields, searchTypes } from '@/components/library/utils/inputs/section/VBlocks';
import GuideLink from '@/components/library/tenant/GuideLink';
import { toaster } from '@/components/ui/toaster';
import ContentAddress from './ContentAddress';
import ListEditor from './ListEditor';
import { typeIcon } from './typeIcon';

/**
 * Adding or changing one piece of a page (backend docs/cms D1): first what it
 * is — a Hero, Cards, Questions, a List… — then only that type's fields. A
 * List gets its own settings (ListEditor); every other type its fields as the
 * type (a component) defines them. Under it, more blocks of any type but a
 * List can be added — a Text, then a Gallery — kept with it, in order.
 * Changing one can also move it to another page or give it another slug.
 */

const LIST = 'content.list';
/** A List's words around the records; the rest is ListEditor's. */
const LIST_WORDS = ['eyebrow', 'heading', 'buttonLabel', 'buttonUrl'];
const SITE = 'site';
/** The most blocks one content holds, its own included (backend BLOCKS_MAX). */
const MAX_BLOCKS = 20;

/**
 * Words written while a type's Text had the editor are HTML; that field is a
 * plain text box now (only Rich text keeps the editor), so they show — and
 * save — as plain words, a paragraph a line.
 */
const plainOf = (html: string) =>
	html
		.replace(/<br\s*\/?>/gi, '\n')
		.replace(/<\/(p|div|h[1-6]|li)>/gi, '\n')
		.replace(/<[^>]+>/g, '')
		.replace(/&nbsp;/g, ' ')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&amp;/g, '&')
		.replace(/\n{3,}/g, '\n\n')
		.trim();
const looksLikeHtml = (v: any) => typeof v === 'string' && /<\/?[a-z][^>]*>/i.test(v);
const plainIn = (data: Record<string, any>, model: any[] = []): Record<string, any> => {
	const out = { ...data };
	for (const f of model) {
		const v = out[f.name];
		if (f.type === 'textarea' && looksLikeHtml(v)) out[f.name] = plainOf(v);
		// Rows and groups too (a question's answer, a slide's subheading).
		else if (f.type === 'section-data-array' && Array.isArray(v)) out[f.name] = v.map(r => (r && typeof r === 'object' ? plainIn(r, f.section?.dataModel) : r));
		else if (f.type === 'section-object' && v && typeof v === 'object') out[f.name] = plainIn(v, f.dataModel);
	}
	return out;
};
const asPlain = (data: Record<string, any>, type?: ContentType) => plainIn(data, type?.dataModel);

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
	/** The types already on the page, top first — the next piece is suggested from the last. */
	onPage?: string[];
	/** The types suggested first on an empty page and on the whole site. */
	start?: { page: string[]; site: string[] };
}> = ({ open, onClose, types, models, pages, page, content, drafts, onPage = [], start }) => {
	const [uid, setUid] = useState<string>('');
	const [name, setName] = useState('');
	const [slug, setSlug] = useState('');
	const [more, setMore] = useState<ContentBlock[]>([]);
	const [where, setWhere] = useState(page);
	const [data, setData] = useState<Record<string, any>>({});
	const [error, setError] = useState('');
	const [q, setQ] = useState('');
	const [create, creating] = useCreateSiteContentMutation();
	const [update, updating] = useUpdateSiteContentMutation();

	useEffect(() => {
		if (!open) return;
		setUid(content?.type || '');
		setName(content?.name || '');
		setSlug(content?.slug || '');
		setMore(Array.isArray(content?.more) ? content.more.map(b => ({ ...asPlain(b, types.find(t => t.uid === b.__component)), __component: b.__component })) : []);
		setWhere(content ? content.page || SITE : page);
		setData(content?.data ? asPlain(content.data, types.find(t => t.uid === content.type)) : {});
		setError('');
		setQ('');
	}, [open, content?._id]);

	const type = types.find(t => t.uid === uid);
	const pageName = where === SITE ? 'Whole site' : pages.find(p => p._id === where)?.name || 'this page';
	const Icon = typeIcon(type?.icon);
	const blockTypes = types.filter(t => t.uid !== LIST).map(t => ({ uid: t.uid, title: t.title, description: t.description, dataModel: t.dataModel }));
	// What to offer first: for the whole site its header and footer, for an empty page an opening, else what goes after the last piece.
	const last = types.find(t => t.uid === onPage[onPage.length - 1]);
	const startWith = (where === SITE ? start?.site : onPage.length ? last?.suggest : start?.page) || [];
	const suggestedTypes = startWith.map(u => types.find(t => t.uid === u)).filter((t): t is ContentType => !!t);
	const otherTypes = types.filter(t => !suggestedTypes.includes(t));
	const found = searchTypes(types, q);
	const pick = (t: ContentType) => {
		setUid(t.uid);
		setMore([]);
		setData(t.uid === LIST ? { limit: 6, sort: '-createdAt', match: 'all' } : {});
	};
	const grid = (list: ContentType[]) => (
		<Grid
			templateColumns={{ base: '1fr', md: 'repeat(2, minmax(0, 1fr))' }}
			gap={2.5}>
			{list.map(t => (
				<TypeCard
					key={t.uid}
					t={t}
					onPick={() => pick(t)}
				/>
			))}
		</Grid>
	);
	const groupTitle = (text: string) => (
		<Text
			fontSize='11.5px'
			fontWeight='600'
			color='fg.muted'
			textTransform='uppercase'
			letterSpacing='0.04em'>
			{text}
		</Text>
	);

	const save = async () => {
		setError('');
		if (!type) return;
		const page = where === SITE ? null : where;
		const res: any = content
			? await update({ id: content._id, name: name.trim() || undefined, slug: slug.trim() || undefined, page, data, more })
			: await create({ page, type: type.uid, name: name.trim() || undefined, slug: slug.trim() || undefined, data, more });
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
					<Flex
						direction='column'
						gap={3}>
						<Flex
							align='center'
							gap={2}
							px={3}
							borderWidth='1px'
							borderColor='border'
							borderRadius='md'>
							<Search size={14} />
							<Input
								size='sm'
								variant='flushed'
								borderBottomWidth='0'
								autoFocus
								placeholder='Search types — hero, gallery, questions…'
								value={q}
								onChange={e => setQ(e.target.value)}
								onKeyDown={e => {
									if (e.key === 'Enter' && q.trim() && found[0]) pick(found[0]);
								}}
							/>
						</Flex>
						{q.trim() ? (
							found.length ? (
								grid(found)
							) : (
								<Text
									fontSize='13px'
									color='fg.muted'>
									No type matches “{q.trim()}”.
								</Text>
							)
						) : suggestedTypes.length ? (
							<>
								{groupTitle(where === SITE ? 'Suggested for the whole site' : onPage.length ? `Suggested after the ${last?.title.toLowerCase() || 'last piece'}` : 'Suggested to open the page')}
								{grid(suggestedTypes)}
								{groupTitle('Every type')}
								{grid(otherTypes)}
							</>
						) : (
							grid(types)
						)}
					</Flex>
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
							<Box gridColumn={{ md: 'span 2' }}>
								<Text
									fontSize='13px'
									fontWeight='500'
									mb={1}>
									Slug
								</Text>
								<Input
									size='sm'
									value={slug}
									maxLength={120}
									fontFamily='mono'
									placeholder='Made from the page and the type, e.g. home-gallery-3f9a2c'
									onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]+/g, '-'))}
								/>
								<Text
									fontSize='12px'
									color='fg.muted'
									mt={1}>
									How your site and the API find this content{content ? ' — places that use the old slug stop showing it until they’re changed' : ' — the addresses to read it show here once it’s added'}.
								</Text>
								{content?.slug && (
									<ContentAddress
										slug={content.slug}
										pagePath={content.page ? pages.find(p => p._id === content.page)?.path : null}
									/>
								)}
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
						<Box
							borderTopWidth='1px'
							borderColor='border.muted'
							pt={4}>
							<VBlocks
								name='more'
								label='More in this block'
								value={more}
								onChange={(e: any) => setMore(Array.isArray(e?.target?.value) ? e.target.value : [])}
								blocks={blockTypes}
								suggested={type.suggest}
								limit={MAX_BLOCKS - 1}
								helper={`Add a Text, a Gallery or any other type under the ${type.title.toLowerCase()} — they stay together, in this order.`}
							/>
						</Box>
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
