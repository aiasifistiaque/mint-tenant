import { FC, Fragment } from 'react';
import { Flex } from '@chakra-ui/react';
import { useGetByIdQuery, convertToViewFields, getValue } from '../../../';
import Panel from '../../../cl/Panel';
import ViewRow from './ViewRow';
import { buildViewSections, ViewSection } from './sections';

type ViewPageBasicInfoProps = {
	slug: string;
	id: string;
	schema: any;
	layout: { exists: boolean; module: any };
};

/**
 * The generic view page body.
 *
 * Two things it borrows rather than reinvents:
 *
 * - **Its segmentation comes from the model's own form layout.** `formFields`
 *   already says which fields belong together and what that group is called, so
 *   the view reuses it instead of asking every model to describe its fields a
 *   second time. A model with no layout renders as one unsegmented panel.
 * - **Its containers and rows are the console kit's.** Same `Panel` and same
 *   `DetailRow` as the Heroku, Vercel and repo pages, so every view page in the
 *   admin reads as one product.
 *
 * Long-form fields are the exception to the row layout — see `BLOCK_TYPES`.
 */

/**
 * Field types that get a container of their own rather than a label/value row.
 *
 * A paragraph of rich text or a multi-line note has no business being squeezed
 * into the value column of a row built for a date or a status: it either wraps
 * into a ragged block beside its label or pushes every other row out of
 * alignment. These render as their own panel, with the field's label as the
 * heading and the content filling the body.
 */
const BLOCK_TYPES = ['editor', 'textarea'];
const ViewPageBasicInfo: FC<ViewPageBasicInfoProps> = ({ slug, id, schema, layout }) => {
	const module = layout?.exists ? layout?.module : undefined;

	const viewFields = module?.fields
		? convertToViewFields({ schema, fields: module.fields })
		: convertToViewFields({ schema });

	const sections: ViewSection[] = buildViewSections(
		module?.formFields,
		viewFields.map((field: any) => field.dataKey)
	);

	const { data, isFetching } = useGetByIdQuery(
		{
			path: slug,
			id: id,
		},
		{ skip: !id || !slug }
	);

	// `convertToViewFields` has already resolved labels, types and lookups, so
	// sections select from its output by key rather than re-deriving anything.
	const byKey: Record<string, any> = {};
	viewFields.forEach((field: any) => {
		byKey[field.dataKey] = field;
	});

	const rows = (items: any[]) => (
		<Flex
			direction='column'
			gap={3}>
			{items.map((field: any, index: number) => (
				<ViewRow
					doc={data}
					key={`${field.dataKey}-${index}`}
					field={{
						...field,
						...(field.idKey
							? { id: getValue({ dataKey: field.idKey, type: field.type, data }) }
							: {}),
					}}
					value={data && getValue({ dataKey: field.dataKey, type: field.type, data })}
					isLoading={isFetching}
				/>
			))}
		</Flex>
	);

	/** One panel per long-form field, carrying its own label as the heading. */
	const blockPanels = (items: any[]) =>
		items.map((field: any, index: number) => (
			<Panel
				key={`block-${field.dataKey}-${index}`}
				title={field.title}>
				<ViewRow
					doc={data}
					field={{ ...field, title: '' }}
					value={data && getValue({ dataKey: field.dataKey, type: field.type, data })}
					isLoading={isFetching}
					block
				/>
			</Panel>
		));

	const split = (items: any[]) => ({
		inline: items.filter((field: any) => BLOCK_TYPES.indexOf(field.type) === -1),
		block: items.filter((field: any) => BLOCK_TYPES.indexOf(field.type) !== -1),
	});

	if (!sections.length) {
		const { inline, block } = split(viewFields);

		return (
			<Flex
				direction='column'
				gap={4}
				w='full'>
				{!!inline.length && <Panel>{rows(inline)}</Panel>}
				{blockPanels(block)}
			</Flex>
		);
	}

	return (
		<Flex
			direction='column'
			gap={4}
			w='full'>
			{sections.map(section => {
				// A section can name a field the view does not render — one that is
				// form-only, or was removed from the schema. Dropping those keeps an
				// empty container from appearing for a section with nothing to show.
				const items = section.fields.map(field => byKey[field]).filter(Boolean);
				if (!items.length) return null;

				const { inline, block } = split(items);

				return (
					<Fragment key={section.title}>
						{!!inline.length && (
							<Panel
								title={section.title}
								subtitle={section.description}>
								{rows(inline)}
							</Panel>
						)}
						{blockPanels(block)}
					</Fragment>
				);
			})}
		</Flex>
	);
};

export default ViewPageBasicInfo;
