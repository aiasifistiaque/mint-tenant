import { Flex, Heading, Text } from '@chakra-ui/react';
import { FC } from 'react';
import { currency } from '../../';

type PriceItemProps = {
	title: string;
	children: number;
	heading?: boolean;
};

const PriceItem: FC<PriceItemProps> = ({ title, children, heading }) => {
	const Component = heading ? Heading : Text;
	return (
		<Flex
			align='center'
			justify='space-between'
			gap={2}
			fontSize={!heading ? '.95rem' : '1rem'}>
			<Component
				fontWeight='600'
				textAlign='right'
				fontSize='.8rem'>
				{title}
			</Component>
			<Component
				fontWeight='600'
				textAlign='right'
				size='xs'>
				{currency.symbol}
				{children?.toFixed(2).toLocaleString() || `0.00`}
			</Component>
		</Flex>
	);
};

export default PriceItem;
