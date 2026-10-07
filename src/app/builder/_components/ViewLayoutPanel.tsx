'use client';

import { FC } from 'react';
import { Button, Flex, Text } from '@chakra-ui/react';
import { Panel } from '@/components/library/cl';
import SectionsEditor from './SectionsEditor';
import { TableField } from './TableColumnsEditor';
import { ModelField } from './filterTypes';

/**
 * A route's detail page layout — the `view` block of its config. Empty, it
 * offers a starting point (the form's sections, or every field); `onChange`
 * with `undefined` removes the view config so the page falls back to its
 * default layout. Used by the route builder and the model wizard.
 */

type Props = {
	sections: any[];
	onChange: (view: any[] | undefined) => void;
	formSections: any[];
	/** Keys for "All fields": every field the page may show. */
	allKeys: string[];
	fields: TableField[];
	modelFields: ModelField[];
	routes: { route: string; model: string | null; title?: string | null }[];
	model: string;
};

const ViewLayoutPanel: FC<Props> = ({ sections, onChange, formSections, allKeys, fields, modelFields, routes, model }) => (
	<Panel
		title='View'
		subtitle='The record’s detail page: sections of its own fields, fields of the records it links to, and lists of records that link to it.'
		actions={
			sections.length ? (
				<Button
					size='xs'
					variant='ghost'
					color='red.fg'
					onClick={() => onChange(undefined)}>
					Remove view config
				</Button>
			) : undefined
		}>
		{sections.length === 0 ? (
			<Flex
				direction='column'
				gap={3}
				align='flex-start'>
				<Text
					fontSize='sm'
					color='fg.muted'>
					No view config yet — the detail page groups fields by the form layout. Start from:
				</Text>
				<Flex gap={2}>
					{formSections.length > 0 && (
						<Button
							size='xs'
							variant='outline'
							onClick={() =>
								onChange(
									formSections.map((s: any) => ({
										title: s.sectionTitle || '',
										...(s.description && { description: s.description }),
										columns: 2,
										fields: (s.fields || []).flat().filter((x: any) => typeof x === 'string'),
									}))
								)
							}>
							The form layout
						</Button>
					)}
					<Button
						size='xs'
						variant='outline'
						onClick={() => onChange([{ title: 'Details', columns: 2, fields: allKeys }])}>
						All fields
					</Button>
				</Flex>
			</Flex>
		) : (
			<SectionsEditor
				mode='view'
				sections={sections}
				fields={fields}
				modelFields={modelFields}
				routes={routes}
				model={model}
				onChange={view => onChange(view)}
			/>
		)}
	</Panel>
);

export default ViewLayoutPanel;
