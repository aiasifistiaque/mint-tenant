import { FC } from 'react';
import { Menu, Button } from '@chakra-ui/react';
import { radius, Icon } from '../../..';

type DataMenuButtonProps = {
	value: string;
	isActive?: boolean;
	children: any;
	isFont?: boolean;
	[key: string]: any;
};

/**
 * The trigger for a data-menu field. It is a button, but it stands in for a
 * select inside a form — so it takes the field surface, not the button one:
 * same 36px height, same 8px corner, same 13px text and the same border as the
 * input above it.
 */
const DataMenuButton: FC<DataMenuButtonProps> = ({
	children,
	value,
	isActive,
	isFont,
	...props
}) => {
	return (
		<Menu.Trigger asChild>
			<Button
				variant='outline'
				colorPalette='gray'
				boxShadow='none'
				borderRadius={radius.INPUT}
				cursor='default'
				textAlign='left'
				size='sm'
				fontSize='13px'
				pl={3}
				pr={2}
				bg='field.bg'
				borderColor='field.border'
				_hover={{ borderColor: 'field.borderHover', bg: 'field.bg' }}
				// An empty field reads as a placeholder, not as a value. The old
				// `gray.300` came from the collapsed gray scale and rendered
				// near-black on black in dark mode; `field.placeholder` is the same
				// colour every real input uses for its own placeholder.
				color={value ? 'fg' : 'field.placeholder'}
				{...(!isFont && { fontWeight: value ? '400' : '500' })}
				{...props}>
				{children}
				<Icon
					name='select'
					size={16}
				/>
			</Button>
		</Menu.Trigger>
	);
};

export default DataMenuButton;
