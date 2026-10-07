import { FC, ReactNode, useState } from 'react';
import { Menu } from '@chakra-ui/react';
import {
	ArrowUpRight,
	Copy,
	Eye,
	ListChecks,
	MousePointerClick,
	PanelRightOpen,
	Pencil,
	PencilLine,
	Plus,
	SquareArrowOutUpRight,
	Trash2,
	Zap,
} from 'lucide-react';
import {
	MenuButton,
	CustomTd,
	CreateModal,
	MenuContainer,
	MenuItem,
	MenuItemStyle,
	DeleteItemModal,
	ViewItemModal,
	DuplicateModal,
	DecisionModal,
	UpdateDataMenuModal,
	UpdateStringModal,
	ViewServerModal,
	useGetConfigQuery,
} from '../../../..';
import { pagePath, projectHref } from '../../../../config/lib/constants/panel';

type TableMenuProps = {
	data: any;
	id: string;
	path: string;
	title?: any;
	item?: any;
	doc: any;
	children?: ReactNode;
};

// Item types that carry a dialog/drawer, keyed to whether they need the schema
// config fetch below (only 'edit-server-modal' does).
const DIALOG_TYPES = new Set([
	'post',
	'edit-modal',
	'edit-server-modal',
	'delete',
	'update-key',
	'update-api',
	'duplicate',
	'view-modal',
	'view-server-modal',
]);

const ICON = { size: 16, strokeWidth: 1.75 };

/** Each row-menu option's icon, by its type. */
const iconFor = (item: any) => {
	switch (item?.type) {
		case 'view':
		case 'view-item':
			return <Eye {...ICON} />;
		case 'view-modal':
		case 'view-server-modal':
			return <PanelRightOpen {...ICON} />;
		case 'edit':
		case 'edit-modal':
		case 'edit-server-modal':
			return <Pencil {...ICON} />;
		case 'update-key':
			return item?.keyType === 'data-menu' ? <ListChecks {...ICON} /> : <PencilLine {...ICON} />;
		case 'update-api':
			return <Zap {...ICON} />;
		case 'duplicate':
			return <Copy {...ICON} />;
		case 'post':
			return <Plus {...ICON} />;
		case 'delete':
			return <Trash2 {...ICON} />;
		case 'link':
		case 'redirect':
			return <ArrowUpRight {...ICON} />;
		case 'custom-redirect':
			return <SquareArrowOutUpRight {...ICON} />;
		default:
			return <MousePointerClick {...ICON} />;
	}
};

/** Destructive options go last, after a divider, in red. */
const isDanger = (item: any) => item?.type === 'delete' || item?.danger === true;

