import { ReactNode } from 'react';
import { Flex } from '@chakra-ui/react';
import { padding, sizes } from '../config';

const PX = { base: padding.BASE, md: padding.MD, lg: padding.LG };

/**
 * `grow`: fill the space above a footer instead of a full screen of its own —
 * with a footer under it, the fixed height pushed the footer below the fold
 * even on a page with nothing on it. `bare`: no padding or gap, exactly the
 * window under the navbar — full-screen tools like the site builder.
 */
const MainBody = ({ children, grow = false, bare = false }: { children: ReactNode; grow?: boolean; bare?: boolean }) =>
	bare ? (
		<Flex
			flexDir='column'
			overflow='clip'
			// The navbar is sizes.NAV_HEIGHT = 14 = 3.5rem tall.
			h='calc(100dvh - 3.5rem)'
			w='full'>
			{children}
		</Flex>
	) : (
	<Flex
		pt={{ base: 2, md: 1 }}
		flexDir='column'
		gap={4}
		// `clip`, not `hidden`: hidden makes this a scroll container (and turns
		// overflow-x into `auto`), which pins every `position: sticky` inside —
		// a guide's "On this page" list, a toolbar — to a box that never
		// scrolls, so nothing stuck. Clip cuts off the same overflow without it.
		overflow='clip'
		{...(grow ? { flex: 1 } : { h: `calc(100vh - ${sizes.NAV_HEIGHT})` })}
		px={PX}
		pb='32px'
		w='full'>
		{children}
	</Flex>
	);

export default MainBody;
