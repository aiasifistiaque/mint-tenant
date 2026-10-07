import { TableCellProps, useClipboard } from '@chakra-ui/react';
import { FC } from 'react';
import { TableObjectDataProps } from '../../../..';
import { Copy as CopyIcon } from 'lucide-react';
import { getTableCell, CELLS_WITH_DOC } from '@/components/library/fields/registry/tableCells';

// Define the type for the props of the TableData component
type TableDataPropsType = TableCellProps &
	TableObjectDataProps & {
		children: any;
		colorPalette?: any;
		/** The whole row document. Forwarded only to the cell types listed in
		 *  `CELLS_WITH_DOC` — every other cell spreads its rest props straight
		 *  onto the <td>, where an object prop would just be a DOM warning. */
		doc?: any;
		item?: any;
		copy?: boolean;
		colorTheme?: any;
	};

const TableData: FC<TableDataPropsType> = ({
	children,
	id,
	copy,
	type,
	colorPalette,
	toLocaleStr,
	tagType,
	imageKey,
	item,
	doc,
	...props
}) => {
	const { copy: onCopy, copied: hasCopied } = useClipboard(children);
	// No `key` in here. It used to be declared as a prop and forwarded, which
	// React flags twice over: reading `props.key` always yields undefined, and
	// spreading an object that carries `key` into JSX is not how a key is set.
	// The key belongs on the element at the call site, which TableRowComponent
	// already does.
	const commonProps = {
		toLocaleStr,
		colorPalette,
		type,
		tagType,
		imageKey,
		...props,
	};
	if (copy) {
		if (!children) return <TableBody {...commonProps} doc={doc}>--</TableBody>;
		// A Tooltip.Trigger `asChild` around this used to be here, but
		// TableBody resolves to a dynamic `Cell` component (getTableCell) that
		// doesn't forward a single ref, so Ark fell back to rendering its own
		// wrapper <div>. A <div> isn't a valid child of <tr> next to the real
		// <td> cells, so the browser foster-parented it out of the table
		// entirely — breaking row height calculation and overlapping this
		// row's wrapped text over the next row. A native `title` attribute
		// gives the same "click to copy" hint without adding any element.
		return (
			<TableBody
				item={item}
				doc={doc}
				{...commonProps}
				cursor='pointer'
				onClick={onCopy}
				title={hasCopied ? 'Copied!' : 'Click to Copy'}
				{...props}>
				{children}
				<CopyIcon
					size={16}
					style={{ marginLeft: '8px' }}
				/>
			</TableBody>
		);
	}

	return (
		<TableBody
			item={item}
			doc={doc}
			{...commonProps}>
			{children}
		</TableBody>
	);
};

// WO-13: was a 15-case switch (TableBody delegates to a `type -> cell
// component` map now — see fields/registry/tableCells/). 'price', 'data-array'
// and 'data-array-count' used to have no case at all (silently fell to
// `default`, i.e. rendered raw); they're real cells now.
const TableBody: FC<TableDataPropsType> = ({ type, doc, ...props }) => {
	const Cell = getTableCell(type);
	return (
		<Cell
			type={type}
			{...(type && CELLS_WITH_DOC.has(type) ? { doc } : {})}
			{...props}
		/>
	);
};

export default TableData;
