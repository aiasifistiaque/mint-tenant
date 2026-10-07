import { EditableField, fromServer, toServer } from '../modelKinds';
import { ModelWorking, modelBody } from '../ModelPanels';

/**
 * The feature wizard's working copy, and its conversions to and from the
 * plan the server checks and builds (backend builder/features.service.ts).
 *
 * The server's answer is the truth for what a plan means — the names models
 * register as, the links, the tabs each link suggests, the problems — while
 * the wizard keeps what the user is editing. `reconcile` lays one over the
 * other after every check.
 */

export type Tab = { from: string; fromRoute: string; field: string; title: string; enabled: boolean; suggested: boolean; edited?: boolean };
export type Link = { field: string; label: string; to: string; toRoute: string; many: boolean };

type Common = {
	/** Stable across checks. */
	id: string;
	rationale: string;
	tabs: Tab[];
	links: Link[];
	problems: string[];
	confirmed: boolean;
	skipped: boolean;
};

export type CreateStep = Common & {
	kind: 'create';
	working: ModelWorking;
	/** What the model registers as, per the last check. */
	planned: { name: string; route: string } | null;
	/** The page layout the AI suggested; used unless switched off. */
	layout: { table?: string[]; filters?: string[]; form?: any[]; view?: any[]; buttonTitle?: string } | null;
	useLayout: boolean;
};

export type UpdateStep = Common & {
	kind: 'update';
	model: string;
	title: string;
	route: string;
	built: boolean;
	/** Only here because a link in the plan puts a tab on this model's page. */
	synthesized: boolean;
	existingFields: { key: string; label: string; kind: string; ref?: string }[];
	add: EditableField[];
	change: EditableField[];
	/** Changed fields as they are now, by key. */
	before: Record<string, any>;
};

export type WizardStep = CreateStep | UpdateStep;

export type Wizard = {
	title: string;
	description: string;
	summary: string;
	/** A category id, 'new' (one named after the feature), or '' (not in the sidebar). */
	sidebarCategory: string;
	steps: WizardStep[];
	/** Which AI model drafted it, when one did. */
	aiModel?: string;
};

let n = 0;
const newId = () => `s${Date.now().toString(36)}${(n++).toString(36)}`;

export const emptyWorking = (): ModelWorking => ({
	title: '',
	name: '',
	route: '',
	description: '',
	displayField: '',
	code: { enabled: false, prefix: '', padding: 4, start: 1 },
	access: { enabled: false, default: 'private' },
	fields: [],
	active: true,
	sidebarCategory: '',
});

const tabsOf = (s: any): Tab[] => (Array.isArray(s?.tabs) ? s.tabs : []);

/** A server step as a new wizard step. */
const fromPlanStep = (s: any): WizardStep => {
	const common = {
		id: newId(),
		rationale: s.rationale || '',
		tabs: tabsOf(s),
		links: s.links || [],
		problems: s.problems || [],
		confirmed: false,
		skipped: false,
	};
	if (s.action === 'create') {
		const layout = s.table || s.filters || s.form || s.view || s.buttonTitle
			? { table: s.table, filters: s.filters, form: s.form, view: s.view, buttonTitle: s.buttonTitle }
			: null;
		return {
			...common,
			kind: 'create',
			working: {
				...emptyWorking(),
				title: s.title || '',
				name: s.requested || s.name || '',
				description: s.description || '',
				displayField: s.displayField || '',
				code: { enabled: false, padding: 4, start: 1, ...(s.code || {}), prefix: s.code?.prefix || '' },
				access: { enabled: !!s.access?.enabled, default: 'private' },
				fields: fromServer(s.fields || []),
			},
			planned: s.name && s.route ? { name: s.name, route: s.route } : null,
			layout,
			useLayout: true,
		};
	}
	return {
		...common,
		kind: 'update',
		model: s.model,
		title: s.title || s.model,
		route: s.route || '',
		built: !!s.built,
		synthesized: !!s.synthesized,
		existingFields: s.existingFields || [],
		add: fromServer(s.addFields || []),
		change: fromServer((s.changeFields || []).map(({ before, ...f }: any) => f)),
		before: Object.fromEntries((s.changeFields || []).map((f: any) => [f.key, f.before])),
	};
};

