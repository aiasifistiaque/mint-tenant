import { FC } from 'react';
import { Flex, FlexProps, Text } from '@chakra-ui/react';

import { useIsMobile, useAppSelector } from '../../../../hooks';
import { sizes } from '../../../../config';
import Pagination from '../../../../components/pagination/Pagination';

type ResultContainerProps = FlexProps & {
	data: any;
};

/**
 * The bar pinned to the bottom of every table page. Opaque rather than
 * translucent: rows scroll underneath it constantly, and a blurred bar makes
 * the browser recomposite the whole strip on every frame.
 */
const ResultContainer: FC<ResultContainerProps> = ({ data, ...props }) => {
	const { selectedItems } = useAppSelector(state => state.table);
	const isMobile = useIsMobile();

	if (selectedItems.length > 0) {
		return null;
	}

	return (
		<Flex
			position='fixed'
			bottom={0}
			left={isMobile ? 0 : sizes.HOME_NAV_LEFT}
			w={isMobile ? '100vw' : sizes.HOME_NAV_MAX_WIDTH}
			maxW='100%'
			zIndex={5}
			borderTopWidth='1px'
			borderTopColor='border.muted'
			bg='bg.panel'
			_dark={{ bg: 'bg', borderTopColor: 'border' }}
			{...props}>
			<Flex
				px={{ base: 4, md: 6 }}
				py={2}
				align='center'
				justify='space-between'
				gap={4}
				w='100%'>
				<Text
					fontSize='13px'
					color='fg.muted'
					whiteSpace='nowrap'>
					<Text
						as='span'
						fontWeight='600'
						color='fg'>
						{data?.totalDocs?.toLocaleString() || '--'}
					</Text>{' '}
					results
				</Text>

				<Pagination data={data && data} />
			</Flex>
		</Flex>
	);
};

export default ResultContainer;
