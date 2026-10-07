import { FC } from 'react';
import { Center, CenterProps, FlexProps, Text } from '@chakra-ui/react';

type NoDataFoundProps = CenterProps & {
	title?: string;
	description?: string;
	children?: string;
};

// Default values for title and description
const DEFAULT_TITLE: string = 'No results found.';
const DEFAULT_DESCRIPTION: string =
	"There aren't any results for that query. Try using different filters.";

const NoDataFound: FC<NoDataFoundProps> = ({
	title = DEFAULT_TITLE,
	description = DEFAULT_DESCRIPTION,
	children,
	...props
}) => {
	return (
		<Center
			flexDir='column'
			h='400px'
			w='100%'
			gap={1}
			{...props}>
			<Text fontWeight='600'>{title}</Text>
			<Text>{children || description}</Text>
		</Center>
	);
};

export default NoDataFound;
