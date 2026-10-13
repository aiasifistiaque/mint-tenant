'use client';

import { FC } from 'react';
import { Box, Button, Flex, IconButton, Text } from '@chakra-ui/react';
import { ArrowDown, ArrowUp, Copy, Plus, Trash2, X } from 'lucide-react';
import ConditionsEditor from '@/app/builder/_components/ConditionsEditor';
import { ModelField } from '@/app/builder/_components/filterTypes';
import { Block, blockLabel, flattenFields } from '@/components/library/pdf/types';
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
};

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

const Properties: FC<Props> = ({ block: b, onChange: set, ctx, conditionFields, onRemove, onDuplicate, onMove }) => {
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
							<Flex
								key={i}
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
						))}
						<Text
							fontSize='11px'
							color='fg.subtle'>
							Width is a share: 2 and 1 make the first twice as wide. Add blocks into a column from the outline.
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
			case 'box':
				return (
					<Section title='Box'>
						<Row label='Padding'>
							<Num
								value={b.pad}
								max={80}
								onChange={v => set({ pad: v })}
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
				);
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
					<Section title='Space'>
						<Row label='Height'>
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
					{blockLabel(b.type)}
				</Text>
				<IconButton
					size='2xs'
					variant='ghost'
					aria-label='Move up'
					title='Move up'
					onClick={() => onMove(-1)}>
					<ArrowUp {...ICON} />
				</IconButton>
				<IconButton
					size='2xs'
					variant='ghost'
					aria-label='Move down'
					title='Move down'
					onClick={() => onMove(1)}>
					<ArrowDown {...ICON} />
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
