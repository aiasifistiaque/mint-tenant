import { FC } from 'react';
import { Button, Menu } from '@chakra-ui/react';
import { Icon } from '../index';

type ButtonOfMenuProps = {
	children?: any;
	isActive?: boolean;
	[key: string]: any;
};

const WIDTH = '300px';

const ButtonOfMenu: FC<ButtonOfMenuProps> = ({ children, isActive, ...props }) => {
	return (
		<Button
			w={WIDTH}
			textAlign='left'
			borderRadius='lg'
			variant='outline'
			{...props}
			asChild>
			<Menu.Trigger>
				{children}
				<Icon name='select' />
			</Menu.Trigger>
		</Button>
	);
};

export default ButtonOfMenu;
