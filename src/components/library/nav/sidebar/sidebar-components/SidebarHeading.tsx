import { TextProps, Text, Skeleton } from '@chakra-ui/react';
import { FC } from 'react';

type SidebarHeadingProps = TextProps & {
	children: any;
	show: boolean | undefined;
	isLoading?: boolean;
};

const SidebarHeading: FC<SidebarHeadingProps> = ({
	children,
	isLoading = false,
	show = false,
	...props
}) => {
	if (!show) return null;
	return (
		<Skeleton
			loading={isLoading}
			px={2}
			mt={4}
			h='20px'
			borderRadius='90px'>
			<Text
				color='sidebar.bodyText.headingLight'
				_dark={{ color: 'sidebar.bodyText.headingDark' }}
				fontSize={{ base: 'md', md: '2xs' }}
				fontWeight='700'
				textTransform='uppercase'
				{...props}>
				{children}
			</Text>
		</Skeleton>
	);
};

export default SidebarHeading;
