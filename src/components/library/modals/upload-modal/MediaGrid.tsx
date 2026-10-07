import { FC, ReactNode } from 'react';
import { Box, Center, Grid, Skeleton, Text } from '@chakra-ui/react';
import ImageComponent from './ImageComponent';

/** The upload modal's thumbnail grid — three across on a phone, else as many ~112px squares as fit. */
export const GRID_COLUMNS = { base: 'repeat(3, minmax(0, 1fr))', sm: 'repeat(auto-fill, minmax(112px, 1fr))' };

type MediaGridProps = {
	items: { _id?: string; url: string; thumbnail?: string }[];
	type: string;
	selected: any;
	onToggle: (url: string) => void;
	/** First page still loading: show placeholders instead of the grid. */
	loading?: boolean;
	empty?: ReactNode;
};

const MediaGrid: FC<MediaGridProps> = ({ items, type, selected, onToggle, loading, empty }) => {
	if (loading)
		return (
			<Grid
				templateColumns={GRID_COLUMNS}
				gap={{ base: 2, sm: 2.5 }}>
				{Array.from({ length: 12 }, (_, i) => (
					<Skeleton
						key={i}
						aspectRatio={1}
						borderRadius='lg'
					/>
				))}
			</Grid>
		);

	if (!items.length) return <>{empty}</>;

	return (
		<Grid
			templateColumns={GRID_COLUMNS}
			gap={{ base: 2, sm: 2.5 }}
			// Room for the selected tile's offset ring at the grid's edges.
			p='4px'>
			{items.map(item => (
				<ImageComponent
					key={item._id || item.url}
					src={item.url}
					thumbnail={item.thumbnail}
					type={type}
					selected={selected}
					onClick={() => onToggle(item.url)}
				/>
			))}
		</Grid>
	);
};

/** A quiet, centred message with an optional action under it. */
export const MediaEmpty: FC<{ icon: ReactNode; title: string; hint?: string; action?: ReactNode }> = ({
	icon,
	title,
	hint,
	action,
}) => (
	<Center
		flexDir='column'
		textAlign='center'
		gap={2}
		py={14}
		px={4}>
		<Center
			boxSize='44px'
			borderRadius='full'
			bg='bg.muted'
			color='fg.muted'
			mb={1}>
			{icon}
		</Center>
		<Text
			fontSize='14px'
			fontWeight='600'>
			{title}
		</Text>
		{hint && (
			<Text
				fontSize='13px'
				color='fg.muted'
				maxW='340px'>
				{hint}
			</Text>
		)}
		{action && <Box mt={2}>{action}</Box>}
	</Center>
);

export default MediaGrid;
