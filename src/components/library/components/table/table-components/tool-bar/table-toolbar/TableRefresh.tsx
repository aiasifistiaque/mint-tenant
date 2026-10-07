import { IconButton, Tooltip } from '@chakra-ui/react';
import { radius, sizes } from '../../../../../config';
import { refresh } from '../../../../../store';
import { useAppDispatch } from '../../../../../hooks';
import { updateTable, Icon } from '../../../../..';

const TableRefresh = () => {
	const dispatch = useAppDispatch();

	const onReset = () => {
		dispatch(refresh());
	};

	return (
		<Tooltip.Root lazyMount positioning={{ placement: 'top' }}>
			<Tooltip.Trigger asChild>
				<IconButton
					aria-label='Refresh'
					h={sizes.SEARCH_BAR_HEIGHT}
					w={sizes.SEARCH_BAR_HEIGHT}
					minW={sizes.SEARCH_BAR_HEIGHT}
					size='sm'
					variant='outline'
					borderRadius={radius?.BUTTON}
					onClick={onReset}
					color='fg.muted'
					bg='field.bg'
					borderColor='field.border'
					_hover={{ bg: 'bg.subtle', color: 'fg', borderColor: 'border.emphasized' }}>
					<Icon
						name='refresh'
						size={14}
					/>
				</IconButton>
			</Tooltip.Trigger>
			<Tooltip.Positioner>
				<Tooltip.Content>Refresh</Tooltip.Content>
			</Tooltip.Positioner>
		</Tooltip.Root>
	);
};

export default TableRefresh;
