import { FC, ReactNode } from 'react';
import { Menu, Button, Portal } from '@chakra-ui/react';
import {
	Archive,
	ArrowRightLeft,
	Calculator,
	Columns2,
	Copy,
	Download,
	ListChecks,
	Merge,
	MessageSquare,
	PencilLine,
	Printer,
	Trash2,
} from 'lucide-react';

import {
	EditManyModal,
	SendBulkSmsModal,
	CalculateModal,
	EditManySelectModal,
	EditDataSelectModal,
} from '../../table-components/modals';

import { Icon } from '../../../../icon';
import { ArchiveRows, DeleteRows, DuplicateRows, StatusRows } from '../bulk/RowActions';
import CompareRows from '../bulk/CompareRows';
import MergeRows from '../bulk/MergeRows';
import { ExportRows, PrintRows } from '../bulk/ExportRows';
import { MenuContainer, MenuItemStyle } from '../../../../menu';

type TableMenuProps = {
	path: string;
	data: any;
	hide: boolean;
	items: any[];
	/** The route's config: status and archive settings for those actions. */
	route?: any;
};

const ICON = { size: 16, strokeWidth: 1.75 };

/** Each bulk action's icon, by its type. */
const ICONS: Record<string, ReactNode> = {
	calculate: <Calculator {...ICON} />,
	edit: <PencilLine {...ICON} />,
	'update-api': <PencilLine {...ICON} />,
	'edit-select': <ListChecks {...ICON} />,
	'edit-many': <ListChecks {...ICON} />,
	'edit-data-select': <ListChecks {...ICON} />,
	export: <Download {...ICON} />,
	'delete-many': <Trash2 {...ICON} />,
	'duplicate-many': <Copy {...ICON} />,
	archive: <Archive {...ICON} />,
	'change-status': <ArrowRightLeft {...ICON} />,
	compare: <Columns2 {...ICON} />,
	merge: <Merge {...ICON} />,
	print: <Printer {...ICON} />,
	'marketing-sms': <MessageSquare {...ICON} />,
};

/** Destructive actions go last, after a divider, in red. */
const DANGER = new Set(['delete-many']);

const SelectedMenu: FC<TableMenuProps> = ({ path, hide, data, items, route }) => {
	if (hide) return null;

	const render = (item: any, i: number) => {
		const el = renderItem(item, i);
		return el ? (
			<MenuItemStyle
				key={i}
				compact
				icon={ICONS[item.type]}
				danger={DANGER.has(item.type)}>
				{el}
			</MenuItemStyle>
		) : null;
	};
	const entries: any[] = data || [];
	const safe = entries.map((item, i) => (DANGER.has(item?.type) ? null : render(item, i))).filter(Boolean);
	const danger = entries.map((item, i) => (DANGER.has(item?.type) ? render(item, i) : null)).filter(Boolean);

	return (
		// The bulk actions' dialogs are rendered inside the menu's items. Chakra's
		// Menu unmounts its content when it closes (lazyMount + unmountOnExit by
		// default), which took the dialog an item just opened with it — Calculate,
		// Edit and the rest opened for a moment or not at all. Mounted once, kept.
		<Menu.Root
			unmountOnExit={false}
			positioning={{ gutter: 4 }}>
			<Menu.Trigger
				as={Button}
				{...buttonCss}
				leftIcon={<Icon name='action-menu' />}>
				Menu
			</Menu.Trigger>
			<Portal>
				<MenuContainer
					p={1}
					gap={0}
					minW='220px'
					boxShadow='lg'>
					{safe}
					{safe.length > 0 && danger.length > 0 && <Menu.Separator my={1} />}
					{danger}
				</MenuContainer>
			</Portal>
		</Menu.Root>
	);

	function renderItem(item: any, i: number) {
		const bulkProps = { path, items, title: item?.title, route };
		// `key` goes on each element directly: React warns when it's spread in.
		const commonProps = {
			path,
			items,
			title: item?.title,
			prompt: item?.prompt,
			keyType: item?.keyType,
			icon: item?.icon,
		};

		switch (item.type) {
			case 'calculate':
				return (
					<CalculateModal
						key={i}
						{...commonProps}
						keys={item?.key}
						value={item?.value}
					/>
				);
			case 'edit':
				return (
					<EditManyModal
						key={i}
						{...commonProps}
						keys={item?.key}
						value={item?.value}
					/>
				);
			case 'update-api':
				return (
					<EditManyModal
						key={i}
						{...commonProps}
						keys={item?.key}
						value={item?.value}
					/>
				);

			case 'edit-select':
				return (
					<EditManySelectModal
						key={i}
						{...commonProps}
						keys={item?.key}
						options={item?.options}
					/>
				);
			case 'edit-many':
				return (
					<EditManySelectModal
						key={i}
						{...commonProps}
						keys={item?.key}
						options={item?.options}
					/>
				);
			// Columns, format (Excel / CSV / PDF), ticked rows or every matching row.
			case 'export':
				return (
					<ExportRows
						key={i}
						{...bulkProps}
					/>
				);
			case 'delete-many':
				return (
					<DeleteRows
						key={i}
						{...bulkProps}
					/>
				);
			case 'duplicate-many':
				return (
					<DuplicateRows
						key={i}
						{...bulkProps}
					/>
				);
			case 'archive':
				return route?.archive ? (
					<ArchiveRows
						key={i}
						{...bulkProps}
					/>
				) : null;
			case 'change-status':
				return (
					<StatusRows
						key={i}
						{...bulkProps}
					/>
				);
			case 'compare':
				return (
					<CompareRows
						key={i}
						{...bulkProps}
					/>
				);
			case 'merge':
				return (
					<MergeRows
						key={i}
						{...bulkProps}
					/>
				);
			case 'print':
				return (
					<PrintRows
						key={i}
						{...bulkProps}
					/>
				);
			case 'marketing-sms':
				return (
					<SendBulkSmsModal
						key={i}
						ids={items}
						path={path}
					/>
				);
			case 'edit-data-select':
				return (
					<EditDataSelectModal
						key={i}
						{...commonProps}
						dataModel={item?.dataModel}
						keys={item?.key}
						dataPath={item?.dataPath}
					/>
				);
			default:
				return null;
		}
	}
};

const buttonCss: any = {
	variant: 'white',
	size: 'xs',
	h: '32px',
	pl: 2,
};

export default SelectedMenu;
