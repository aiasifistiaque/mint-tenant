'use client';

import { Flex, Text } from '@chakra-ui/react';
// Direct paths, not the `@/components/library` barrel — same reason as
// cells.tsx: this module is reached *from* that barrel, so importing it back
// would close an import cycle.
import CustomTd from '@/components/library/components/table/table-components/data/CustomTd';
import ViewServerModal from '@/components/library/components/table/table-components/modals/ViewServerModal';

const ACTION_COLOR: Record<string, string> = {
	create: 'green',
	update: 'orange',
	delete: 'red',
};

/**
 * The readable sentence on a history entry, as a control that opens the record
 * it is about.
 *
 * The entry stores `modelPath` and `document` precisely so this works without a
 * model -> route lookup: `ViewServerModal` is already generic over
 * `path` + `id`, so one cell opens a meeting, a product or an invoice.
 *
 * `doc` is the whole history row, which this cell only receives because
 * 'history' is listed in CELLS_WITH_DOC.
 */
export const HistoryCell = ({ children, doc, ...props }: any) => {
	const text = children || doc?.text;
	const path = doc?.modelPath;
	const id = doc?.document;

	const label = (
		<Flex
			align='center'
			gap={2}
			minW={0}>
			<Flex
				flexShrink={0}
				w='6px'
				h='6px'
				borderRadius='full'
				bg={`${ACTION_COLOR[doc?.action] || 'gray'}.solid`}
			/>
			<Text
				fontSize='inherit'
				lineClamp={2}>
				{text || '--'}
			</Text>
		</Flex>
	);

	// A deleted record has nothing left to open, and an entry written before
	// modelPath existed has nowhere to point — both render as plain text rather
	// than a control that would lead to a 404.
	if (!path || !id || doc?.action === 'delete') return <CustomTd {...props}>{label}</CustomTd>;

	return (
		<CustomTd {...props}>
			<ViewServerModal
				path={path}
				id={id}
				title={doc?.documentName || doc?.documentCode || 'Record'}
				trigger={
					<Flex
						cursor='pointer'
						_hover={{ textDecoration: 'underline' }}
						minW={0}>
						{label}
					</Flex>
				}
			/>
		</CustomTd>
	);
};

export default HistoryCell;
