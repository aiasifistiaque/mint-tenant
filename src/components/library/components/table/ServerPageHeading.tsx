import { Box, Flex, FlexProps, Heading, Button, Text, Skeleton, IconButton, Menu } from '@chakra-ui/react';
import Crumbs from '../../cl/Crumbs';
import Link from 'next/link';
import React, { useState } from 'react';
import { BookOpen, Download, EllipsisVertical, Upload } from 'lucide-react';
import { GuidelinesDialog, guidelinesOf, viewLabel } from '../guidelines/Guidelines';
// import { BackendCreateModal, Icon } from '../..';

import { ExportButton, ExportDialog } from './table-components/bulk/ExportRows';
import ImportDialog from './table-components/bulk/ImportRows';
import { MenuContainer, MenuItem, MenuItemStyle } from '../../menu';
import { buttonGroupCss, containerCss, headingCss, subHeadingCss, wrapperCss } from './style';
import { BackendCreateModal } from '../../modals';
import { singularOf } from '../../modals/CreateModal/CreateModal';
import { Icon } from '../../icon';
import { useIsMobile } from '../../hooks';
import { radius, sizes } from '../../config';
import { HOME, addButtonHref, pagePath } from '../../config/lib/constants/panel';

type PageHeadingProps = FlexProps & {
	title: string;
	button?: string;
	href?: string;
	isModal?: boolean;
	path: string;
	data?: any;
	export?: boolean;
	table: any;
	isLoading?: boolean;
};

const ServerPageHeading: React.FC<PageHeadingProps> = ({
	title,
	href,
	button,
	isModal = false,
	path,
	table,
	data,
	isLoading = false,
	export: exportData,
	...props
}) => {
	const isMobile = useIsMobile();
	const btn = (
		<Button size='sm'>
			<Icon
				size={18}
				name='add'
			/>
			{!isMobile && button}
		</Button>
	);

	const exportButton = <ExportButton path={path} />;

	// With bulk upload on, or user guidelines written, the header's other
	// actions move into one ⋯ menu beside the add button: the guidelines, Bulk
	// upload, and Export when that's on too. The dialogs are siblings of the
	// menu, which unmounts its content on close.
	const bulkUpload = !!table?.bulkUpload;
	const guidelines = guidelinesOf(table?.guidelines);
	const useMenu = bulkUpload || !!guidelines;
	const [dialog, setDialog] = useState<'import' | 'export' | 'guidelines' | null>(null);
	const moreMenu = (
		<>
			<Menu.Root positioning={{ placement: 'bottom-end', gutter: 4 }}>
				<Menu.Trigger asChild>
					<IconButton
						aria-label='More actions'
						size='sm'
						variant='outline'>
						<EllipsisVertical size={16} />
					</IconButton>
				</Menu.Trigger>
				<MenuContainer
					p={1}
					gap={0}
					minW='200px'
					boxShadow='lg'>
					{guidelines && (
						<MenuItemStyle
							compact
							icon={<BookOpen size={16} strokeWidth={1.75} />}>
							<MenuItem onClick={() => setDialog('guidelines')}>{viewLabel(guidelines.title)}</MenuItem>
						</MenuItemStyle>
					)}
					{bulkUpload && (
						<MenuItemStyle
							compact
							icon={<Upload size={16} strokeWidth={1.75} />}>
							<MenuItem onClick={() => setDialog('import')}>{table?.bulkUpload?.title || 'Bulk upload'}</MenuItem>
						</MenuItemStyle>
					)}
					{Boolean(exportData) && (
						<MenuItemStyle
							compact
							icon={<Download size={16} strokeWidth={1.75} />}>
							<MenuItem onClick={() => setDialog('export')}>Export</MenuItem>
						</MenuItemStyle>
					)}
				</MenuContainer>
			</Menu.Root>
			<GuidelinesDialog
				open={dialog === 'guidelines'}
				onClose={() => setDialog(null)}
				guidelines={table?.guidelines}
			/>
			<ImportDialog
				open={dialog === 'import'}
				onClose={() => setDialog(null)}
				path={path}
				title={table?.bulkUpload?.title}
			/>
			<ExportDialog
				open={dialog === 'export'}
				onClose={() => setDialog(null)}
				path={path}
			/>
		</>
	);

	const renderButton = () => {
		if (isModal)
			return (
				<BackendCreateModal
					trigger={btn}
					type='post'
					path={path}
					data={data}
					invalidate={table?.invalidate}
					prompt={table?.button?.prompt}
					heading={title ? `New ${singularOf(title)}` : undefined}
					description={table?.subTitle || (title ? `Fill in the details, then press Create — it’s added to ${title}.` : undefined)}
				/>
			);
		else if (href) return <Link href={addButtonHref(href, path)}>{btn}</Link>;
		else return btn;
	};

	return (
		<Flex
			{...wrapperCss}
			{...props}>
			{/* The same trail as the console and builder pages (cl PageHeader). */}
			{isLoading ? (
				<Skeleton
					w='120px'
					h='14px'
					borderRadius='full'
				/>
			) : (
				<Box mb={-1}>
					<Crumbs
						data={[
							{ href: HOME, title: 'Home' },
							{ href: pagePath(path), title },
						]}
					/>
				</Box>
			)}
			<Flex {...containerCss}>
				{isLoading ? (
					// One bar the size of the <Heading> it stands in for. This was a
					// `SkeletonText noOfLines={3}`, where `h` applies per line — so a
					// single 30px title loaded in behind a 300x144 slab.
					<Skeleton
						w='140px'
						h={HEADING_HEIGHT}
						borderRadius='full'
					/>
				) : (
					<Heading {...headingCss}>{title}</Heading>
				)}

				{isLoading ? (
					<Skeleton
						w='124px'
						h={sizes.CONTROL_HEIGHT}
						borderRadius={radius.BUTTON}
					/>
				) : (
					<Flex {...buttonGroupCss}>
						<>{!useMenu && Boolean(exportData) && exportButton}</>
						<>{(Boolean(button) || isModal) && renderButton()}</>
						{useMenu && moreMenu}
					</Flex>
				)}
			</Flex>
			{(table?.subTitle || table?.guideHref) && (
				<Flex
					align='center'
					gap={2}
					wrap='wrap'>
					{table?.subTitle && <Text {...subHeadingCss}>{table?.subTitle}</Text>}
					{table?.guideHref && (
						<Link href={table.guideHref}>
							<Text
								{...subHeadingCss}
								color='accent.fg'
								textDecoration='underline'>
								{table?.guideLabel || 'View the guide'}
							</Text>
						</Link>
					)}
				</Flex>
			)}
		</Flex>
	);
};

// `headingCss` is 1.375rem/1.5rem at lineHeight 1.25, so the rendered <h2> box
// is 27.5px on mobile and 30px from md up.
const HEADING_HEIGHT = { base: '28px', md: '30px' };

export default ServerPageHeading;
