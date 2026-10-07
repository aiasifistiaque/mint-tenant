'use client';

import { FC, Fragment, ReactElement } from 'react';
import Link from 'next/link';
import { Flex, Grid, Text } from '@chakra-ui/react';
import { convertToViewFields, getValue } from '../../../';
import Panel from '../../../cl/Panel';
import DataTable from '../../../cl/DataTable';
import { DetailSkeleton } from '../../../cl/States';
import ViewRow from './ViewRow';
import { cellNode } from './cells';
import { projectHref } from '../../../config/lib/constants/panel';

/**
 * A record laid out by its route's `view` config — the sections, titles and
 * descriptions set in the route builder — as returned by `/get/view/:id`:
 *
 * - own fields render as ViewRows, through the same `convertToViewFields`
 *   the rest of the view page uses, so a field looks the same here as anywhere;
 * - fields of a referenced record render as rows labelled "Client · Email";
 * - related records render as a small table, each row linking to its own
 *   view page, with a link to the full list.
 *
 * Long-form fields (editor, textarea) get the full width of their section.
 */

const BLOCK_TYPES = ['editor', 'textarea'];

const typeFromInstance = (instance?: string) =>
	instance === 'Date' ? 'date' : instance === 'Number' ? 'number' : instance === 'Boolean' ? 'boolean' : 'text';

type Props = {
	slug: string;
	schema: any;
	view: { doc: any; sections: any[] };
	isLoading?: boolean;
	/** Narrow (a drawer): every section in one column. */
	compact?: boolean;
};

const ConfiguredView: FC<Props> = ({ slug, schema, view, isLoading, compact }) => {
	if (!view) return <DetailSkeleton />;

	const byKey: Record<string, any> = {};
	(convertToViewFields({ schema }) || []).forEach((f: any) => (byKey[f.dataKey] = f));
	const doc = view.doc;

	const row = (field: any, key: string) => (
		<ViewRow
			key={key}
			doc={doc}
			field={{
				...field,
				...(field.idKey ? { id: getValue({ dataKey: field.idKey, type: field.type, data: doc }) } : {}),
			}}
			value={doc && getValue({ dataKey: field.dataKey, type: field.type, data: doc })}
			isLoading={isLoading}
		/>
	);

	return (
		<Flex
			direction='column'
			gap={4}
			w='full'>
			{view.sections.map((section: any, si: number) => {
				const inline: ReactElement[] = [];
				const blocks: ReactElement[] = [];
				const tables: ReactElement[] = [];

				section.items.forEach((item: any, ii: number) => {
					if (item.kind === 'field') {
						const field = byKey[item.key];
						if (!field) return;
						if (BLOCK_TYPES.includes(field.type))
							blocks.push(
								<Panel
									key={`b-${ii}`}
									title={field.title}>
									<ViewRow
										doc={doc}
										field={{ ...field, title: '' }}
										value={doc && getValue({ dataKey: field.dataKey, type: field.type, data: doc })}
										isLoading={isLoading}
										block
									/>
								</Panel>
							);
						else inline.push(row(field, `f-${ii}`));
						return;
					}

					if (item.kind === 'ref') {
						// The first field names the record, as a link to it ("Owner: Jane");
						// the rest read as plain rows ("Owner · Email").
						item.fields.forEach((f: any, fi: number) =>
							inline.push(
								row(
									{
										title: fi ? `${item.label} · ${f.label}` : item.label,
										dataKey: f.key,
										type: typeFromInstance(f.instance),
										...(fi ? { noLink: true } : { model: item.route }),
									},
									`r-${ii}-${fi}`
								)
							)
						);
						return;
					}

					if (item.kind === 'related') {
						tables.push(
							<Panel
								key={`t-${ii}`}
								flush
								title={item.title}
								subtitle={
									item.allowed
										? `${item.total} record${item.total === 1 ? '' : 's'}${item.total > item.rows.length ? ` · showing ${item.rows.length}` : ''}`
										: 'You don’t have access to these records'
								}
								actions={
									item.allowed && item.total > 0 ? (
										<Link href={`/${item.route}`}>
											<Text
												fontSize='xs'
												color='fg.muted'
												_hover={{ color: 'fg' }}>
												Open {item.route} →
											</Text>
										</Link>
									) : undefined
								}>
								{item.allowed && item.rows.length > 0 ? (
									<DataTable
										columns={item.columns.map((c: any) => ({
											key: c.key,
											label: c.label,
											render: (r: any) => cellNode(r[c.key], c.kind),
										}))}
										rows={item.rows}
										rowKey={(r: any) => r._id}
										onRowClick={(r: any) => window.location.assign(projectHref(`/view/${item.route}/${r._id}`))}
									/>
								) : (
									<Text
										px={4}
										py={3}
										fontSize='xs'
										color='fg.muted'>
										{item.allowed ? 'None yet.' : '—'}
									</Text>
								)}
							</Panel>
						);
					}
				});

				if (!inline.length && !blocks.length && !tables.length) return null;

				return (
					<Fragment key={`s-${si}`}>
						{!!inline.length && (
							<Panel
								title={section.title || undefined}
								subtitle={section.description || undefined}>
								<Grid
									templateColumns={
										compact ? '1fr' : { base: '1fr', md: `repeat(${section.columns || 1}, minmax(0, 1fr))` }
									}
									columnGap={8}
									rowGap={3}>
									{inline}
								</Grid>
							</Panel>
						)}
						{blocks}
						{tables}
					</Fragment>
				);
			})}
		</Flex>
	);
};

export default ConfiguredView;
