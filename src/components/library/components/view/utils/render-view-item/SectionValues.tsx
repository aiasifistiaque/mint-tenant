import { FC, ReactNode } from 'react';
import { Box, Flex, Image, Table, Text } from '@chakra-ui/react';
import moment from 'moment';

/**
 * How a section's values read on a view page — built from the section's own
 * fields (`dataModel`: `{ name, label, type }`, as the model builder
 * generates them):
 *
 * - SectionRows: a list's rows as a table, one column per field, with a
 *   totals line under the number columns (an invoice's items and their sum);
 * - SectionObject: a single section's values as label / value lines.
 */

type Sub = { name: string; label?: string; type?: string; options?: { value: any; label?: string }[] };

const NUMERIC = ['number', 'formula'];

const num = (v: any) => (v === null || v === undefined || v === '' ? null : Number(v));
const fmt = (v: any) => {
	const n = num(v);
	return n === null || Number.isNaN(n) ? '' : n.toLocaleString(undefined, { maximumFractionDigits: 10 });
};

/** One value, drawn for its field's type. */
export const subValue = (f: Sub, v: any): ReactNode => {
	if (v === null || v === undefined || v === '') return <Text color='fg.subtle'>—</Text>;
	switch (f.type) {
		case 'number':
		case 'formula':
			return fmt(v);
		case 'checkbox':
			return v ? 'Yes' : 'No';
		case 'date':
			return moment(v).isValid() ? moment(v).format('DD MMM YYYY') : String(v);
		case 'image':
			return (
				<Image
					src={v}
					alt=''
					h='40px'
					w='40px'
					objectFit='cover'
					borderRadius='sm'
				/>
			);
		case 'file':
			return (
				<a
					href={v}
					target='_blank'
					rel='noreferrer'>
					<Text
						as='span'
						textDecoration='underline'>
						Open
					</Text>
				</a>
			);
		case 'color':
			return (
				<Flex
					align='center'
					gap={1.5}>
					<Box
						w='12px'
						h='12px'
						borderRadius='sm'
						bg={v}
						borderWidth='1px'
					/>
					{v}
				</Flex>
			);
		case 'select':
			return f.options?.find(o => String(o.value) === String(v))?.label || String(v);
		default:
			return typeof v === 'object' ? JSON.stringify(v) : String(v);
	}
};

export const SectionRows: FC<{ rows: any[]; dataModel: Sub[]; actions?: (index: number) => ReactNode }> = ({
	rows,
	dataModel,
	actions,
}) => {
	if (!Array.isArray(rows) || !rows.length)
		return (
			<Text
				fontSize='13px'
				color='fg.subtle'>
				No rows
			</Text>
		);
	const numbers = dataModel.filter(f => NUMERIC.includes(f.type || ''));
	const total = (f: Sub) => rows.reduce((a, r) => a + (num(r?.[f.name]) || 0), 0);
	return (
		<Box
			w='full'
			overflowX='auto'
			borderWidth='1px'
			borderRadius='md'>
			<Table.Root
				size='sm'
				variant='line'
				// Chakra's table paints its own background (solid black in dark mode); it sits on the surface around it.
				bg='transparent'
				css={{ '& tbody tr, & tfoot tr': { background: 'transparent' } }}>
				<Table.Header>
					<Table.Row bg='bg.muted'>
						<Table.ColumnHeader
							w='1%'
							color='fg.muted'>
							#
						</Table.ColumnHeader>
						{dataModel.map(f => (
							<Table.ColumnHeader
								key={f.name}
								textAlign={NUMERIC.includes(f.type || '') ? 'end' : 'start'}
								whiteSpace='nowrap'>
								{f.label || f.name}
							</Table.ColumnHeader>
						))}
						{actions && <Table.ColumnHeader w='1%' />}
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{rows.map((r, i) => (
						<Table.Row key={i}>
							<Table.Cell color='fg.muted'>{i + 1}</Table.Cell>
							{dataModel.map(f => (
								<Table.Cell
									key={f.name}
									textAlign={NUMERIC.includes(f.type || '') ? 'end' : 'start'}
									fontVariantNumeric='tabular-nums'
									maxW='320px'
									whiteSpace='pre-wrap'>
									{subValue(f, r?.[f.name])}
								</Table.Cell>
							))}
							{actions && <Table.Cell>{actions(i)}</Table.Cell>}
						</Table.Row>
					))}
				</Table.Body>
				{numbers.length > 0 && rows.length > 1 && (
					<Table.Footer>
						<Table.Row fontWeight='600'>
							<Table.Cell color='fg.muted'>Σ</Table.Cell>
							{dataModel.map(f => (
								<Table.Cell
									key={f.name}
									textAlign='end'
									fontVariantNumeric='tabular-nums'>
									{NUMERIC.includes(f.type || '') ? fmt(total(f)) : ''}
								</Table.Cell>
							))}
							{actions && <Table.Cell />}
						</Table.Row>
					</Table.Footer>
				)}
			</Table.Root>
		</Box>
	);
};

export const SectionObject: FC<{ value: any; dataModel: Sub[] }> = ({ value, dataModel }) => (
	<Flex
		direction='column'
		gap={1.5}
		w='full'>
		{dataModel.map(f => (
			<Flex
				key={f.name}
				gap={3}
				fontSize='13px'>
				<Text
					color='fg.muted'
					minW='120px'>
					{f.label || f.name}
				</Text>
				<Box>{subValue(f, value?.[f.name])}</Box>
			</Flex>
		))}
	</Flex>
);
