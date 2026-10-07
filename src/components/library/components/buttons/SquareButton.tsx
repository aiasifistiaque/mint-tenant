import { Center, CenterProps, Tooltip, Portal } from '@chakra-ui/react';
import { ReactNode, FC } from 'react';
import { radius, sizes } from '../../config';

type SquareButtonProps = CenterProps & {
	label: string;
	children: ReactNode;
	disabled?: boolean;
};

/**
 * The compact icon buttons in the pagination bar. They sit shoulder to
 * shoulder, so the target stays square and hover fills it — a drop shadow on a
 * 30px control just reads as a smudge.
 */
const SquareButton: FC<SquareButtonProps> = ({ children, label, disabled, ...props }) => {
	return (
		<Tooltip.Root
			lazyMount
			openDelay={300}
			closeDelay={80}
			disabled={disabled}
			positioning={{ placement: 'top' }}>
			<Tooltip.Trigger asChild>
				<Center
					as='button'
					userSelect='none'
					boxSize={sizes.CONTROL_HEIGHT_SM}
					cursor='pointer'
					borderRadius={radius.BUTTON}
					color='fg.muted'
					transitionProperty='background-color, color'
					transitionDuration='120ms'
					_hover={{ bg: 'bg.muted', color: 'fg' }}
					_active={{ bg: 'bg.emphasized' }}
					_focusVisible={{
						outline: '2px solid',
						outlineColor: 'field.focusRing',
						outlineOffset: '1px',
					}}
					aria-label={label}
					aria-disabled={disabled}
					{...(disabled && {
						opacity: 0.35,
						pointerEvents: 'none' as const,
						cursor: 'default',
					})}
					{...props}>
					{children}
				</Center>
			</Tooltip.Trigger>
			<Portal>
				<Tooltip.Positioner>
					<Tooltip.Content>{label}</Tooltip.Content>
				</Tooltip.Positioner>
			</Portal>
		</Tooltip.Root>
	);
};

export default SquareButton;
