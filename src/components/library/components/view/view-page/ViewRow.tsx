'use client';

import { FC, useEffect } from 'react';
import { Flex, Text, Tooltip, useClipboard } from '@chakra-ui/react';
import { Icon } from '../../../';
import { renderViewItem as renderContent } from '../';
import { SkeletonContent } from '../view-item/utils';
import DetailRow from '../../../cl/DetailRow';
import { linkFor } from '../utils/record-link/linked';

type ViewRowProps = {
	field: any;
	value: any;
	isLoading?: boolean;
	/**
	 * Rendered inside a panel of its own, whose heading already carries the
	 * label — so the row drops its label column and lets the content use the
	 * full width.
	 */
	block?: boolean;
	/** The whole record — lets a linked value (a reference, the owner) render as a RecordLink. */
	doc?: any;
};

/**
 * One label/value line on a view page.
 *
 * `DetailRow` for the layout — the same row the Heroku, Vercel and repo pages
 * use — with `renderViewItem` for the value, which is what knows how to draw a
 * link, a tag list, a date, an image or a looked-up reference. The two were
 * previously fused into `ViewPageItem`, which stacked the label *above* the
 * value in a bordered two-column grid, so a view page looked like a different
 * product from the pages it sat beside.
 */
const ViewRow: FC<ViewRowProps> = ({ field, value, isLoading, block, doc }) => {
	const { title, type, colorPalette, path, model, originalType, copy, id } = field;
	const { copy: onCopy, setValue, copied } = useClipboard();

	useEffect(() => {
		if (value && copy) setValue(String(value));
	}, [value, copy, setValue]);

	// An empty value reads as a dash rather than a blank line, so a row never
	// looks like a rendering failure.
	const isEmpty = value === null || value === undefined || value === '';

	const rendered = renderContent({
		type,
		children: value,
		colorPalette,
		path: model || path,
		originalType,
		id,
		link: !field.noLink && linkFor(field, doc),
		dataModel: field.dataModel,
	});

	// A password brings its own copy button, one that copies without revealing.
	const copyButton = copy && value !== 'n/a' && type !== 'password' && (
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
				<Tooltip.Content>{copied ? 'Copied!' : 'Copy'}</Tooltip.Content>
			</Tooltip.Positioner>
		</Tooltip.Root>
	);

	if (block) {
		if (isLoading) {
			return (
				<SkeletonContent isLoading>
					<Text fontSize='13px'>—</Text>
				</SkeletonContent>
			);
		}

		if (isEmpty) {
			return (
				<Text
					fontSize='13px'
					color='fg.muted'>
					—
				</Text>
			);
		}

		// Column, not row: long-form content sets its own height, and centring it
		// against a copy button would drag the button to the middle of a
		// paragraph.
		return (
			<Flex
				direction='column'
				gap={2}
				w='full'
				minW={0}>
				{rendered}
				{copyButton}
			</Flex>
		);
	}

	const isImage = type === 'image' || type === 'image-array';

	return (
		<DetailRow
			label={title}
			stackOnMobile={isImage}
			value={
				isLoading ? (
					<SkeletonContent isLoading>
						<Text fontSize='13px'>—</Text>
					</SkeletonContent>
				) : isEmpty && !isImage ? undefined : (
					<Flex
						align='center'
						gap={2}
						minW={0}
						w={isImage ? { base: 'full', md: 'auto' } : undefined}>
						{rendered}
						{copyButton}
					</Flex>
				)
			}
		/>
	);
};

export default ViewRow;
