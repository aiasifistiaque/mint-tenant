import inputDataOptions, { PLANNED_FIELD_TYPES } from '../../types/data-types/inputDataOptions';

// WO-04: dev-only guard. Kept in sync by hand with CommonProps (schema.types.ts) —
// there is deliberately no reflection here, this file has zero runtime deps beyond
// the type-id lists so it can be called from every converter cheaply.
const ALLOWED_FIELD_KEYS = new Set([
	'label',
	'type',
	'inputLabel',
	'isRequired',
	'required',
	'title',
	'sort',
	'tableType',
	'imageKey',
	'default',
	'menuKey',
	'menuAddOnKey',
	'displayInTable',
	'model',
	'dataModel',
	'viewType',
	'objectKey',
	'options',
	'placeholder',
	'colorPalette',
	'renderCondition',
	'tableKey',
	'viewKey',
	'menuField',
	'limit',
	'copy',
	'helperText',
	'tooltip',
	'modelAddOn',
	'tableLabel',
	'editable',
	'editType',
	'colorTheme',
	'folder',
	'labelKey',
	'valueKey',
	'valKey',
	'readOnlyOnUpdate',
	'style',
	'hasImage',
	'helper',
	'renderIf',
	'formula',
	'displayValue',
	'path',
	'min',
	'max',
	'step',
	'threshold',
	'values',
	'section',
	'value',
	'getValue',
	'fetch',
	'isExcluded',
	// present in the SchemaProps/SchemaField vocabulary (model/types/index.ts,
	// defect #15) that some `.model.ts` files still use instead of CommonProps
	'inputType',
	'description',
	'name',
	'keywords',
	'show',
	'isDisabled',
]);

const VALID_TYPES = new Set<string>([...inputDataOptions, ...PLANNED_FIELD_TYPES]);

const warnedOnce = new Set<string>();

/**
 * Dev-mode-only schema validator. Called from createFormFields / convertTo*Fields.
 * In dev builds only:
 *  - throws on an unregistered `type` — a typo or a type nobody added to
 *    inputDataOptions/PLANNED_FIELD_TYPES.
 *  - warns (doesn't throw) on a field key not declared on CommonProps — e.g.
 *    `displayIntable` (typo of `displayInTable`), which today silently drops the
 *    column instead of erroring. This stays a warning rather than a throw because
 *    the key vocabulary is still split across two schema-prop systems (defect #15)
 *    plus ad-hoc inline schemas — see WO-03's open item on unifying them.
 * Never runs in production, so it can't turn a dev-only schema bug into an outage.
 */
export const assertSchema = (schema: Record<string, any> | undefined | null, modelName: string): void => {
	if (process.env.NODE_ENV === 'production' || !schema) return;

	Object.entries(schema).forEach(([fieldKey, fieldConfig]) => {
		if (!fieldConfig || typeof fieldConfig !== 'object') return;

		const { type } = fieldConfig as { type?: string };

		if (type && !VALID_TYPES.has(type)) {
			throw new Error(
				`[assertSchema] ${modelName}.${fieldKey}: unregistered field type "${type}". ` +
					`Add it to inputDataOptions or PLANNED_FIELD_TYPES ` +
					`(src/components/library/types/data-types/inputDataOptions.ts).`
			);
		}

		if (type && PLANNED_FIELD_TYPES.includes(type as any)) {
			const warnKey = `${modelName}.${fieldKey}`;
			if (!warnedOnce.has(warnKey)) {
				warnedOnce.add(warnKey);
				// eslint-disable-next-line no-console
				console.warn(
					`[assertSchema] ${modelName}.${fieldKey}: type "${type}" has no FormInput case yet ` +
						`(PLANNED_FIELD_TYPES) — it renders as a plain text box until implemented.`
				);
			}
		}

		Object.keys(fieldConfig).forEach(key => {
			if (!ALLOWED_FIELD_KEYS.has(key)) {
				// Warn, don't throw: the key vocabulary is still split across two
				// parallel schema-prop systems (defect #15 — CommonProps here vs.
				// SchemaField in model/types/index.ts) plus ad-hoc inline schemas in
				// src/app/**, so an unrecognised key isn't reliably a typo yet.
				const warnKey = `${modelName}.${fieldKey}.${key}`;
				if (!warnedOnce.has(warnKey)) {
					warnedOnce.add(warnKey);
					// eslint-disable-next-line no-console
					console.warn(
						`[assertSchema] ${modelName}.${fieldKey}: unknown schema key "${key}" — not declared ` +
							`on CommonProps (src/components/library/types/schema.types.ts). Typo?`
					);
				}
			}
		});
	});
};

export default assertSchema;
