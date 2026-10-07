import { Button, Flex, ButtonProps } from '@chakra-ui/react';

const OrderButton = ({ children, ...props }: ButtonProps & { children: string }) => {
	return (
		<Flex
			flex={1}
			align='flex-end'
			justify='flex-end'>
			<Button {...props}>{children}</Button>
		</Flex>
	);
};

export default OrderButton;
