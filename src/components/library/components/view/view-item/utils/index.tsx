import { GridProps, Skeleton } from '@chakra-ui/react';
import { ReactNode } from 'react';

export type ViewItemProps = any & {
	title: string;
	type?: string;
	children?: ReactNode;
	colorPalette?: any;
	path?: string;
	isLoading?: boolean;
	copy?: boolean;
	originalType?: string;
	idKey?: string;
	id?: string;
};

export const SkeletonContent = ({
	isLoading,
	children,
}: {
	isLoading: boolean;
	children: ReactNode;
}) => (
	<Skeleton
		loading={isLoading}
		height={isLoading ? '20px' : 'auto'}
		width={isLoading ? '100px' : 'full'}>
		{children}
	</Skeleton>
);
