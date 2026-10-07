'use client';

import { FC, useEffect, useState } from 'react';
import NextLink from 'next/link';
import { Badge, Button, Flex, Tabs } from '@chakra-ui/react';
import { ExternalLink, Eye, Pencil } from 'lucide-react';
import ConsoleTabs from '../../../cl/ConsoleTabs';
import Panel from '../../../cl/Panel';
import { useGetByIdQuery } from '../../../store/services/commonApi';
import Dialog from '../../table/table-components/menu-modals/Dialog';
import DialogHeader from '../../table/table-components/menu-modals/MenuModalHeader';
import DialogBody from '../../table/table-components/menu-modals/MenuModalBody';
import DialogCloseButton from '../../table/table-components/menu-modals/MenuModalCloseButton';
import CreateModal, { StatusPill, ago } from '../../../modals/CreateModal/CreateModal';
import HistoryTimeline from '../../history/HistoryTimeline';
import getValue from '../../../functions/getValue';
import ViewRow from '../view-page/ViewRow';
import ViewTabTable from '../view-page/ViewTabTable';
import RecordOverview from './RecordOverview';
import useRecordView from './useRecordView';
import { projectHref } from '../../../config/lib/constants/panel';

type Props = {
	open: boolean;
	onClose: () => void;
	path: string;
	id: string;
	/** Accepted from the table menu (its label, e.g. "View"); the heading is the record's own name. */
	title?: string;
	/**
	 * A fixed list of view fields (a table menu item's `dataModel` or `fields`)
	 * shown as the Overview instead of the route's own layout.
	 */
	fields?: any[];
};

const countBadge = (n: number) => (
	<Badge
		ml={1.5}
		size='xs'
		variant='subtle'
		borderRadius='full'>
		{n.toLocaleString()}
	</Badge>
);

/**
 * A record at a glance, from its table: the same Overview (sections from the
 * route builder, or the form's groups), linked-record tabs and History as its
 * view page, in the side drawer (a bottom sheet on a phone), with Edit and a
 * link to the full page.
 */
const RecordDrawer: FC<Props> = ({ open, onClose, path, id, title, fields }) => {
	const rv = useRecordView({ slug: path, id, skip: !open });
	const { name, code, routeTitle, tabs, historyTotal, editProps, canEdit, status, updatedAt } = rv;
	const updated = ago(updatedAt);

	const [tab, setTab] = useState('overview');
	useEffect(() => {
		if (open) setTab('overview');
	}, [open, id]);

	const { data: doc, isFetching } = useGetByIdQuery({ path, id }, { skip: !open || !fields?.length });

	const overview = fields?.length ? (
		<Panel>
			<Flex
				direction='column'
				gap={3}>
				{fields.map((field: any, i: number) => (
					<ViewRow
						key={`${field.dataKey}-${i}`}
						doc={doc}
						field={field}
						value={doc && getValue({ dataKey: field.dataKey, type: field.type, data: doc })}
						isLoading={isFetching}
					/>
				))}
			</Flex>
		</Panel>
	) : (
		<RecordOverview
			slug={path}
			id={id}
			schema={rv.schema}
			moduleData={rv.moduleData}
			configured={rv.configured}
			configuredLoading={rv.configuredLoading}
			configuredFetching={rv.configuredFetching}
			compact
		/>
	);

	return (
		<Dialog
			isOpen={open}
			onClose={onClose}>
			<DialogHeader
				divider
				icon={
					<Eye
						size={17}
						strokeWidth={1.75}
					/>
				}
				badge={<StatusPill value={status} />}
				description={[routeTitle, name && code ? code : '', updated && `Updated ${updated}`].filter(Boolean).join(' · ') || undefined}>
				{name || code || 'Details'}
			</DialogHeader>
			<DialogCloseButton top={{ base: 4, md: 5 }} />

			<DialogBody pt={4}>
				<Flex
					gap={2}
					mb={4}
					flexWrap='wrap'>
					<Button
						asChild
						size='xs'
						variant='outline'>
						<NextLink href={projectHref(`/view/${path}/${id}`)}>
							<ExternalLink size={13} />
							Open full page
						</NextLink>
					</Button>
					{canEdit && (
						<CreateModal {...editProps}>
							<Button
								size='xs'
								variant='outline'>
								<Pencil size={13} />
								Edit
							</Button>
						</CreateModal>
					)}
				</Flex>

				<ConsoleTabs
					value={tab === 'overview' || tab === 'history' || tabs.some(t => String(t.index) === tab) ? tab : 'overview'}
					onChange={setTab}
					tabs={[
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
					<Tabs.Content value='overview'>{overview}</Tabs.Content>
					{tabs.map(t => (
						<Tabs.Content
							key={t.index}
							value={String(t.index)}>
							<ViewTabTable
								path={path}
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
			</DialogBody>
		</Dialog>
	);
};

export default RecordDrawer;
