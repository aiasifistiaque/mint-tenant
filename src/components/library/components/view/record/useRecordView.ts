'use client';

import { useEffect, useState } from 'react';
import {
	useGetByIdQuery,
	useGetConfigQuery,
	useGetDocumentHistoryQuery,
	useGetRouteQuery,
	useGetSchemaQuery,
} from '../../../store/services/commonApi';
import { useGetViewDocumentQuery } from '../../../store/services/builderApi';
import { HISTORY_PAGE_SIZE } from '../../history/HistoryTimeline';
import { formFieldsFromConfig } from '../view-page/sections';

const humanize = (s: string) => (s || '').replace(/[-_]+/g, ' ').replace(/^./, c => c.toUpperCase());

export type RecordTab = { index: number; title: string; route: string; total: number; allowed: boolean };

/**
 * Everything a record's page and its quick-view drawer both show: the name,
 * the list it belongs to, the route builder's view (sections and linked-record
 * tabs), the form layout from code if the route has one, the history count,
 * and how to edit it. `skip` holds every request until the drawer opens.
 */
const useRecordView = ({ slug, id, skip = false }: { slug: string; id: string; skip?: boolean }) => {
	const off = skip || !slug || !id;
	const { data: schema } = useGetSchemaQuery(slug, { skip: skip || !slug });

	// The record itself — also what the overview reads, so this is the same request.
	const { data: doc } = useGetByIdQuery({ path: slug, id }, { skip: off });
	const name: string = (typeof doc?.name === 'string' && doc.name) || (typeof doc?.title === 'string' && doc.title) || '';
	const code: string = doc?.code || '';
	// The list page's own title, for the breadcrumb back to it.
	const { data: routeInfo } = useGetRouteQuery(slug, { skip: skip || !slug });
	const routeTitle: string = routeInfo?.title || humanize(slug);

	// A view config published in the route builder lays the record out; without
	// one this 404s and the default layout is used.
	const {
		data: configured,
		isLoading: configuredLoading,
		isFetching: configuredFetching,
	} = useGetViewDocumentQuery({ path: slug, id }, { skip: off });

	// A route with a form layout in code (app/<slug>/config) groups its fields by it.
	const [moduleData, setModuleData] = useState<any>(null);
	useEffect(() => {
		if (skip || !slug) return;
		let live = true;
		import('@/layouts').then(({ default: getFieldModule }) =>
			getFieldModule(slug).then(res => live && setModuleData(res))
		);
		return () => {
			live = false;
		};
	}, [slug, skip]);

	const tabs: RecordTab[] = configured?.tabs || [];

	// Same args as the History tab's first page, so the count and the log share one request.
	const { data: history } = useGetDocumentHistoryQuery({ id, limit: HISTORY_PAGE_SIZE }, { skip: off });
	const historyTotal: number | undefined = history?.totalDocs;

	// A route with a form layout in code edits through it; every other route —
	// built models included — through its form config, the same drawer the
	// table's "Edit" opens. `config` is invalidated on save so the view refreshes.
	const hasModule = !!moduleData?.exists;
	const { data: config } = useGetConfigQuery(slug, { skip: skip || !slug || !moduleData || hasModule });
	const configForm: any[] = Array.isArray(config?.form) ? config.form : [];

	const editProps: any = hasModule
		? {
				id,
				path: slug,
				layout: moduleData?.module.formFields || [],
				data: [],
				type: 'update',
				doc: schema,
				// 'history' so the History tab picks up the edit just saved.
				invalidate: ['config', 'history'],
		  }
		: {
				id,
				path: slug,
				data: configForm,
				title: 'Update',
				type: 'update',
				invalidate: ['config', 'history'],
		  };
	const canEdit = hasModule || configForm.length > 0;

	// How the Overview groups fields: the form layout in code, else the route
	// builder's form sections, so a record reads in the groups it's edited in.
	const layout = hasModule
		? moduleData
		: configForm.length
			? { exists: true, module: { formFields: formFieldsFromConfig(configForm) } }
			: moduleData;

	return {
		schema,
		name,
		code,
		recordTitle: name || code || id,
		routeTitle,
		/** For the header's status pill and "Updated …" line. */
		status: typeof doc?.status === 'string' ? doc.status : undefined,
		updatedAt: doc?.updatedAt as string | undefined,
		configured,
		configuredLoading,
		configuredFetching,
		moduleData: layout,
		tabs,
		historyTotal,
		editProps,
		canEdit,
	};
};

export default useRecordView;
