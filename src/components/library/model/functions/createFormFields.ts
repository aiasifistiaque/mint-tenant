import { FormLayout } from '../../types';
import assertSchema from './assertSchema';

// WO-03 note: see convertToTableFields.ts — kept as `any` because a second,
// incompatible schema-prop vocabulary (defect #15) is still passed in by some
// callers. assertSchema below still validates the actual shape at runtime in dev.
type CreateType = {
	schema: any;
	layout: FormLayout;
	type?: 'post' | 'update';
	modelName?: string;
};

const createType = ({ type, isReadOnly, fieldType }: any) => {
	if (type == 'update' && isReadOnly) {
		return 'read-only';
	}
	return fieldType;
};

// WO-06: single whitelist-driven mapper. Both the scalar and the array-of-fields
// branches in createFormFields call this instead of hand-copying the same ~20
// optional-prop spreads twice (and drifting, per WO-05/WO-11 defects).
const OPTIONAL_FIELD_PROPS = [
	'limit',
	'section',
	'placeholder',
	'options',
	'model',
	'menuKey',
	'menuAddOnKey',
	'style',
	'renderIf',
	'formula',
	'folder',
	'labelKey',
	'valueKey',
	'modelAddOn',
	'value',
	'fetch',
	'isExcluded',
	'getValue',
	'renderCondition',
	'tooltip',
	'colorTheme',
	// Record pickers: a + to add a linked record, and which records are offered.
	'addItem',
	'optionFilters',
] as const;

const createResolvedField = ({
	name,
	fieldConfig,
	type,
	sectionMeta,
	lastElement,
}: {
	name: string;
	fieldConfig: any;
	type: 'post' | 'update';
	sectionMeta?: { sectionTitle?: string; description?: string; collapsible?: boolean };
	lastElement: boolean;
}) => {
	const typeDetail = createType({
		type,
		isReadOnly: fieldConfig?.readOnlyOnUpdate || false,
		fieldType: fieldConfig?.type,
	});

	const resolved: any = {
		...sectionMeta,
		name,
		label: fieldConfig.label || fieldConfig.title,
		isRequired: fieldConfig.isRequired || fieldConfig.required || false,
		type: typeDetail,
		span: 1,
		endOfSection: lastElement,
		...(fieldConfig?.helperText && { helper: fieldConfig.helperText }),
		// WO-05: this was `fieldConfig.model` in the array branch — dataModel must
		// come from dataModel, `model` is the unrelated related-collection name.
		...(fieldConfig?.dataModel && { dataModel: fieldConfig.dataModel }),
		...(fieldConfig?.options && { dataModel: fieldConfig.options }),
	};

	OPTIONAL_FIELD_PROPS.forEach(key => {
		const value = (fieldConfig as any)?.[key];
		if (value !== undefined && value !== null && value !== '' && !(key in resolved)) {
			resolved[key] = value;
		}
	});

	// WO-05: emit valueKey (what FormInput/VDataSelect read), not the legacy valKey
	// typo. Keep valKey too as a deprecated fallback for VDataTags until it's migrated.
	if (fieldConfig?.valueKey) resolved.valueKey = fieldConfig.valueKey;
	else if (fieldConfig?.valKey) resolved.valueKey = fieldConfig.valKey;
	if (fieldConfig?.valKey) resolved.valKey = fieldConfig.valKey;

	return resolved;
};

const createFormFields = ({ schema, layout, type = 'post', modelName = 'unknown' }: CreateType): any[] => {
	assertSchema(schema, modelName);

	const dataFields: any[] = [];

	if (!layout) return [];

	layout?.forEach((section: any) => {
		const { sectionTitle, fields, description, collapsible } = section;

		fields?.forEach((field: any, index: number) => {
			const lastElement = index === fields.length - 1;
			const firstIndex = index === 0;

			if (Array.isArray(field)) {
				field?.forEach((subField: any, subIndex: number) => {
					const fieldConfig = schema?.[subField];
					const lastSubIndex = subIndex === field.length - 1;
					const firstSubIndex = subIndex === 0;

					if (fieldConfig) {
						dataFields.push(
							createResolvedField({
								name: subField,
								fieldConfig,
								type,
								sectionMeta: firstIndex && firstSubIndex ? { sectionTitle, description, collapsible } : undefined,
								lastElement: lastElement && lastSubIndex,
							})
						);
					}
				});
			} else {
				const fieldConfig = schema?.[field];

				if (fieldConfig) {
					dataFields.push(
						createResolvedField({
							name: field,
							fieldConfig,
							type,
							sectionMeta: firstIndex ? { sectionTitle, description, collapsible } : undefined,
							lastElement,
						})
					);
				}
			}
		});
	});

	return dataFields;
};

export default createFormFields;
