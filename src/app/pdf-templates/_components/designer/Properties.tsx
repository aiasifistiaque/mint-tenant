'use client';

import { FC } from 'react';
import { Box, Button, Flex, IconButton, Text } from '@chakra-ui/react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Copy, Plus, Trash2, X } from 'lucide-react';
import ConditionsEditor from '@/app/builder/_components/ConditionsEditor';
import { ModelField } from '@/app/builder/_components/filterTypes';
import { Block, FILLERS, Place, flattenFields, labelOf } from '@/components/library/pdf/types';
import { PickerContext } from './FieldPicker';
import TokenText from './TokenText';
import { ALIGN, Color, Num, Pick, Row, Section, Toggle, WEIGHT } from './controls';
import { DocLink, ICON } from '../ui';

type Props = {
	block: Block;
	onChange: (patch: Partial<Block>) => void;
	ctx: PickerContext;
	conditionFields: ModelField[];
	onRemove: () => void;
	onDuplicate: () => void;
	onMove: (by: -1 | 1) => void;
	/** Where it sits: a row or a stack, which part (D19). */
	place: Place;
};

const LAYOUT: [string, string][] = [
	['column', 'Stack — one under another'],
	['row', 'Row — side by side'],
];
const ROW_ALIGN: [string, string][] = [
	['top', 'Top'],
	['middle', 'Middle'],
	['bottom', 'Bottom'],
	['stretch', 'Stretch — boxes as tall as the row'],
];
const SPREAD: [string, string][] = [
	['start', 'From the left'],
	['center', 'Centred'],
	['end', 'To the right'],
	['between', 'Space between'],
];

/** What filling the free space does where the block sits (D19). */
const fillHint = (place: Place) =>
	place.flow === 'row'
		? 'Takes the width the others leave.'
		: place.parent?.type === 'box'
		? place.parent.height
			? 'Takes the height the others leave in the box.'
			: 'Give the box a minimum height (or stretch it in a row) to have height to fill.'
		: place.parent?.type === 'columns'
		? 'A column has no spare height to fill.'
		: place.part === 'body'
		? 'Takes the room left on the page — what follows sits at the bottom of the page.'
		: 'The header and footer have no spare room to fill.';

const small = { size: 12, strokeWidth: 1.75 };

/** Size, weight, colour, alignment — what text blocks, tables and rows share. */
const TextStyle: FC<{ b: Block; set: (p: Partial<Block>) => void; align?: boolean; more?: boolean }> = ({ b, set, align = true, more = true }) => (
	<>
		<Row label='Size'>
			<Num
				value={b.size}
				min={5}
				max={72}
				step={0.5}
				placeholder='Page’s'
				onChange={v => set({ size: v })}
			/>
		</Row>
		<Row label='Weight'>
			<Pick
				value={b.weight ?? 400}
				options={WEIGHT}
				onChange={v => set({ weight: Number(v) })}
			/>
		</Row>
		<Row label='Colour'>
			<Color
				value={b.color}
				onChange={v => set({ color: v })}
			/>
		</Row>
		{align && (
			<Row label='Align'>
				<Pick
					value={b.align || 'left'}
					options={ALIGN}
					onChange={v => set({ align: v })}
				/>
			</Row>
		)}
		{more && (
			<Flex
				gap={4}
				wrap='wrap'>
				<Toggle
					label='Italic'
					checked={b.italic}
					onChange={v => set({ italic: v || undefined })}
				/>
				<Toggle
					label='UPPER CASE'
					checked={b.upper}
					onChange={v => set({ upper: v || undefined })}
				/>
			</Flex>
		)}
	</>
);

const listEdit = <T,>(list: T[], i: number, patch: Partial<T> | null): T[] =>
	patch === null ? list.filter((_, j) => j !== i) : list.map((x, j) => (j === i ? { ...x, ...patch } : x));
const listMove = <T,>(list: T[], i: number, by: number): T[] => {
	const to = i + by;
	if (to < 0 || to >= list.length) return list;
	const next = [...list];
	const [x] = next.splice(i, 1);
	next.splice(to, 0, x);
	return next;
};

