import { Button, Flex, IconButton } from '@chakra-ui/react';
import { Icon } from '../..';
import { useColorMode } from '@/components/ui/color-mode';

const buttonStyle = {
	position: 'absolute',
	top: '2',
	right: '2',
};

const EditImageButton = ({ onDelete }: { onDelete?: any }) => {
	const { colorMode } = useColorMode();
	const color = 'accent.contrast';

	return (
		<Flex
			gap={1}
			css={buttonStyle}>
			<IconButton size='xs'>
				<Icon
					name='edit'
					color={color}
					size={12}
				/>
			</IconButton>
		</Flex>
	);
};

export default EditImageButton;