/** A whole server plan (from "Plan with AI") as a new wizard. */
export const wizardFromPlan = (plan: any, aiModel?: string): Wizard => ({
	title: plan.title || '',
	description: plan.description || '',
	summary: plan.summary || '',
	// New pages go in a category of their own unless the plan names one.
	sidebarCategory: plan.sidebarCategory || 'new',
	steps: (plan.steps || []).map(fromPlanStep),
	aiModel,
});

/** Tab overrides worth sending: switched off or renamed. Suggestions come back on their own. */
const tabOverrides = (tabs: Tab[]) =>
	tabs.filter(t => !t.enabled || t.edited || !t.suggested).map(t => ({ from: t.from, field: t.field, title: t.title, enabled: t.enabled }));

/** The steps sent to the server, in order — what `reconcile` maps the answer back onto. */
export const sentSteps = (w: Wizard) =>
	w.steps.filter(s => !s.skipped && (s.kind === 'create' || !s.synthesized || tabOverrides(s.tabs).length));

/** The wizard as the plan the server checks and builds. */
export const planFromWizard = (w: Wizard) => ({
	title: w.title.trim(),
	description: w.description,
	summary: w.summary,
	sidebarCategory: w.sidebarCategory || undefined,
	steps: sentSteps(w).map(s => {
		const tabs = tabOverrides(s.tabs);
		if (s.kind === 'create') {
			const { sidebar, active, ...body } = modelBody(s.working);
			return {
				action: 'create',
				rationale: s.rationale,
				name: s.working.name.trim() || undefined,
				route: s.working.route || undefined,
				...body,
				...(s.useLayout && s.layout ? s.layout : {}),
				...(tabs.length && { tabs }),
			};
		}
		return {
			action: 'update',
			rationale: s.rationale,
			model: s.model,
			addFields: toServer(s.add),
			changeFields: toServer(s.change),
			...(tabs.length && { tabs }),
		};
	}),
});

/**
 * The server's answer laid over the wizard: the steps sent get their problems,
 * names, links and tabs from it; steps the plan added (an existing model that
 * gets a tab) are added, and ones it no longer needs are dropped.
 */
export const reconcile = (w: Wizard, plan: any): { wizard: Wizard; globalProblems: string[] } => {
	const sent = sentSteps(w);
	const answer: any[] = plan?.steps || [];
	const byId = new Map<string, any>();
	sent.forEach((s, i) => answer[i] && byId.set(s.id, answer[i]));
	const extra = answer.slice(sent.length).filter(s => s.action === 'update' && s.synthesized);

	const steps: WizardStep[] = [];
	for (const s of w.steps) {
		const a = byId.get(s.id);
		if (s.kind === 'update' && s.synthesized && !a) {
			// Kept if the plan still puts a tab on it; otherwise its link is gone.
			const again = extra.find(x => x.model === s.model);
			if (!again) continue;
			extra.splice(extra.indexOf(again), 1);
			steps.push({ ...s, tabs: tabsOf(again), problems: again.problems || [], links: again.links || [] });
			continue;
		}
		if (!a) {
			steps.push(s.skipped ? s : { ...s, problems: [] });
			continue;
		}
		const next: any = { ...s, tabs: tabsOf(a), links: a.links || [], problems: a.problems || [] };
		if (s.kind === 'create') next.planned = a.name && a.route ? { name: a.name, route: a.route } : null;
		else Object.assign(next, { title: a.title || s.title, route: a.route || s.route, built: !!a.built, existingFields: a.existingFields || s.existingFields });
		steps.push(next);
	}
	for (const x of extra) steps.push(fromPlanStep(x));
	return { wizard: { ...w, steps }, globalProblems: plan?.problems || [] };
};

/** A step's heading: "New · Leave requests" / "Change · Employees". */
export const stepTitle = (s: WizardStep) => (s.kind === 'create' ? s.working.title || s.working.name || 'New model' : s.title);
