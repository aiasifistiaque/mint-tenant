'use client';
import { useState } from 'react';
import { Menu, Center, Flex, Box, Text, FlexProps, Switch } from '@chakra-ui/react';
import { Moon } from 'lucide-react';

import CustomMenuItem, { MenuItemStyle } from './CustomMenuItem';
import { MenuIconContainer, MenuContainer } from '.';
import { Icon } from '../icon';
import { useGetSelfQuery, logout, useSignOutHereMutation } from '../store';
import { useAppDispatch } from '../hooks';
import ThemeModal from '../theme/ThemeModal';
import { useColorMode } from '@/components/ui/color-mode';

/** Up to two initials: "Asif Istiaque" → "AI", "admin" → "A". */
const initialsOf = (name?: string) =>
	(name ?? '')
		.trim()
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map(part => part[0])
		.join('')
		.toUpperCase();

const SelfMenu = ({ iconSize }: { iconSize?: number }) => {
	const { data } = useGetSelfQuery({});
	const dispatch = useAppDispatch();
	const [themesOpen, setThemesOpen] = useState(false);
	const [signOutHere] = useSignOutHereMutation();
	const { colorMode, toggleColorMode } = useColorMode();
	const dark = colorMode === 'dark';
	// Ends this session on the server too (it leaves Signed-in devices, and the
	// token stops working), then drops it here — even if the server is unreachable.
	const handleLogout = async () => {
		try {
			await signOutHere().unwrap();
		} catch {
			/* signed out locally regardless */
		}
		dispatch(logout());
	};

	const initials = initialsOf(data?.name);
	const role = data?.role?.name;

	return (
		<>
			<Menu.Root positioning={{ placement: 'bottom-end', gutter: 8 }}>
				<MenuIconContainer asChild>
					<Menu.Trigger aria-label='Account menu'>
						<Center>
							{initials ? (
								<Text {...triggerInitialsCss}>{initials}</Text>
							) : (
								<Icon
									color='inherit'
									name='user-outline'
									size={iconSize || 16}
								/>
							)}
						</Center>
					</Menu.Trigger>
				</MenuIconContainer>

				{/* `boxShadow` unset so the menu recipe's softer, layered shadow shows
				    instead of MenuContainer's flat `md`. */}
				<MenuContainer
					p='6px'
					gap={0}
					w='256px'
					boxShadow={undefined}>
					<Flex {...headerCss}>
						<Center {...avatarCss}>{initials || <Icon name='user-outline' size={16} color='inherit' />}</Center>
						<Box
							minW={0}
							flex={1}>
							<Text {...nameCss}>{data?.name || 'Signed in'}</Text>
							{data?.email ? <Text {...subtleCss}>{data.email}</Text> : null}
							{role ? <Text {...roleCss}>{role}</Text> : null}
						</Box>
					</Flex>

					<Menu.Separator {...separatorCss} />

					<MenuItemStyle compact>
						<CustomMenuItem
							value='settings'
							icon='config'
							href='/settings'>
							Settings
						</CustomMenuItem>
						<CustomMenuItem
							value='themes'
							icon='palette'
							onClick={() => setThemesOpen(true)}>
							Themes
						</CustomMenuItem>
						{/* The whole row toggles, and the menu stays open to show the change.
						    The switch only shows the state, so a click can't toggle twice. */}
						<CustomMenuItem
							value='dark-mode'
							icon={<Moon size={16} />}
							closeOnSelect={false}
							onClick={toggleColorMode}>
							<Flex
								flex={1}
								align='center'
								justify='space-between'
								gap={2}>
								Dark mode
								<Switch.Root
									size='sm'
									checked={dark}
									aria-hidden
									tabIndex={-1}
									pointerEvents='none'>
									<Switch.HiddenInput tabIndex={-1} />
									<Switch.Control />
								</Switch.Root>
							</Flex>
						</CustomMenuItem>

						<Menu.Separator {...separatorCss} />

						<CustomMenuItem
							value='logout'
							icon='logout'
							danger
							onClick={handleLogout}>
							Log out
						</CustomMenuItem>
					</MenuItemStyle>
				</MenuContainer>
			</Menu.Root>
			<ThemeModal
				isOpen={themesOpen}
				onClose={() => setThemesOpen(false)}
			/>
		</>
	);
};

const triggerInitialsCss: any = {
	fontSize: '11px',
	fontWeight: '600',
	letterSpacing: '0.02em',
	lineHeight: 1,
	color: 'inherit',
};

const headerCss: FlexProps = {
	align: 'center',
	gap: 3,
	px: 2,
	pt: 2,
	pb: 2.5,
};

// The accent fill, so it follows the colour theme like the primary buttons.
const avatarCss: any = {
	flexShrink: 0,
	boxSize: '36px',
	borderRadius: 'full',
	bg: 'gray.solid',
	color: 'gray.contrast',
	fontSize: '13px',
	fontWeight: '600',
	letterSpacing: '0.02em',
	boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.08)',
};

const nameCss: any = {
	fontSize: '13.5px',
	fontWeight: '600',
	lineHeight: '1.3',
	color: 'fg',
	truncate: true,
};

const subtleCss: any = {
	fontSize: '12px',
	lineHeight: '1.35',
	color: 'fg.muted',
	truncate: true,
};

const roleCss: any = {
	display: 'inline-block',
	mt: 1.5,
	px: 1.5,
	py: '1px',
	borderRadius: 'full',
	borderWidth: '1px',
	borderColor: 'border',
	fontSize: '11px',
	fontWeight: '500',
	lineHeight: '1.5',
	color: 'fg.muted',
};

const separatorCss: any = {
	my: '5px',
	mx: '-6px',
	borderColor: 'border.muted',
};

export default SelfMenu;
