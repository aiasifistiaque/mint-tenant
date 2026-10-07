import { ReactNode } from 'react';
import { Grid, Image } from '@chakra-ui/react';
import { Column, Align } from '../..';

const HorizontalImageView = ({ src, children }: { src: string; children: ReactNode }) => {
	return (
		<Grid
			gridTemplateColumns={{ base: '1fr', md: '1fr 1fr' }}
			gap={8}>
			<Image
				borderEndRadius='lg'
				w='100%'
				h='400px'
				objectFit='cover'
				src={src}
			/>
			<Column gap={6}>{children}</Column>
		</Grid>
	);
};

export default HorizontalImageView;