const TableMenu: FC<TableMenuProps> = ({
	data,
	id,
	path,
	title,
	item: dataItem,
	doc,
	children,
}) => {
	// Every row on a table page mounts its own TableMenu, and each menu item can
	// carry a modal with its own RTK Query/mutation hooks (edit, delete, decision
	// dialogs, etc). Mounting all of that for every row up front — most of which
	// never get opened — was the bulk of this menu's cost on large tables. Only
	// the row(s) a user actually opens need it, so the content (and the schema
	// fetch below, which only edit-server-modal items need) stays gated behind
	// "has this menu ever been opened" rather than mounting unconditionally.
	const [hasOpened, setHasOpened] = useState(false);
	const needsSchema = data?.some((item: any) => item?.type === 'edit-server-modal');

	const { data: schemaData } = useGetConfigQuery(path, {
		skip: !hasOpened || !needsSchema,
	});

	// Which row-menu item's dialog is currently open, if any. The dialog itself
	// is rendered as a sibling of <Menu.Root> (see the bottom of this
	// component's return), the same way the Vercel project page's Deploy button
	// keeps its "Redeploy production" confirm dialog outside the dropdown menu.
	// Chakra closes (and unmounts) a Menu's content as soon as it closes, so a
	// dialog rendered *inside* the dropdown would get torn down the instant the
	// menu closes — which is why the row menu here uses Chakra's normal
	// closeOnSelect default instead of the closeOnSelect={false} workaround
	// these item components used to need.
	const [activeIndex, setActiveIndex] = useState<number | null>(null);
	const closeActive = () => setActiveIndex(null);

	const renderMenuTrigger = (item: any, i: number) => {
		// No `key` in here — React does not read a key out of a spread
		// props object, so every `{...commonProps}` below sets it
		// directly on the element instead.
		if (item?.renderCondition && !item?.renderCondition(doc)) return null;

		if (item?.getValue) {
			data = item?.getValue(doc);
		}

		if (DIALOG_TYPES.has(item.type)) {
			return (
				<MenuItem
					key={i}
					onClick={() => setActiveIndex(i)}>
					{item?.title}
				</MenuItem>
			);
		}

		switch (item.type) {
			case 'custom-redirect':
				return (
					<MenuItem
						closeOnSelect={false}
						href={item?.href(doc) || '#'}
						key={i}>
						{item?.title}
					</MenuItem>
				);
			case 'redirect':
				return (
					<MenuItem
						href={item?.href || '#'}
						key={i}>
						{item?.title}
					</MenuItem>
				);

			case 'link':
				return (
					<MenuItem
						href={`${item?.href}/${id}` || '#'}
						key={i}>
						{item?.title}
					</MenuItem>
				);
			case 'edit':
				return (
					<MenuItem
						key={i}
						href={`${pagePath(path)}/edit/${id}`}>
						{item?.title}
					</MenuItem>
				);
			case 'view':
				return (
					<MenuItem
						key={i}
						href={`${pagePath(path)}/${id}`}>
						{item?.title}
					</MenuItem>
				);
			case 'view-item':
				return (
					<MenuItem
						key={i}
						href={projectHref(`/view/${path}/${id}`)}>
						{item?.title}
					</MenuItem>
				);

			// Arbitrary caller-supplied components: unlike the built-in dialog
			// types above, these bundle their own trigger and dialog and there's
			// no guarantee they support being driven by an external `open` prop,
			// so they keep the old self-contained (closeOnSelect={false}) form.
			case 'custom':
				return (
					<item.modal
						key={i}
						id={item?.id ? item?.id(doc) : id}
						path={item?.path || path}
						title={item?.title}
						data={doc}
						doc={doc}
					/>
				);
			case 'custom-modal':
				return (
					<item.modal
						key={i}
						id={item?.id ? item?.id(doc) : id}
						path={item?.path || path}
						data={doc}
						title={item?.title}
					/>
				);
			default:
				return (
					<MenuItem
						closeOnSelect={false}
						key={i}>
						{item?.title}
					</MenuItem>
				);
		}
	};

	const renderActiveDialog = () => {
		if (activeIndex === null) return null;
		const item = data?.[activeIndex];
		if (!item) return null;

		const commonProps = {
			id: item?.id ? item?.id(doc) : id,
			path: item?.path || path,
			open: true,
			onClose: closeActive,
		};

		switch (item.type) {
			case 'post':
				return (
					<CreateModal
						path={item?.path || path}
						data={item?.dataModel}
						doc={doc}
						invalidate={item?.invalidate}
						id={item?.id ? item?.id(doc) : id}
						title={item?.title}
						open
						onClose={closeActive}
					/>
				);
			case 'edit-modal':
				return (
					<CreateModal
						{...commonProps}
						icon='edit-outline'
						data={item?.dataModel}
						title='Edit'
						type='update'
						layout={item?.layout}
						item={item}
					/>
				);
			case 'edit-server-modal':
				return (
					<CreateModal
						{...commonProps}
						icon='edit-outline'
						data={schemaData?.form}
						title='Update'
						type='update'
						trigger={item?.title}
						layout={item?.layout}
						item={item}
					/>
				);
			case 'delete':
				return (
					<DeleteItemModal
						{...commonProps}
						title={item?.title}
						item={item}
						doc={doc}
					/>
				);
			case 'update-key':
				switch (item?.keyType) {
					case 'data-menu':
						return (
							<UpdateDataMenuModal
								item={item}
								id={item?.id ? item?.id(doc) : id}
								doc={doc}
								open
								onClose={closeActive}
							/>
						);
					case 'string':
						return (
							<UpdateStringModal
								item={item}
								id={item?.id ? item?.id(doc) : id}
								doc={doc}
								path={item?.path || path}
								type='text'
								open
								onClose={closeActive}
							/>
						);
					case 'number':
						return (
							<UpdateStringModal
								item={item}
								id={item?.id ? item?.id(doc) : id}
								doc={doc}
								path={item?.path || path}
								type='number'
								open
								onClose={closeActive}
							/>
						);
					default:
						return null;
				}
			case 'update-api':
				return (
					<DecisionModal
						item={item}
						path={item?.path || path}
						doc={doc}
						itemId={id}
						open
						onClose={closeActive}
					/>
				);
			case 'duplicate':
				return (
					<DuplicateModal
						{...commonProps}
						title={item?.title}
					/>
				);
			case 'view-modal':
				return (
					<ViewItemModal
						{...commonProps}
						title={item?.title}
						dataModel={item?.dataModel}
						item={item}
					/>
				);
			case 'view-server-modal':
				return (
					<ViewServerModal
						{...commonProps}
						title={item?.title}
					/>
				);
			default:
				return null;
		}
	};

	/** Every option with its icon; destructive ones last, after one divider. */
	const renderOptions = () => {
		const entries = (data || []).map((item: any, i: number) => ({ item, i }));
		const render = ({ item, i }: any) => {
			const el = renderMenuTrigger(item, i);
			return el ? (
				<MenuItemStyle
					key={i}
					compact
					icon={iconFor(item)}
					danger={isDanger(item)}>
					{el}
				</MenuItemStyle>
			) : null;
		};
		const safe = entries.filter((e: any) => !isDanger(e.item)).map(render).filter(Boolean);
		const danger = entries.filter((e: any) => isDanger(e.item)).map(render).filter(Boolean);
		return (
			<>
				{safe}
				{safe.length > 0 && danger.length > 0 && <Menu.Separator my={1} />}
				{danger}
			</>
		);
	};

	return (
		<>
			<Menu.Root
				// Opens from the button, lined up with its right edge; flips up near the bottom of the screen.
				positioning={{ placement: 'bottom-end', gutter: 4 }}
				onOpenChange={(e: any) => e.open && setHasOpened(true)}>
				<Menu.Trigger asChild>{children}</Menu.Trigger>
				{/* {children ? (
					<Menu.Trigger asChild>{children}</Menu.Trigger>
				) : (
					<CustomTd>
						<Menu.Trigger asChild>
							<Center h='full'>
								<MenuButton />
							</Center>
						</Menu.Trigger>
					</CustomTd>
				)} */}

				{hasOpened && (
					<MenuContainer
						p={1}
						gap={0}
						minW='220px'
						boxShadow='lg'>
						{renderOptions()}
					</MenuContainer>
				)}
			</Menu.Root>
			{renderActiveDialog()}
		</>
	);
};

export default TableMenu;
