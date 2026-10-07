import { Button, ButtonProps } from '@chakra-ui/react';
import { FC, ReactNode } from 'react';
import { radius, sizes } from '../../config';

type FilterButtonProps = ButtonProps & {
	children: ReactNode;
};

const FilterButton: FC<FilterButtonProps> = ({ children, ...props }) => {
	return (
		<Button
			variant='outline'
			size='xs'
			h={sizes.CONTROL_HEIGHT_SM}
			px={2.5}
			gap={1.5}
			fontWeight='500'
			borderRadius={radius.FILTER}
			color='fg.muted'
			_hover={{ color: 'fg', bg: 'bg.subtle', borderColor: 'border.emphasized' }}
			{...props}>
			{children}
		</Button>
	);
};

export default FilterButton;
