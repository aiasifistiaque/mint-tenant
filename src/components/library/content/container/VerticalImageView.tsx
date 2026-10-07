import { ReactNode } from 'react';
import { Image } from '@chakra-ui/react';
import { Column } from '../..';

const VerticalImageView = ({ src, children }: { src: string; children: ReactNode }) => {
	return (
		<Column>
			<Image
				borderEndRadius='lg'
				w='100%'
				h='300px'
				objectFit='cover'
				src={src}
			/>
			<Column gap={4}>{children}</Column>
		</Column>
	);
};

export default VerticalImageView;
