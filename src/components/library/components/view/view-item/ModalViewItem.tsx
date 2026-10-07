import { FC, useEffect } from 'react';
import { Flex, Grid, GridProps, Heading, Tooltip, useClipboard } from '@chakra-ui/react';
import { Icon } from '../../..';
import { renderViewItem as renderContent } from '..';
import { SkeletonContent, ViewItemProps } from './utils';
import { useColorMode } from '@/components/ui/color-mode';
import { linkFor } from '../utils/record-link/linked';

const ViewItem: FC<ViewItemProps> = ({
	title,
	type,
	children,
	colorPalette,
	path,
	copy,
	isLoading = false,
	field,
	doc,
	...props
}) => {
	// `field` (the view field) and `doc` (the record) let a linked value — a
	// reference, the owner, people with access — render as RecordLink chips.
	const link = field && doc ? linkFor(field, doc) : null;

	const { copy: onCopy, value, setValue, copied: hasCopied } = useClipboard();

	useEffect(() => {
		if (children && copy) setValue(children.toString());
	}, [children]);

	return (
		<Grid
			{...gridCss(type)}
			{...props}>
			<SkeletonContent isLoading={isLoading}>
				{/* A label, not a heading: it names the value beside it, so it sits
				    back at the same muted 13px the table's column labels use. The
				    trailing colon went with it — the grid already separates the
				    pair, and the punctuation only added noise to every row. */}
				<Heading
					fontSize='13px'
					fontWeight='500'
					lineHeight='1.5'
					color='fg.muted'>
					{title}
				</Heading>
			</SkeletonContent>
			<SkeletonContent isLoading={isLoading}>
				<Flex
					gap={2}
					align='center'>
					{!isLoading &&
						children &&
						renderContent({ type, children, colorPalette, path, isLoading, link, dataModel: field?.dataModel })}
					{copy && children && children != 'n/a' && (
						<Tooltip.Root
							lazyMount
							openDelay={200}
							closeDelay={100}
							positioning={{ placement: 'top' }}>
							<Tooltip.Trigger asChild>
								<Flex
									onClick={onCopy}
									cursor='pointer'>
									<Icon name='copy' />
								</Flex>
							</Tooltip.Trigger>
							<Tooltip.Positioner>
								<Tooltip.Content>{hasCopied ? 'Copied!' : 'Copy'}</Tooltip.Content>
							</Tooltip.Positioner>
						</Tooltip.Root>
					)}
				</Flex>
			</SkeletonContent>
		</Grid>
	);
};

const GRID_COLUMNS = '1fr 3fr';

const gridCss = (type: string = 'string'): GridProps => {
	return {
		justifyContent: 'center',
		px: { base: 4, md: 4 },
		py: 2.5,
		gridTemplateColumns: {
			base: '1fr',
			md: type == 'textarea' || type == 'section-data-array' ? '1fr' : GRID_COLUMNS,
		},
		gap: {
			base: 2,
			md: type == 'textarea' || type == 'section-data-array' ? 3 : 8,
		},
		fontSize: '13px',
		borderBottomWidth: 1,
		// The same hairline as the drawer's header/footer and the table rows,
		// rather than a second, heavier border colour just for view rows.
		borderColor: 'border.muted',
		_last: { borderBottomWidth: 0 },
	};
};

export default ViewItem;
