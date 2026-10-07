import { FC } from 'react';
import { Center, Heading, Text, Flex } from '@chakra-ui/react';
import { ConfigContainer, ConfigContainerBody, Icon } from '../../..';
import { mainProps, iconContainerProps, NoDataContainerProps } from './styles';

const NoDataContainer: FC<NoDataContainerProps> = ({ title, icon, iconSize, children }) => {
	return (
		<ConfigContainer>
			<ConfigContainerBody>
				<Center {...mainProps}>
					<Flex {...iconContainerProps}>
						<Icon
							name={icon || 'thunder'}
							size={iconSize || 29}
						/>
					</Flex>
					<Heading fontSize='24px'>{title}</Heading>
					<Text fontSize='14px'>{children}</Text>
				</Center>
			</ConfigContainerBody>
		</ConfigContainer>
	);
};

export default NoDataContainer;
