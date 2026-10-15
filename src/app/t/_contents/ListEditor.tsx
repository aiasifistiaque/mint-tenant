'use client';

import { FC, useEffect, useMemo, useState } from 'react';
import NextLink from 'next/link';
import { Box, Flex, Grid, Input, Spinner, Text } from '@chakra-ui/react';
import { Dropdown } from '@/components/library/cl';
import { usePreviewSiteContentListMutation } from '@/components/library';
import type { ContentListModel, ContentListPreview } from '@/components/library';
import { projectHref } from '@/components/library/config/lib/constants/panel';
import GuideLink from '@/components/library/tenant/GuideLink';
import ConditionsEditor, { TabCondition } from '@/app/builder/_components/ConditionsEditor';
import { ModelField } from '@/app/builder/_components/filterTypes';

/**
 * A List's own settings (backend docs/cms D1): which model, how many, in what
 * order, which records (conditions, all or any) and which of their fields a
 * card shows, with what the list shows right now. The site reads the model the
 * way any visitor would — through its public API — so a model whose API is
 * off is offered with the reason.
 */

type Data = Record<string, any>;

const label = (text: string, hint?: string) => (
	<Box mb={1}>
		<Text
			fontSize='13px'
			fontWeight='500'>
			{text}
		</Text>
		{hint && (
			<Text
				fontSize='12px'
				color='fg.muted'>
				{hint}
			</Text>
		)}
	</Box>
);

/** A model's field as the conditions editor knows fields. */
const asModelField = (f: ContentListModel['fields'][number]): ModelField => ({
	key: f.key,
	instance: f.kind === 'number' || f.kind === 'formula' ? 'Number' : f.kind === 'date' ? 'Date' : f.kind === 'boolean' ? 'Boolean' : 'String',
	...(f.options?.length && { enum: f.options }),
});

const TEXTS = ['text', 'textarea', 'editor', 'select', 'uid', 'email', 'url', 'number', 'date'];
const PICTURES = ['image', 'images', 'url', 'text'];

