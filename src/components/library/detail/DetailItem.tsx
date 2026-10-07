import { Text, FlexProps, Grid, GridProps } from '@chakra-ui/react';
import { FC, ReactNode } from 'react';
import { Column } from '..';

type DetailItemProps = FlexProps & {
	title: string;
	children: ReactNode;
	row?: boolean;
};

const FONT_SIZE = '.875rem';
const headingStyle = {
	fontSize: FONT_SIZE,
	fontWeight: '600',
};

const DetailItem: FC<DetailItemProps> = ({ title, children, row, ...props }) => {
	if (row)
		return (
			<Grid
				gap={2}
				gridTemplateColumns='1fr 3fr'>
				<Text {...headingStyle}>{title}</Text>
				<Text fontSize={FONT_SIZE}>{children}</Text>
			</Grid>
		);
	return (
		<Column {...props}>
			<Text {...headingStyle}>{title}</Text>
			<Text fontSize={FONT_SIZE}>{children}</Text>
		</Column>
	);
};

export default DetailItem;
