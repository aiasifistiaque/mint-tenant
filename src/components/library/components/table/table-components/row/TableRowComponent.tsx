import { FC } from 'react';

import { format } from 'date-fns';
import { GridItem, Heading, StackProps, TableRowProps } from '@chakra-ui/react';
import {
	TableRow,
	EditableTableData,
	TableData,
	TableMenu,
	MenuButton,
	CustomTd,
} from '../../../..';

import { useIsCardView } from '../../../../hooks';

import { formatDataKey, formatFieldTitle } from '../../../../functions';
import { Column } from '../../../../containers';
import { affixOf, fieldText } from '../../../../functions/affix';
import { OptionTags } from '../../../../functions/optionColors';

type TableProps = StackProps &
	TableRowProps & {
		item: any;
		data: any[];
		menu: any;
		path: string;
		fields?: string[] | [];
		selectable?: boolean;
		clickable?: boolean;
	};

const TableRowComponent: FC<TableProps> = ({
	item,
	data,
	menu,
	path,
	fields = [],
	clickable,
	selectable,
	...props
}) => {
	const isCardView = useIsCardView();

	return (
		// Create a TableRow for each item
		<TableRow
			cursor={clickable ? 'pointer' : 'default'}
			selectable={selectable}
			id={item?._id}
			actions={<div></div>}
			{...props}>
			{/* If the table is selectable, return a TableData cell with a checkbox */}
			{/* Map over the data keys and create a TableData cell for each */}
			{data?.map((val: any, index: number) => {
				const {
					dataKey,
					type,
					image,
					imageKey,
					toLocaleStr,
					editable,
					editType,
					options,
					style,
					tagType,
					displayValue,
					colorPalette,
					colorTheme,
					copy,
					bold,
					affix,
					subtitle,
				} = val;
				// A column is keyed by its dataKey, but not every column has one —
				// the menu column is defined by `type` alone, so `key={dataKey}`
				// was `key={undefined}` there, i.e. no key at all as far as React
				// is concerned. Hence "each child in a list should have a unique
				// key" pointing at a child of <tr>.
				const columnKey = dataKey ?? `${type ?? 'col'}-${index}`;

				// Split the dataKey into keys
				const keys = dataKey?.split('.');
				// Use the keys to get the value from the item
				const value =
					keys && keys?.length > 1
						? keys?.reduce((o: any, k: any) => (o && o[k] ? o[k] : undefined), item)
						: item[dataKey];

				// Words around the value (settings `affix`) and a second field under it
				// (`subtitle`), for this row. An empty value gets neither words.
				const filled = value !== null && value !== undefined && value !== '';
				const words = affix && filled ? affixOf(affix, item) : null;
				const dress = {
					...(words?.before && { affixBefore: words.before }),
					...(words?.after && { affixAfter: words.after }),
					...(subtitle && fieldText(item, subtitle) && { subtitle: fieldText(item, subtitle) }),
				};

				// If the type is 'menu', return a TableMenu component
				if (type == 'menu')
					if (!menu) return null;
					else
						return isCardView ? (
							// The button pins itself to the card's top-right corner (see
							// MenuButton) rather than flowing with the fields — the menu
							// column sits at a different position in every table's schema,
							// so in flow it landed somewhere different on each screen.
							<TableMenu
								path={path}
								data={menu}
								id={item?._id}
								doc={item}
								key={columnKey}
								title={item[dataKey]}>
								<MenuButton />
							</TableMenu>
						) : (
							// The button is the menu's anchor, not the whole cell: anchored to
							// the cell, the menu opened below the bottom of a tall row.
							<CustomTd key={columnKey}>
								<TableMenu
									path={path}
									data={menu}
									id={item?._id}
									doc={item}
									title={item[dataKey]}>
									<MenuButton />
								</TableMenu>
							</CustomTd>
						);

				// If the item name is not in the fields array and type is not 'menu', return null
				if (!fields?.includes(dataKey) && type !== 'menu') {
					return null;
				}

				// If the item is editable, return an EditableTableData component
				if (editable && !clickable)
					return (
						<Container key={columnKey}>
							{isCardView && <Heading {...cardLabelCss}>{formatDataKey(dataKey)}</Heading>}
							<EditableTableData
								type={type}
								dataKey={dataKey}
								path={path}
								value={
									editType == 'date' ? format(new Date(item[dataKey]), 'yyyy-MM-dd') : item[dataKey]
								}
								id={item?._id}
								editType={editType}
								options={options}
								style={style}
							/>
						</Container>
					);

				// A choice shown as coloured tags (settings colorTags): each option in its colour.
				if (val.colorTags)
					return (
						<Container
							key={columnKey}
							type={type}
							isCardView={isCardView}
							value={value}>
							{isCardView && (
								<Heading {...cardLabelCss}>{formatFieldTitle({ field: dataKey, schema: data })}</Heading>
							)}
							<CustomTd
								type='option-tag'
								{...dress}>
								{value === undefined || value === null || value === '' ? undefined : (
									<OptionTags
										value={value}
										field={val}
									/>
								)}
							</CustomTd>
						</Container>
					);

				// Return a TableData cell with the value
				return (
					<Container
						key={columnKey}
						type={type}
						copy={copy}
						isCardView={isCardView}
						value={value}>
						{isCardView && type !== 'image-text' && (
							<Heading {...cardLabelCss}>
								{formatFieldTitle({ field: dataKey, schema: data })}
							</Heading>
						)}

						<TableData
							colorTheme={colorTheme}
							copy={copy}
							// Spread onto the cell after tdCss, so this wins over its
							// default 400. Undefined when the column isn't bold, which
							// leaves tdCss's value untouched rather than overriding it
							// with another 400.
							fontWeight={bold ? '600' : undefined}
							toLocaleStr={toLocaleStr}
							colorPalette={colorPalette}
							type={type}
							item={val}
							// `item` is the column's schema entry; `doc` is the row itself.
							// Cells that render one value never need it, but a few (the
							// history sentence) have to reach other fields on the same row.
							doc={item}
							tagType={tagType}
							imageKey={item[imageKey]}
							{...dress}>
							{value}
						</TableData>
					</Container>
				);
			})}
		</TableRow>
	);
};

const cardLabelCss = {
	fontSize: '10px',
	fontWeight: '600',
	letterSpacing: '0.06em',
	textTransform: 'uppercase' as const,
	color: 'fg.muted',
	lineHeight: '1.4',
	mb: 0.5,
};

const Container = ({ children, isCardView, type, value, copy, ...props }: any) => {
	const styleProps = {
		...props,
	};
	if (isCardView && type !== 'image-text') {
		return (
			// This is a direct child of RowContainerBase's `1fr 1fr` grid. A bare
			// `1fr` track is really `minmax(auto, 1fr)`, so without `minW={0}`
			// here the track won't shrink below this item's content size — a long
			// unbroken value (a URL) further down would still blow the column
			// past its fair half and push the other column off the card.
			<Column
				gap={0}
				minW={0}
				{...styleProps}>
				{children}
			</Column>
		);
	}
	if (isCardView) {
		return (
			<GridItem
				{...styleProps}
				colSpan={2}>
				{children}
			</GridItem>
		);
	}

	// Desktop wants no wrapper element at all here (TableData already renders
	// its own <td>) — a real Fragment, not a styled Flex asked to impersonate
	// one: Flex always injects its own layout styles (display, gap, ...) onto
	// whatever `as` names, and Fragment can't accept those, which is what was
	// spamming "invalid prop supplied to React.Fragment" for every table cell.
	return <>{children}</>;
};

export default TableRowComponent;