const ItemTools: FC<{ i: number; n: number; onMove: (by: number) => void; onRemove: () => void }> = ({ i, n, onMove, onRemove }) => (
	<Flex gap={0}>
		<IconButton
			size='2xs'
			variant='ghost'
			aria-label='Up'
			disabled={i === 0}
			onClick={() => onMove(-1)}>
			<ArrowUp {...small} />
		</IconButton>
		<IconButton
			size='2xs'
			variant='ghost'
			aria-label='Down'
			disabled={i === n - 1}
			onClick={() => onMove(1)}>
			<ArrowDown {...small} />
		</IconButton>
		<IconButton
			size='2xs'
			variant='ghost'
			aria-label='Remove'
			onClick={onRemove}>
			<X {...small} />
		</IconButton>
	</Flex>
);

const Properties: FC<Props> = ({ block: b, onChange: set, ctx, conditionFields, onRemove, onDuplicate, onMove, place }) => {
	const inRow = place.flow === 'row';
	const alias = ctx.template.alias;

	const body = (() => {
		switch (b.type) {
			case 'text':
				return (
					<Section title='Text'>
						<TokenText
							value={b.text}
							onChange={v => set({ text: v })}
							ctx={ctx}
							multiline
							hint='**bold** for bold; a new line starts a new line.'
						/>
						<TextStyle
							b={b}
							set={set}
						/>
						<Row label='Letter spacing'>
							<Num
								value={b.spacing}
								min={-2}
								max={20}
								step={0.25}
								placeholder='0'
								onChange={v => set({ spacing: v })}
							/>
						</Row>
						<Row label='Line height'>
							<Num
								value={b.lineHeight}
								min={0.8}
								max={3}
								step={0.05}
								unit='×'
								placeholder='Page’s'
								onChange={v => set({ lineHeight: v })}
							/>
						</Row>
					</Section>
				);
			case 'image':
				return (
					<Section title='Image'>
						<TokenText
							label='Source'
							value={b.src}
							onChange={v => set({ src: v })}
							ctx={ctx}
							placeholder='https://…/logo.png or {{business.logo}}'
							hint='An image address (PNG, JPG, WebP, SVG) or an image field.'
						/>
						<Row label='Width'>
							<Num
								value={b.width}
								max={1200}
								placeholder='Auto'
								onChange={v => set({ width: v })}
							/>
						</Row>
						<Row label='Height'>
							<Num
								value={b.height}
								max={1600}
								placeholder='Auto'
								onChange={v => set({ height: v })}
							/>
						</Row>
						<Row label='Align'>
							<Pick
								value={b.align || 'left'}
								options={ALIGN}
								onChange={v => set({ align: v })}
							/>
						</Row>
					</Section>
				);
			case 'columns':
				return (
					<Section
						title='Columns'
						action={
							<Button
								size='2xs'
								variant='ghost'
								disabled={(b.columns || []).length >= 6}
								onClick={() => set({ columns: [...(b.columns || []), { width: 1, blocks: [] }] })}>
								<Plus {...small} />
								Column
							</Button>
						}>
						{(b.columns || []).map((c: any, i: number) => (
							<Box key={i}>
								<Flex
									align='center'
									gap={2}>
									<Text
										fontSize='xs'
										w='60px'>
										Column {i + 1}
									</Text>
									<Box w='80px'>
										<Num
											value={c.width}
											min={0.1}
											max={12}
											step={0.1}
											unit='×'
											onChange={v => set({ columns: listEdit(b.columns, i, { width: v ?? 1 }) })}
										/>
									</Box>
									<Box flex='1'>
										<Pick
											value={c.valign || 'top'}
											options={[
												['top', 'Top'],
												['middle', 'Middle'],
												['bottom', 'Bottom'],
											]}
											onChange={v => set({ columns: listEdit(b.columns, i, { valign: v }) })}
										/>
									</Box>
									<ItemTools
										i={i}
										n={b.columns.length}
										onMove={by => set({ columns: listMove(b.columns, i, by) })}
										onRemove={() => set({ columns: listEdit(b.columns, i, null) })}
									/>
								</Flex>
								{/* Its blocks one under another, or side by side (PT-28). */}
								<Flex
									align='center'
									gap={2}
									mt={1}
									pl='68px'>
									<Box flex='1'>
										<Pick
											value={c.direction === 'row' ? 'row' : 'column'}
											options={[
												['column', 'One under another'],
												['row', 'Side by side'],
											]}
											onChange={v => set({ columns: listEdit(b.columns, i, { direction: v === 'row' ? 'row' : undefined }) })}
										/>
									</Box>
								</Flex>
							</Box>
						))}
						<Text
							fontSize='11px'
							color='fg.subtle'>
							Width is a share: 2 and 1 make the first twice as wide; Top / Middle / Bottom places the column’s blocks. Drag blocks into a column on the page or in Layers.
						</Text>
						<Row label='Gap'>
							<Num
								value={b.gap}
								max={120}
								onChange={v => set({ gap: v })}
							/>
						</Row>
					</Section>
				);
			case 'box': {
				const row = b.direction === 'row';
				return (
					<>
						<Section
							title='Layout'
							action={<DocLink section='layout' label='?' />}>
							<Row label='Blocks'>
								<Pick
									value={row ? 'row' : 'column'}
									options={LAYOUT}
									onChange={v => set({ direction: v === 'row' ? 'row' : undefined })}
								/>
							</Row>
							<Row label='Gap'>
								<Num
									value={b.gap}
									max={120}
									placeholder={row ? '8' : '0'}
									onChange={v => set({ gap: v })}
								/>
							</Row>
							{row && (
								<>
									<Row label='Align'>
										<Pick
											value={b.valign || 'top'}
											options={ROW_ALIGN}
											onChange={v => set({ valign: v === 'top' ? undefined : v })}
										/>
									</Row>
									<Row
										label='Spread'
										hint='When nothing in the row fills the free space'>
										<Pick
											value={b.justify || 'start'}
											options={SPREAD}
											onChange={v => set({ justify: v === 'start' ? undefined : v })}
										/>
									</Row>
								</>
							)}
							<Row label='Min height'>
								<Num
									value={b.height}
									min={4}
									max={1600}
									placeholder='Auto'
									onChange={v => set({ height: v })}
								/>
							</Row>
						</Section>
						<Section title='Box'>
							{!place.parent && (
								<>
									<Toggle
										label='Full-width background'
										checked={!!b.bleed}
										onChange={v => set({ bleed: v || undefined })}
									/>
									<Text
										fontSize='11px'
										color='fg.muted'
										mt={-1}>
										{place.part === 'header'
											? 'The background runs to the page’s edges — the first block of the header up to the top edge. What’s inside stays within the margins.'
											: place.part === 'footer'
											? 'The background runs to the page’s edges — the last block of the footer down to the bottom edge. What’s inside stays within the margins.'
											: 'The background runs to the page’s left and right edges; what’s inside stays within the margins.'}
									</Text>
								</>
							)}
							<Row label='Padding'>
								<Num
									value={b.pad}
									max={80}
									onChange={v => set({ pad: v })}
								/>
							</Row>
							<Row label='Top & bottom'>
								<Num
									value={b.padY}
									max={80}
									placeholder={String(b.pad ?? 10)}
									onChange={v => set({ padY: v })}
								/>
							</Row>
							<Row label='Left & right'>
								<Num
									value={b.padX}
									max={80}
									placeholder={String(b.pad ?? 10)}
									onChange={v => set({ padX: v })}
								/>
							</Row>
							<Row label='Background'>
								<Color
									value={b.bg}
									placeholder='None'
									onChange={v => set({ bg: v })}
								/>
							</Row>
							<Row label='Border'>
								<Num
									value={b.border}
									max={8}
									step={0.25}
									placeholder='None'
									onChange={v => set({ border: v })}
								/>
							</Row>
							{!!b.border && (
								<Row label='Lines on'>
									<Flex gap={1}>
										{(['top', 'right', 'bottom', 'left'] as const).map(side => {
											const on = !b.borderSides?.length || b.borderSides.includes(side);
											return (
												<Button
													key={side}
													size='2xs'
													variant={on ? 'solid' : 'outline'}
													onClick={() => {
														const now = (['top', 'right', 'bottom', 'left'] as const).filter(k => (k === side ? !on : !b.borderSides?.length || b.borderSides.includes(k)));
														set({ borderSides: now.length === 4 || !now.length ? undefined : now });
													}}>
													{side[0].toUpperCase() + side.slice(1)}
												</Button>
											);
										})}
									</Flex>
								</Row>
							)}
							<Row label='Border colour'>
								<Color
									value={b.borderColor}
									onChange={v => set({ borderColor: v })}
								/>
							</Row>
							<Row label='Corners'>
								<Num
									value={b.radius}
									max={40}
									onChange={v => set({ radius: v })}
								/>
							</Row>
						</Section>
					</>
				);
			}
			case 'divider':
				return (
					<Section title='Line'>
						<Row label='Thickness'>
							<Num
								value={b.thickness}
								min={0.25}
								max={12}
								step={0.25}
								onChange={v => set({ thickness: v })}
							/>
						</Row>
						<Row label='Colour'>
							<Color
								value={b.color}
								onChange={v => set({ color: v })}
							/>
						</Row>
						<Toggle
							label='Dashed'
							checked={b.dashed}
							onChange={v => set({ dashed: v || undefined })}
						/>
					</Section>
				);
			case 'spacer':
				return (
					<Section
						title='Space'
						action={<DocLink section='layout' label='?' />}>
						<Toggle
							label='Fill the free space'
							checked={Number(b.grow) > 0}
							onChange={v => set({ grow: v ? 1 : undefined })}
						/>
						<Text
							fontSize='11px'
							color='fg.muted'
							mt={-1}>
							{fillHint(place)}
						</Text>
						<Row label={Number(b.grow) > 0 ? (inRow ? 'Least width' : 'Least height') : inRow ? 'Width' : 'Height'}>
							<Num
								value={b.height}
								min={1}
								max={400}
								onChange={v => set({ height: v })}
							/>
						</Row>
					</Section>
				);
			case 'pageBreak':
				return (
					<Section title='Page break'>
						<Text
							fontSize='xs'
							color='fg.muted'>
							What follows starts on a new page. Only in the body, at the top level.
						</Text>
					</Section>
				);
			case 'fields':
				return (
					<>
						<Section
							title='Rows'
							action={
								<Button
									size='2xs'
									variant='ghost'
									onClick={() => set({ rows: [...(b.rows || []), { label: 'Label', value: '' }] })}>
									<Plus {...small} />
									Row
								</Button>
							}>
							{(b.rows || []).map((r: any, i: number) => (
								<Box
									key={i}
									borderWidth='1px'
									borderColor='border'
									borderRadius='md'
									p={2}>
									<Flex
										align='center'
										mb={1}>
										<Text
											fontSize='11px'
											color='fg.muted'
											flex='1'>
											Row {i + 1}
										</Text>
										<ItemTools
											i={i}
											n={b.rows.length}
											onMove={by => set({ rows: listMove(b.rows, i, by) })}
											onRemove={() => set({ rows: listEdit(b.rows, i, null) })}
										/>
									</Flex>
									<Flex
										direction='column'
										gap={1.5}>
										<TokenText
											value={r.label}
											placeholder='Label'
											onChange={v => set({ rows: listEdit(b.rows, i, { label: v }) })}
											ctx={ctx}
										/>
										<TokenText
											value={r.value}
											placeholder={`{{${alias}.total | money}}`}
											onChange={v => set({ rows: listEdit(b.rows, i, { value: v }) })}
											ctx={ctx}
										/>
										<Flex
											gap={3}
											wrap='wrap'>
											{(['bold', 'big', 'bar', 'line'] as const).map(k => (
												<Toggle
													key={k}
													label={{ bold: 'Bold', big: 'Big', bar: 'Filled band', line: 'Line above' }[k]}
													checked={r[k]}
													onChange={v => set({ rows: listEdit(b.rows, i, { [k]: v || undefined }) })}
												/>
											))}
										</Flex>
									</Flex>
								</Box>
							))}
						</Section>
						<Section title='Layout'>
							<Row label='Label width'>
								<Num
									value={Math.round((b.labelWidth ?? 0.5) * 100)}
									min={10}
									max={90}
									unit='%'
									onChange={v => set({ labelWidth: (v ?? 50) / 100 })}
								/>
							</Row>
							<Row label='Values'>
								<Pick
									value={b.align || 'left'}
									options={[
										['left', 'Next to the label'],
										['right', 'At the right edge'],
									]}
									onChange={v => set({ align: v })}
								/>
							</Row>
							<Row label='Between rows'>
								<Num
									value={b.gap}
									max={20}
									placeholder='3'
									onChange={v => set({ gap: v })}
								/>
							</Row>
							<Toggle
								label='Hide rows with no value'
								checked={b.hideEmpty}
								onChange={v => set({ hideEmpty: v || undefined })}
							/>
							<TextStyle
								b={b}
								set={set}
								align={false}
								more={false}
							/>
						</Section>
					</>
				);
			case 'table': {
				const tree = ctx.tree;
				const lists = flattenFields(tree?.fields || []).filter(f => f.type === 'list');
				const options: [string, string][] = [
					['', 'Pick a list'],
					...lists.map(f => [`${alias}.${f.path}`, `${f.label} (rows in this record)`] as [string, string]),
					...(ctx.template.lists || []).map(l => [l.name, `${l.name} — from another page`] as [string, string]),
				];
				if (b.rows && !options.some(o => o[0] === b.rows)) options.push([b.rows, b.rows]);
				return (
					<>
						<Section title='Rows'>
							<Row
								label='One row per'
								hint='Records from another page: add them as a list under Page → Lists.'>
								<Pick
									value={b.rows || ''}
									options={options}
									onChange={v => set({ rows: v })}
								/>
							</Row>
						</Section>
						<Section
							title='Columns'
							action={
								<Button
									size='2xs'
									variant='ghost'
									disabled={(b.columns || []).length >= 12}
									onClick={() => set({ columns: [...(b.columns || []), { header: 'Column', value: '', width: 1, align: 'left' }] })}>
									<Plus {...small} />
									Column
								</Button>
							}>
							{(b.columns || []).map((c: any, i: number) => (
								<Box
									key={i}
									borderWidth='1px'
									borderColor='border'
									borderRadius='md'
									p={2}>
									<Flex
										align='center'
										mb={1}
										gap={2}>
										<Text
											fontSize='11px'
											color='fg.muted'
											flex='1'>
											Column {i + 1}
										</Text>
										<Box w='70px'>
											<Num
												value={c.width}
												min={0.1}
												max={12}
												step={0.1}
												unit='×'
												onChange={v => set({ columns: listEdit(b.columns, i, { width: v ?? 1 }) })}
											/>
										</Box>
										<Box w='84px'>
											<Pick
												value={c.align || 'left'}
												options={ALIGN}
												onChange={v => set({ columns: listEdit(b.columns, i, { align: v }) })}
											/>
										</Box>
										<ItemTools
											i={i}
											n={b.columns.length}
											onMove={by => set({ columns: listMove(b.columns, i, by) })}
											onRemove={() => set({ columns: listEdit(b.columns, i, null) })}
										/>
									</Flex>
									<Flex
										direction='column'
										gap={1.5}>
										<TokenText
											value={c.header}
											placeholder='Heading'
											onChange={v => set({ columns: listEdit(b.columns, i, { header: v }) })}
											ctx={ctx}
										/>
										<TokenText
											value={c.value}
											placeholder='{{item.amount | money}}'
											onChange={v => set({ columns: listEdit(b.columns, i, { value: v }) })}
											ctx={{ ...ctx, rows: b.rows }}
											inTable
										/>
									</Flex>
								</Box>
							))}
						</Section>
						<Section title='Look'>
							<Row label='Heading fill'>
								<Color
									value={b.headerBg}
									placeholder='None'
									onChange={v => set({ headerBg: v })}
								/>
							</Row>
							<Row label='Heading text'>
								<Color
									value={b.headerColor}
									onChange={v => set({ headerColor: v })}
								/>
							</Row>
							<Row label='Lines'>
								<Pick
									value={b.lines || 'rows'}
									options={[
										['rows', 'Between rows'],
										['grid', 'Grid'],
										['none', 'None'],
									]}
									onChange={v => set({ lines: v })}
								/>
							</Row>
							<Row label='Cell padding'>
								<Num
									value={b.pad}
									max={20}
									placeholder='5'
									onChange={v => set({ pad: v })}
								/>
							</Row>
							<Toggle
								label='Shade every other row'
								checked={b.zebra}
								onChange={v => set({ zebra: v || undefined })}
							/>
							<TokenText
								label='When there are no rows'
								value={b.emptyText}
								placeholder='No items'
								onChange={v => set({ emptyText: v })}
								ctx={ctx}
							/>
							<TextStyle
								b={b}
								set={set}
								align={false}
								more={false}
							/>
						</Section>
					</>
				);
			}
		}
		return null;
	})();

	return (
		<Box>
			<Flex
				align='center'
				gap={1}
				pb={3}>
				<Text
					fontSize='sm'
					fontWeight='600'
					flex='1'>
					{labelOf(b)}
				</Text>
				<IconButton
					size='2xs'
					variant='ghost'
					aria-label={inRow ? 'Move left' : 'Move up'}
					title={inRow ? 'Move left' : 'Move up'}
					onClick={() => onMove(-1)}>
					{inRow ? <ArrowLeft {...ICON} /> : <ArrowUp {...ICON} />}
				</IconButton>
				<IconButton
					size='2xs'
					variant='ghost'
					aria-label={inRow ? 'Move right' : 'Move down'}
					title={inRow ? 'Move right' : 'Move down'}
					onClick={() => onMove(1)}>
					{inRow ? <ArrowRight {...ICON} /> : <ArrowDown {...ICON} />}
				</IconButton>
				<IconButton
					size='2xs'
					variant='ghost'
					aria-label='Duplicate'
					title='Duplicate'
					onClick={onDuplicate}>
					<Copy {...ICON} />
				</IconButton>
				<IconButton
					size='2xs'
					variant='ghost'
					aria-label='Delete'
					title='Delete'
					color='red.500'
					_dark={{ color: 'red.300' }}
					onClick={onRemove}>
					<Trash2 {...ICON} />
				</IconButton>
			</Flex>
			{body}
			{inRow && b.type !== 'spacer' && b.type !== 'pageBreak' && (
				<Section
					title='Width in the row'
					action={<DocLink section='layout' label='?' />}>
					<Pick
						value={Number(b.grow) > 0 ? 'fill' : b.basis ? 'fixed' : 'fit'}
						options={[
							['fit', FILLERS.has(b.type) ? 'Auto — shares the free width' : 'Fit its content'],
							['fill', 'Fill the free space'],
							['fixed', 'Fixed width'],
						]}
						onChange={v => set(v === 'fill' ? { grow: 1, basis: undefined } : v === 'fixed' ? { grow: undefined, basis: b.basis || 120 } : { grow: undefined, basis: undefined })}
					/>
					{!!b.basis && !(Number(b.grow) > 0) && (
						<Row label='Width'>
							<Num
								value={b.basis}
								min={4}
								max={1200}
								onChange={v => set({ basis: v })}
							/>
						</Row>
					)}
				</Section>
			)}
			{!inRow && b.type === 'box' && (
				<Section title='Height'>
					<Toggle
						label='Fill the free space'
						checked={Number(b.grow) > 0}
						onChange={v => set({ grow: v ? 1 : undefined })}
					/>
					<Text
						fontSize='11px'
						color='fg.muted'
						mt={-1}>
						{fillHint(place)}
					</Text>
				</Section>
			)}
			<Section title='Space'>
				<Row label='Above'>
					<Num
						value={b.mt}
						max={200}
						placeholder='0'
						onChange={v => set({ mt: v })}
					/>
				</Row>
				<Row label='Below'>
					<Num
						value={b.mb}
						max={200}
						placeholder='0'
						onChange={v => set({ mb: v })}
					/>
				</Row>
			</Section>
			<Section
				title='Show only when'
				action={<DocLink section='conditions' label='?' />}>
				<ConditionsEditor
					fields={conditionFields}
					where={(b.showIf || []) as any}
					onChange={w => set({ showIf: w.length ? (w as any) : undefined })}
					match={b.showMatch || 'all'}
					onMatch={m => set({ showMatch: m === 'any' ? 'any' : undefined })}
					hint='Printed only when these hold for the record.'
					emptyHint='Always printed. Add a condition to print it only sometimes — a PAID stamp when the status is paid.'
				/>
			</Section>
		</Box>
	);
};

export default Properties;
