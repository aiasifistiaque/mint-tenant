'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import { Column, CreateModal, ViewTabTable, HistoryTimeline, Layout } from '@/components/library';
import { ConsoleTabs, PageHeader } from '@/components/library/cl';
import { Badge, Button, FlexProps, Tabs } from '@chakra-ui/react';
import { Pencil } from 'lucide-react';
import useRecordView from '@/components/library/components/view/record/useRecordView';
import RecordOverview from '@/components/library/components/view/record/RecordOverview';
import { StatusPill, ago } from '@/components/library/modals/CreateModal/CreateModal';
import { HOME, pagePath } from '@/components/library/config/lib/constants/panel';

/** A page's own tab, shown ahead of Overview. */
export type RecordViewTab = {
	/** Goes in `?tab=`, so keep it a stable word — not 'overview', 'history' or a number. */
	value: string;
	label: ReactNode;
	content: ReactNode;
};

export type RecordViewProps = {
	slug: string;
	id: string;
	/**
	 * A custom record page's own tabs. They come first and the first one opens
	 * by default; Overview, the linked-record tabs and History follow, exactly
	 * as on the generic view page.
	 */
	tabs?: RecordViewTab[];
	/** Header extras. The title defaults to the record's name. */
	title?: ReactNode;
	badge?: ReactNode;
	meta?: ReactNode;
	/** Buttons before Edit. */
	actions?: ReactNode;
	/** Rendered after the page, for the custom page's own dialogs. */
	children?: ReactNode;
};

/**
 * A record's page: header with Edit, then Overview (the route builder's view
 * config, or the default layout), the tabs of records linking to it, and
 * History, with the open tab kept in `?tab=`.
 *
 * `/view/<slug>/<id>` is just this. A route with its own page in code
 * (`/repos/<id>`) wraps this too and passes its console as `tabs`, so the
 * table's "Open" lands on the same overview and tabs either way.
 */
const RecordView = ({ slug, id, tabs: pageTabs = [], title, badge, meta, actions, children }: RecordViewProps) => {
	const rv = useRecordView({ slug, id });
	const { name, code, recordTitle, routeTitle, tabs, historyTotal, editProps: modalProps, canEdit, status, updatedAt } = rv;
	// Like the edit dialog's header: the code, then how fresh the record is.
	const updated = ago(updatedAt);
	const defaultMeta = [name && code ? code : '', updated && `Updated ${updated}`].filter(Boolean).join(' · ') || undefined;

	// Tabs after Overview: records of other routes that link to this one, as
	// set in the route builder's view, then History, which every record has.
	// The open tab lives in `?tab=`.
	const firstTab = pageTabs[0]?.value || 'overview';
	const [tab, setTab] = useState(firstTab);
	useEffect(() => {
		const t = new URLSearchParams(window.location.search).get('tab');
		if (t) setTab(t);
	}, []);
	const goTo = (t: string) => {
		setTab(t);
		const url = new URL(window.location.href);
		if (t === firstTab) url.searchParams.delete('tab');
		else url.searchParams.set('tab', t);
		window.history.replaceState(null, '', url.toString());
	};
	const openTab =
		tab === 'overview' ||
		tab === 'history' ||
		pageTabs.some(t => t.value === tab) ||
		tabs.some(t => String(t.index) === tab)
			? tab
			: firstTab;

	const overview = (
		<RecordOverview
			slug={slug}
			id={id}
			schema={rv.schema}
			moduleData={rv.moduleData}
			configured={rv.configured}
			configuredLoading={rv.configuredLoading}
			configuredFetching={rv.configuredFetching}
		/>
	);

	const countBadge = (n: number) => (
		<Badge
			ml={1.5}
			size='xs'
			variant='subtle'
			borderRadius='full'>
			{n.toLocaleString()}
		</Badge>
	);

	return (
		<Layout
			title={routeTitle}
			path={slug}>
			<Column {...containerCss}>
				<PageHeader
					breadcrumbs={[
						{ href: HOME, title: 'Home' },
						{ href: pagePath(slug), title: routeTitle },
						{ href: '#', title: recordTitle },
					]}
					title={title || recordTitle}
					badge={badge ?? <StatusPill value={status} />}
					meta={meta ?? defaultMeta}
					actions={
						actions || canEdit ? (
							<>
								{actions}
								{canEdit && (
									<CreateModal {...modalProps}>
										<Button
											size='sm'
											variant='outline'>
											<Pencil size={14} />
											Edit
										</Button>
									</CreateModal>
								)}
							</>
						) : undefined
					}
				/>

				<ConsoleTabs
					value={openTab}
					onChange={goTo}
					tabs={[
						...pageTabs.map(t => ({ value: t.value, label: t.label })),
						{ value: 'overview', label: 'Overview' },
						...tabs.map(t => ({
							value: String(t.index),
							label: (
								<>
									{t.title}
									{t.allowed && countBadge(t.total)}
								</>
							),
						})),
						{
							value: 'history',
							label: (
								<>
									History
									{!!historyTotal && countBadge(historyTotal)}
								</>
							),
						},
					]}>
					{pageTabs.map(t => (
						<Tabs.Content
							key={t.value}
							value={t.value}>
							{t.content}
						</Tabs.Content>
					))}
					<Tabs.Content value='overview'>{overview}</Tabs.Content>
					{tabs.map(t => (
						<Tabs.Content
							key={t.index}
							value={String(t.index)}>
							<ViewTabTable
								path={slug}
								id={id}
								index={t.index}
								title={t.title}
							/>
						</Tabs.Content>
					))}
					<Tabs.Content value='history'>
						<HistoryTimeline id={id} />
					</Tabs.Content>
				</ConsoleTabs>
			</Column>
			{children}
		</Layout>
	);
};

const containerCss: FlexProps = {
	pt: 4,
	gap: 5,
};

export default RecordView;
