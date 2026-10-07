import { FC } from 'react';
import { Flex, Text } from '@chakra-ui/react';
import { MintMark } from '../../../ui/AuthFrame';
import { CAPS } from '@/theme/tones';

/**
 * The top of the sidebar and the phone drawer, like the website's header: the
 * MINT mark and the organization's name in small spaced capitals.
 */
const SidebarBrand: FC<{ title?: string }> = ({ title }) => (
	<Flex
		align='center'
		gap={2.5}
		minW={0}>
		<MintMark size={22} />
		<Text
			as='span'
			{...CAPS}
			fontSize='12.5px !important'
			color='sidebar.headerText.light !important'
			_dark={{ color: 'sidebar.headerText.dark !important' }}
			truncate>
			{title}
		</Text>
	</Flex>
);

export default SidebarBrand;
