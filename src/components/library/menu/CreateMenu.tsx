import { Menu, IconButton, Tooltip } from '@chakra-ui/react';
import CustomMenuItem from './CustomMenuItem';
import MenuContainer from './MenuContainer';

import { Icon } from '..';
import { useColorMode } from '@/components/ui/color-mode';

const CreateMenu = () => {
	const { colorMode } = useColorMode();
	const color = 'accent.contrast';
	return (
		<Menu.Root>
			<Tooltip.Root
				lazyMount
				openDelay={200}
				closeDelay={100}
				positioning={{ placement: 'bottom' }}>
				<Tooltip.Trigger asChild>
					<Menu.Trigger asChild>
						<IconButton
							size='xs'
							borderRadius='full'>
							<Icon
								name='add'
								size={20}
								color={color}
							/>
						</IconButton>
					</Menu.Trigger>
				</Tooltip.Trigger>
				<Tooltip.Positioner>
					<Tooltip.Content>Create</Tooltip.Content>
				</Tooltip.Positioner>
			</Tooltip.Root>

			<MenuContainer>
				<Menu.ItemGroup title='Create'>
					<CustomMenuItem href='/products/create'>Create Product</CustomMenuItem>
				</Menu.ItemGroup>
			</MenuContainer>
		</Menu.Root>
	);
};

export default CreateMenu;