const ListEditor: FC<{ data: Data; onChange: (next: Data) => void; models: ContentListModel[] }> = ({ data, onChange, models }) => {
	const set = (patch: Data) => onChange({ ...data, ...patch });
	const model = models.find(m => m.model === data.source);
	const fields = model?.fields || [];
	const [preview, setPreview] = useState<ContentListPreview | null>(null);
	const [runPreview, { isLoading }] = usePreviewSiteContentListMutation();

	// What it lists now — a moment after the settings stop changing.
	const key = JSON.stringify([data.source, data.limit, data.sort, data.match, data.when, data.cardTitle, data.cardText, data.cardImage, data.link]);
	useEffect(() => {
		if (!data.source) return setPreview(null);
		const t = setTimeout(async () => {
			const res: any = await runPreview({ data });
			if ('data' in res) setPreview(res.data);
		}, 400);
		return () => clearTimeout(t);
	}, [key]);

	const sortKey = String(data.sort || '-createdAt').replace(/^-/, '');
	const desc = String(data.sort || '-createdAt').startsWith('-');
	const where: TabCondition[] = useMemo(
		() => (Array.isArray(data.when) ? data.when : []).map((c: any) => ({ field: c.field || '', op: c.op || 'is', value: c.value ?? '' })),
		[data.when]
	);
	const fieldItems = (kinds: string[]) => [{ value: '', label: 'Nothing' }, ...fields.filter(f => kinds.includes(f.kind)).map(f => ({ value: f.key, label: f.label }))];

	return (
		<Flex
			direction='column'
			gap={4}>
			<Box>
				{label('Model', 'Whose records it shows')}
				<Dropdown
					size='sm'
					value={data.source || ''}
					placeholder='Pick a model'
					onChange={v => {
						const m = models.find(x => x.model === v);
						const pick = (keys: string[], kinds: string[]) => m?.fields.find(f => keys.includes(f.key) && kinds.includes(f.kind))?.key || '';
						// The usual fields for a card, so a new list shows something at once.
						set({
							source: v,
							when: [],
							sort: '-createdAt',
							cardTitle: pick(['title', 'name'], TEXTS),
							cardText: pick(['summary', 'excerpt', 'description', 'intro'], TEXTS),
							cardImage: pick(['image', 'cover', 'picture', 'photo', 'images', 'gallery'], PICTURES),
							link: m?.fields.some(f => f.key === 'slug') ? `/${v}/{slug}` : '',
						});
					}}
					items={[...models.filter(m => m.list), ...models.filter(m => !m.list)].map(m => ({
						value: m.model,
						label: m.list ? m.title : `${m.title} — its public API is off`,
						disabled: !m.list,
					}))}
				/>
				{model && !model.list && (
					<Text
						fontSize='12px'
						color='orange.fg'
						mt={1}>
						{model.problem}{' '}
						<NextLink href={projectHref('/public-api/endpoints')}>Open the API</NextLink>
					</Text>
				)}
			</Box>
			{model && (
				<>
					<Grid
						templateColumns={{ base: '1fr', md: '120px 1fr 210px' }}
						gap={3}>
						<Box>
							{label('How many')}
							<Input
								size='sm'
								type='number'
								min={1}
								max={48}
								value={data.limit ?? 6}
								onChange={e => set({ limit: e.target.value === '' ? '' : Math.max(1, Math.min(48, Number(e.target.value))) })}
							/>
						</Box>
						<Box>
							{label('Order by')}
							<Dropdown
								size='sm'
								value={sortKey}
								onChange={v => set({ sort: `${desc ? '-' : ''}${v}` })}
								items={[{ value: 'createdAt', label: 'When it was added' }, ...fields.filter(f => ['text', 'number', 'date', 'select', 'uid', 'boolean'].includes(f.kind)).map(f => ({ value: f.key, label: f.label }))]}
							/>
						</Box>
						<Box>
							{label('Direction')}
							<Dropdown
								size='sm'
								value={desc ? 'desc' : 'asc'}
								onChange={v => set({ sort: `${v === 'desc' ? '-' : ''}${sortKey}` })}
								items={[
									{ value: 'desc', label: 'Newest / largest first' },
									{ value: 'asc', label: 'Oldest / smallest first' },
								]}
							/>
						</Box>
					</Grid>
					<Box>
						<Flex
							justify='space-between'
							align='baseline'>
							{label('Which records')}
							<GuideLink section='site-contents-list' />
						</Flex>
						<ConditionsEditor
							fields={fields.map(asModelField)}
							where={where}
							onChange={w => set({ when: w.map(c => ({ field: c.field, op: c.op, value: Array.isArray(c.value) ? c.value.join(',') : typeof c.value === 'string' ? c.value : '' })) })}
							match={data.match === 'any' ? 'any' : 'all'}
							onMatch={m => set({ match: m })}
							hint='Only the records that match'
							emptyHint='Every record (that its public API shows)'
						/>
					</Box>
					<Grid
						templateColumns={{ base: '1fr', md: 'repeat(3, minmax(0, 1fr))' }}
						gap={3}>
						<Box>
							{label('Card title')}
							<Dropdown
								size='sm'
								value={data.cardTitle || ''}
								onChange={v => set({ cardTitle: v })}
								items={fieldItems(TEXTS)}
							/>
						</Box>
						<Box>
							{label('Card text')}
							<Dropdown
								size='sm'
								value={data.cardText || ''}
								onChange={v => set({ cardText: v })}
								items={fieldItems(TEXTS)}
							/>
						</Box>
						<Box>
							{label('Card picture')}
							<Dropdown
								size='sm'
								value={data.cardImage || ''}
								onChange={v => set({ cardImage: v })}
								items={fieldItems(PICTURES)}
							/>
						</Box>
					</Grid>
					<Box>
						{label('Each card links to', '{field} is filled in from the record — /projects/{slug}')}
						<Input
							size='sm'
							fontFamily='mono'
							value={data.link || ''}
							placeholder={`/${data.source}/{slug}`}
							onChange={e => set({ link: e.target.value })}
						/>
					</Box>
					<Box
						borderWidth='1px'
						borderColor='border.muted'
						borderRadius='md'
						p={3}
						bg='bg.subtle'>
						<Flex
							align='center'
							gap={2}
							mb={1.5}>
							<Text
								fontSize='12.5px'
								fontWeight='600'>
								It shows now
							</Text>
							{isLoading && <Spinner size='xs' />}
						</Flex>
						{preview?.problem ? (
							<Text
								fontSize='12.5px'
								color='orange.fg'>
								{preview.problem}
							</Text>
						) : preview && !preview.items.length ? (
							<Text
								fontSize='12.5px'
								color='fg.muted'>
								No records match yet.
							</Text>
						) : (
							preview?.items.map(x => (
								<Flex
									key={x._id}
									gap={2}
									fontSize='12.5px'
									py={0.5}>
									<Text
										fontWeight='500'
										truncate>
										{x.title || '(no title)'}
									</Text>
									{x.url && (
										<Text
											color='fg.muted'
											fontFamily='mono'
											truncate>
											{x.url}
										</Text>
									)}
								</Flex>
							))
						)}
					</Box>
				</>
			)}
		</Flex>
	);
};

export default ListEditor;
