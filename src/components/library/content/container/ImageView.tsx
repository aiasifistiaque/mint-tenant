import { ReactNode } from 'react';
import HorizontalImageView from './HorizontalImageView';
import VerticalImageView from './VerticalImageView';
import { PLACEHOLDER_IMAGE } from '../../config';

const ImageView = ({
	src,
	children,
	direction,
}: {
	src: string;
	children: ReactNode;
	direction?: 'row' | 'column';
}) => {
	if (direction === 'row') {
		return <HorizontalImageView src={src || PLACEHOLDER_IMAGE}>{children}</HorizontalImageView>;
	}
	return <VerticalImageView src={src || PLACEHOLDER_IMAGE}>{children}</VerticalImageView>;
};

export default ImageView;
