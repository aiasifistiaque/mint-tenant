import { FC, ReactNode, createContext, useContext } from 'react';
import { Menu, Flex, Box } from '@chakra-ui/react';
import Link from 'next/link';
import { radius } from '../config';
import { Icon } from '../icon';

type CustomMenuItemProps = any & {
	children: ReactNode;
	href?: string;
	color?: string;
	/** An Icon name, or an icon element (e.g. a Lucide icon). */
	icon?: string | ReactNode;
	/** A destructive action: red, with a red hover. */
	danger?: boolean;
};

/**
 * Defaults for the items inside it — how the table's row and bulk menus give
 * each option an icon and the compact look, including options rendered by
 * other components (a bulk action's own trigger) that don't take those props.
 * An item's own props win.
 */
type ItemStyle = { icon?: ReactNode; danger?: boolean; compact?: boolean };
const MenuItemStyleContext = createContext<ItemStyle | null>(null);

export const MenuItemStyle: FC<ItemStyle & { children: ReactNode }> = ({ children, ...style }) => (
	<MenuItemStyleContext.Provider value={style}>{children}</MenuItemStyleContext.Provider>
);

/** The compact item: one line, 32px, a muted icon, no separators between items. */
const Compact: FC<CustomMenuItemProps> = ({ children, icon, href, danger, ...props }) => (
	<Menu.Item
		{...(href && { as: Link })}
		{...(href && { href })}
		h='32px'
		minW='210px'
		px={2}
		gap={2.5}
		borderRadius='md'
		fontSize='13px'
		fontWeight='500'
		cursor='pointer'
		bg='transparent'
		color={danger ? 'red.fg' : 'fg'}
		_hover={{ bg: danger ? 'red.subtle' : 'bg.muted' }}
		_highlighted={{ bg: danger ? 'red.subtle' : 'bg.muted' }}
		{...props}>
		{icon && (
			<Box
				as='span'
				display='inline-flex'
				flexShrink={0}
				color={danger ? 'red.fg' : 'fg.muted'}>
				{typeof icon === 'string' ? (
					<Icon
						name={icon}
						size={16}
					/>
				) : (
					icon
				)}
			</Box>
		)}
		{/* `inherit` twice: the theme's global `body, p, span` rule otherwise
		    paints this span at 15px in `fg`, over the item's size and the red
		    of a danger item. */}
		<Box
			as='span'
			flex={1}
			minW={0}
			fontSize='inherit'
			color='inherit'
			truncate>
			{children}
		</Box>
	</Menu.Item>
);

const CustomMenuItem: FC<CustomMenuItemProps> = props => {
	const style = useContext(MenuItemStyleContext);
	if (style?.compact)
		return (
			<Compact
				{...props}
				icon={props.icon ?? style.icon}
				danger={props.danger ?? style.danger}
			/>
		);

	const { children, icon, href, danger, ...rest } = props;
	return (
		<>
			<Menu.Item
				{...(href && { as: Link })}
				{...(href && { href })}
				borderBottomColor='border.light'
				borderRadius={radius?.MENU_INNER}
				fontSize='14px'
				minW='200px'
				px={2}
				py={1}
				bg='inherit'
				color='text.selected'
				fontWeight='500'
				_dark={{
					color: 'text.selectedDark',
					borderBottomColor: 'border.dark',
					bg: 'inherit',
					_hover: {
						bg: 'hover.dark',
					},
				}}
				_last={{
					borderBottomWidth: 0,
					borderBottomColor: 'transparent',
					borderBottomRadius: radius?.MENU,
				}}
				_hover={{
					bg: 'hover.light',
				}}
				{...rest}>
				<Flex
					w='full'
					gap={2}
					align='center'>
					{icon &&
						(typeof icon === 'string' ? (
							<Icon
								name={icon}
								size={17}
								// Unset, the icon takes the item's text colour, which follows
								// the mode; `text.selected` is the light-mode colour only.
								color={rest.color}
							/>
						) : (
							icon
						))}
					{children}
				</Flex>
			</Menu.Item>
			<Menu.Separator
				_last={{ display: 'none' }}
				m={1}
				_dark={{ borderColor: 'border.dark' }}
			/>
		</>
	);
};

export default CustomMenuItem;
