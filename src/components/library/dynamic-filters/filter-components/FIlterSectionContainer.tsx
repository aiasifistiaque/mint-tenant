import { ReactNode } from 'react';
import { Flex } from '@chakra-ui/react';

const FilterSectionContainer = ({ children }: { children: ReactNode }) => {
	return (
		<Flex
			pb={2}
			// The chips no longer set their own mr/mb, so this is the only thing
			// spacing them — and it spaces both axes equally, which the old
			// gap-plus-margin combination did not.
			gap={2}
			flexWrap='wrap'>
			{children}
		</Flex>
	);
};

export default FilterSectionContainer;
