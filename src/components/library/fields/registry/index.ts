export type {
	FieldTypeDescriptor,
	FieldTypeId,
	TableTypeId,
	ViewTypeId,
	StorageTypeId,
	FieldFamily,
	ResolvedField,
	FieldInputProps,
	CellProps,
	ViewProps,
} from './types';

export {
	registerFieldType,
	getFieldTypeDescriptor,
	getAllFieldTypeDescriptors,
	hasFieldTypeDescriptor,
} from './registry';

// Re-export as InputDataType so nothing downstream breaks (WO-09 requirement) —
// this is the same alias inputDataOptions.ts already produces, just reachable
// from the new registry module too.
export type { FieldTypeId as InputDataType } from './types';
