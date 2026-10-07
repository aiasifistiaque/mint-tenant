import { FC } from 'react';
import { Flex, FlexProps, Text } from '@chakra-ui/react';

import { useIsMobile, useAppSelector, Pagination, THEME, SpaceBetween } from '../../../..';

type ResultContainerProps = FlexProps & {
	data: any;
};

//Migration checked

const TableResultContainer: FC<ResultContainerProps> = ({ data, ...props }) => {
	const { selectedItems } = useAppSelector(state => state.table);
	const isMobile = useIsMobile();

	if (selectedItems.length > 0) {
		return null;
	}

	return (
		<Flex
			bg='sidebar.light'
			_dark={{
				bg: 'sidebar.dark',
			}}
			pl={{ base: 0, md: THEME == 'basic' ? 0 : 4 }}
			css={{
				...styles.container,
				pb: isMobile ? 4 : 0,
				...props,
			}}>
			<SpaceBetween
				px={4}
				gap={4}
				w='100%'
				bg='result.bg.light'
				_dark={{ bg: 'result.bg.dark' }}
				borderBottom='1px solid'
				borderBottomColor='result.border.light'
				_light={{ borderBottomColor: 'result.border.dark' }}>
				<Text>
					<b>{data?.totalDocs || '--'}</b> results
				</Text>

				<Pagination
					data={data && data}
					showPerPage={false}
				/>
			</SpaceBetween>
		</Flex>
	);
};

const styles = {
	container: {
		overflow: 'scroll',
		maxW: '100%',
		fontSize: '.9rem',
	},
};

export default TableResultContainer;
