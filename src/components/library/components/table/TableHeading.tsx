import { FC, ReactNode } from 'react';
import { Heading, HeadingProps } from '@chakra-ui/react';

type TableHeadingProps = HeadingProps & {
	children: string;
};

const TableHeading: FC<TableHeadingProps> = ({ children, ...props }) => {
	return (
		<Heading
			color='text.light'
			_dark={{ color: 'text.dark' }}
			fontSize={12}
			size='xs'
			fontWeight='700'
			{...props}>
			{children}
		</Heading>
	);
};

export default TableHeading;
