import { IconButton as IButton, IconButtonProps, Tooltip } from '@chakra-ui/react';
import { Icon } from '..';

const IconButton = ({
	color,
	iconName,
	iconSize,
	tooltip,
	...props
}: IconButtonProps & { iconName: any; color?: string; iconSize?: number; tooltip?: string }) => {
	const Container = ({ children }: any) => {
		if (tooltip)
			return (
				<Tooltip.Root
					lazyMount
					openDelay={200}
					closeDelay={100}
					positioning={{ placement: 'top' }}>
					<Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
					<Tooltip.Positioner>
						<Tooltip.Content>{tooltip}</Tooltip.Content>
					</Tooltip.Positioner>
				</Tooltip.Root>
			);
		return <>{children}</>;
	};
	return (
		<Container>
			<IButton {...props}>
				<Icon
					name={iconName}
					color={color || 'inherit'}
					size={iconSize}
				/>
			</IButton>
		</Container>
	);
};

export default IconButton;
