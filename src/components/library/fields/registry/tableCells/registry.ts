import type { ComponentType } from 'react';
import type { TableTypeId } from '../types';
import {
	CheckboxCell,
	TagCell,
	NumberCell,
	ImageTextCell,
	TimeCell,
	DateOnlyCell,
	DateCell,
	BooleanCell,
	ExternalLinkCell,
	FileCell,
	TextCell,
	PriceCell,
	DataArrayCell,
	DataArrayCountCell,
	InvitationStatusCell,
	PasswordCell,
} from './cells';
import HistoryCell from './HistoryCell';

// WO-13: TableData.tsx's `TableBody` switch, as data. 'menu' is deliberately
// absent — convertToTableFields.ts appends the menu column separately and
// TableRowComponent intercepts it upstream of TableData, same as before.
export const TABLE_CELLS: Partial<Record<TableTypeId, ComponentType<any>>> = {
	checkbox: CheckboxCell,
	tag: TagCell,
	number: NumberCell,
	'image-text': ImageTextCell,
	time: TimeCell,
	'date-only': DateOnlyCell,
	date: DateCell,
	boolean: BooleanCell,
	'external-link': ExternalLinkCell,
	file: FileCell,
	text: TextCell,
	price: PriceCell,
	'data-array': DataArrayCell,
	'data-array-count': DataArrayCountCell,
	password: PasswordCell,
};

/**
 * Cell types that are handed the whole row document, not just their own value.
 *
 * Kept as an opt-in set because every other cell spreads its rest props onto
 * the <td>: handing `doc` to all of them would put an object on a DOM node.
 */
export const CELLS_WITH_DOC = new Set(['history']);

// Not in TABLE_CELLS/TableTypeId — genuinely new, narrow fields (invitation
// status; the history sentence) rather than extensions of the shared type
// vocabulary, so they're special-cased here instead of widening
// TableDataFieldType for one column each.
export const getTableCell = (type: TableTypeId | string | undefined) => {
	if (type === 'invitation-status') return InvitationStatusCell;
	if (type === 'history') return HistoryCell;
	return (type && TABLE_CELLS[type as TableTypeId]) || TextCell;
};
