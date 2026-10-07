import { Center, CenterProps, Flex, FlexProps, Text, Tooltip } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { FC, ReactNode } from 'react';

type SquareButtonProps = CenterProps & {
	label: string;
	children: ReactNode;
};

const SquareButton: FC<SquareButtonProps> = ({ children, label, ...props }) => {
	return (
		<Flex
			// whileTap={{ scale: 0.8 }}
			onClick={props.onClick}>
			<Tooltip.Root
				lazyMount
				openDelay={200}
				closeDelay={100}
				positioning={{ placement: 'top' }}>
				<Tooltip.Trigger asChild>
					<Center
						userSelect='none'
						boxSize={8}
						cursor='pointer'
						borderRadius={1}
						_hover={{
							boxShadow: 'md',
						}}
						{...props}>
						<Text>{children}</Text>
					</Center>
				</Tooltip.Trigger>
				<Tooltip.Positioner>
					<Tooltip.Content>{label}</Tooltip.Content>
				</Tooltip.Positioner>
			</Tooltip.Root>
		</Flex>
	);
};

export default SquareButton;
