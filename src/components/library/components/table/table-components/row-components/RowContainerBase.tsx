import { StackProps, Grid } from '@chakra-ui/react';
import { FC, ReactNode } from 'react';
import { radius, shadow } from '../../../..';

type RowContainerMobileProps = StackProps & {
	children: ReactNode;
};

/**
 * On small screens each row becomes a card, since columns can't survive there.
 * The card carries the separation itself — a border, a soft shadow and real
 * padding — so the fields inside need no rules between them.
 */
const RowContainerBase: FC<RowContainerMobileProps> = ({ children, ...props }) => {
	return (
		<Grid
			overflow='hidden'
			// A bare `1fr` is really `minmax(auto, 1fr)` — a track still won't
			// shrink below its item's content size, so one field with a long
			// unbroken value (a URL) could blow its column past its fair half
			// and push the field beside it out of the card. `minmax(0, 1fr)`
			// is the actual "split evenly, let content wrap" behavior.
			gridTemplateColumns='minmax(0, 1fr) minmax(0, 1fr)'
			position='relative'
			width='100%'
			borderRadius={radius.CONTAINER}
			mb={3}
			bg='table.row.light'
			borderWidth={1}
			borderColor='table.cardBorder.light'
			boxShadow={shadow.SUBTLE}
			columnGap={3}
			rowGap={4}
			px={4}
			py={4}
			transitionProperty='border-color, box-shadow, transform'
			transitionDuration='140ms'
			_active={{ borderColor: 'border.emphasized', transform: 'scale(0.995)' }}
			_last={{ mb: 4 }}
			_dark={{
				bg: 'table.row.dark',
				borderColor: 'table.cardBorder.dark',
				boxShadow: 'none',
			}}
			{...props}>
			{children}
		</Grid>
	);
};

export default RowContainerBase;
