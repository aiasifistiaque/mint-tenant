'use client';

import { FC } from 'react';
import { Box, Button, Flex, Input, Text, Textarea } from '@chakra-ui/react';
import { Plus, X } from 'lucide-react';
import { IS_TENANT_PANEL } from '@/components/library/config/lib/constants/panel';
import { FieldTree, PdfTemplate } from '@/components/library/pdf/types';
import { useGetPdfCategoriesQuery } from '@/components/library';
import { Color, Num, Pick, Row, Section, Toggle } from './controls';
import { DocLink } from '../ui';

/**
 * The template as a whole: its name, the page it prints, paper and margins,
 * the look every block starts from, lists from other pages — and, for the
 * super admin, whether every project sees it in the gallery.
 */
const PageSettings: FC<{
	template: PdfTemplate;
	set: (patch: Partial<PdfTemplate>) => void;
	pages: { value: string; label: string }[];
	tree?: FieldTree;
}> = ({ template: t, set, pages, tree }) => {
	const page = (p: Partial<PdfTemplate['page']>) => set({ page: { ...t.page, ...p } });
	const style = (p: Partial<PdfTemplate['style']>) => set({ style: { ...t.style, ...p } });
	const margin = (i: number, v: number | undefined) => page({ margin: t.page.margin.map((m, j) => (j === i ? v ?? 0 : m)) as any });
	const lists = t.lists || [];
	const setList = (i: number, p: any) => set({ lists: lists.map((l, j) => (j === i ? { ...l, ...p } : l)) });
	// The gallery's categories (D21); a template outside them shows as Other.
	const { data: cats } = useGetPdfCategoriesQuery();
	const categories = cats?.categories || [];
	const categoryOptions: [string, string][] = [
		...categories.map(c => [c.key, c.name] as [string, string]),
		...(t.kind && !categories.some(c => c.key === t.kind) ? [[t.kind, `Other (${t.kind})`] as [string, string]] : []),
	];

	return (
		<Box>
			<Section title='Template'>
				<Row label='Name'>
					<Input
						size='xs'
						value={t.name}
						onChange={e => set({ name: e.target.value })}
					/>
				</Row>
				<Row label='Category'>
					<Pick
						value={t.kind}
						options={categoryOptions}
						onChange={v => set({ kind: v })}
					/>
				</Row>
				<Row label='Page'>
					<Pick
						value={t.route}
						options={[['', 'None yet'], ...pages.map(p => [p.value, p.label] as [string, string])]}
						onChange={v => set({ route: v })}
					/>
				</Row>
				<Row
					label='Record as'
					hint={`Fields go in as {{${t.alias}.…}}. Changing it doesn’t rewrite the tokens already there.`}>
					<Input
						size='xs'
						fontFamily='mono'
						value={t.alias}
						onChange={e => set({ alias: e.target.value.replace(/[^A-Za-z0-9_]/g, '') })}
					/>
				</Row>
				<Box>
					<Text
						fontSize='xs'
						color='fg.muted'
						mb={1}>
						Description
					</Text>
					<Textarea
						size='xs'
						rows={2}
						value={t.description || ''}
						onChange={e => set({ description: e.target.value })}
					/>
				</Box>
				{!IS_TENANT_PANEL && (
					<Box>
						<Toggle
							label='In the gallery for every project'
							checked={!!t.gallery?.published}
							onChange={v => set({ gallery: { order: t.gallery?.order || 0, published: v } })}
						/>
						<Text
							fontSize='11px'
							color='fg.subtle'
							mt={1}>
							Projects copy it from the gallery; give it sample data (below) so its card isn’t blank.
						</Text>
					</Box>
				)}
			</Section>

			<Section
				title='Paper'
				action={<DocLink section='page' label='?' />}>
				<Row label='Size'>
					<Pick
						value={t.page.size}
						options={[
							['A4', 'A4'],
							['Letter', 'Letter'],
							['Legal', 'Legal'],
							['A5', 'A5'],
						]}
						onChange={v => page({ size: v as any })}
					/>
				</Row>
				<Row label='Orientation'>
					<Pick
						value={t.page.orientation}
						options={[
							['portrait', 'Portrait'],
							['landscape', 'Landscape'],
						]}
						onChange={v => page({ orientation: v as any })}
					/>
				</Row>
				{['Top', 'Right', 'Bottom', 'Left'].map((label, i) => (
					<Row
						key={label}
						label={`Margin ${label.toLowerCase()}`}>
						<Num
							value={t.page.margin[i]}
							max={200}
							onChange={v => margin(i, v)}
						/>
					</Row>
				))}
			</Section>

			<Section title='Look'>
				<Row label='Font'>
					<Pick
						value={t.style.font}
						options={[
							['sans', 'Geist (sans)'],
							['mono', 'Geist Mono'],
							['helvetica', 'Helvetica'],
							['times', 'Times'],
							['courier', 'Courier'],
						]}
						onChange={v => style({ font: v as any })}
					/>
				</Row>
				<Row label='Text size'>
					<Num
						value={t.style.size}
						min={6}
						max={24}
						step={0.5}
						onChange={v => style({ size: v ?? 10 })}
					/>
				</Row>
				<Row label='Line height'>
					<Num
						value={t.style.lineHeight}
						min={1}
						max={2.5}
						step={0.05}
						unit='×'
						onChange={v => style({ lineHeight: v ?? 1.35 })}
					/>
				</Row>
				<Row label='Text'>
					<Color
						value={t.style.color}
						onChange={v => style({ color: v || '#111111' })}
					/>
				</Row>
				<Row label='Muted'>
					<Color
						value={t.style.muted}
						onChange={v => style({ muted: v || '#6b7280' })}
					/>
				</Row>
				<Row
					label='Accent'
					hint='Filled bands in label/value rows.'>
					<Color
						value={t.style.accent}
						onChange={v => style({ accent: v || '#2563eb' })}
					/>
				</Row>
			</Section>

			<Section
				title='Lists from other pages'
				action={
					<Flex
						gap={1}
						align='center'>
						<DocLink
							section='lists'
							label='?'
						/>
						<Button
							size='2xs'
							variant='ghost'
							disabled={!tree?.lists?.length || lists.length >= 6}
							onClick={() => {
								const l = tree!.lists[0];
								set({ lists: [...lists, { name: l.route.replace(/[^A-Za-z]/g, '').slice(0, 20) || 'items', route: l.route, foreignField: l.foreignField, limit: 500 }] });
							}}>
							<Plus size={12} />
							List
						</Button>
					</Flex>
				}>
				{!lists.length && (
					<Text
						fontSize='11px'
						color='fg.subtle'>
						{tree?.lists?.length
							? 'Records of another page that point at this one — an invoice’s payments. Add one, then show it in a table or count it: {{payments | count}}.'
							: 'No other page points at this one yet.'}
					</Text>
				)}
				{lists.map((l, i) => (
					<Box
						key={i}
						borderWidth='1px'
						borderColor='border'
						borderRadius='md'
						p={2}>
						<Flex
							gap={2}
							align='center'
							mb={1.5}>
							<Input
								size='xs'
								fontFamily='mono'
								value={l.name}
								onChange={e => setList(i, { name: e.target.value.replace(/[^A-Za-z0-9_]/g, '') })}
							/>
							<Button
								size='2xs'
								variant='ghost'
								aria-label='Remove'
								onClick={() => set({ lists: lists.filter((_, j) => j !== i) })}>
								<X size={12} />
							</Button>
						</Flex>
						<Pick
							value={`${l.route}|${l.foreignField}`}
							options={(tree?.lists || []).map(x => [`${x.route}|${x.foreignField}`, `${x.title} whose ${x.fieldLabel} is this one`] as [string, string])}
							onChange={v => setList(i, { route: v.split('|')[0], foreignField: v.split('|')[1] })}
						/>
						<Flex
							gap={2}
							mt={1.5}>
							<Input
								size='xs'
								fontFamily='mono'
								placeholder='Order: createdAt, -amount'
								value={l.sort || ''}
								onChange={e => setList(i, { sort: e.target.value || undefined })}
							/>
							<Box w='110px'>
								<Num
									value={l.limit}
									min={1}
									max={2000}
									unit='max'
									onChange={v => setList(i, { limit: v })}
								/>
							</Box>
						</Flex>
					</Box>
				))}
			</Section>
		</Box>
	);
};

export default PageSettings;
