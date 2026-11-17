import { hiddenFormFields } from '../../functions/formRules';
import { meets } from '../../functions/fieldLocks';

/**
 * Form in pages (backend docs/multi-page-forms): the add / edit page as steps.
 *
 * `/get/config` hands over `formSteps { review, steps: [{ key, title, description }] }`
 * only when they're on and the form opens as its own page, and every form field
 * carries its section's `step` (and `side` for the side column). A field on no
 * page, or on a page that's gone, shows on the last page (D3); a page with no
 * fields is skipped.
 */

export type FormStep = { key: string; title: string; description?: string };
export type FormStepsConfig = { review?: boolean; steps: FormStep[] };
export type StepPage = FormStep & { fields: any[]; review?: boolean };

export const REVIEW_KEY = '__review';

/** The steps from a `/get/config` answer, or undefined for a one-page form. */
export const stepsOf = (config: any): FormStepsConfig | undefined => {
	const fs = config?.formSteps;
	return Array.isArray(fs?.steps) && fs.steps.length ? fs : undefined;
};

/** The pages people go through: each step's fields (form order), empty ones dropped, then Review. */
export const pagesOf = (fields: any[], fs: FormStepsConfig): StepPage[] => {
	const keys = new Set(fs.steps.map(s => s.key));
	const last = fs.steps[fs.steps.length - 1]?.key;
	const pageOf = (f: any) => (f?.step && keys.has(f.step) ? f.step : last);
	const pages: StepPage[] = fs.steps.map(s => ({ ...s, fields: fields.filter(f => pageOf(f) === s.key) })).filter(p => p.fields.length);
	if (fs.review && pages.length) pages.push({ key: REVIEW_KEY, title: 'Review', description: 'Check everything before saving.', fields: [], review: true });
	return pages;
};

/** The page a field is drawn on. */
export const stepOfField = (field: any, fs: FormStepsConfig) => {
	const keys = new Set(fs.steps.map(s => s.key));
	return field?.step && keys.has(field.step) ? field.step : fs.steps[fs.steps.length - 1]?.key;
};

const blank = (v: any) => v === undefined || v === null || v === '' || (Array.isArray(v) && !v.length);

/** Is a field shown right now (not hidden by its conditions)? */
export const shownNow = (item: any, hidden: Set<string>, formData: any) =>
	!hidden.has(item?.name) && !(typeof item?.renderCondition === 'function' && !item.renderCondition(formData));

/** Required now: always, or while a Linked Relationships rule asks for it (FormMain's `requiredNow`). */
const requiredNow = (item: any, formData: any) =>
	!!item?.isRequired ||
	(Array.isArray(item?.requiredIf) && item.requiredIf.some((r: any) => !r?.when?.length || meets(formData, r.when, r.match, { this: formData })));

/**
 * The shown, required, empty fields among `pageFields` — what stops Next. Conditions
 * are worked out over the whole form (a page-2 field can depend on a page-1 one).
 */
export const missingOn = (pageFields: any[], allFields: any[], formData: any): any[] => {
	const hidden = hiddenFormFields(allFields, formData);
	return pageFields.filter(
		f => f?.name && f.type !== 'read-only' && f.type !== 'locked' && !f.locked && requiredNow(f, formData) && shownNow(f, hidden, formData) && blank(formData?.[f.name])
	);
};
