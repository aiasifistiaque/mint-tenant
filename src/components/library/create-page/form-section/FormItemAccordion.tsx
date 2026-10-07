'use client';

import { FC, ReactNode } from 'react';
import { GridItem } from '@chakra-ui/react';

type FormItemProps = {
	item: {
		startOfSection?: boolean;
		sectionTitle?: string;
		span?: number;
		description?: string;
		type?: string;
		section?: { table?: boolean };
	};
	children: ReactNode;
	isHidden?: boolean;
	collapsible?: boolean;
};

const FormItemAccordion: FC<FormItemProps> = ({
	item: { startOfSection, sectionTitle, span, description, type, section },
	children,
	collapsible = false,
	isHidden = false,
}) => {
	// const clr = useColorModeValue('gray.200', 'gray.700');
	if (isHidden) return null;
	// A list shown as a table needs the whole width; beside another field it's cut off.
	const wide = type === 'section-data-array' && !!section?.table;
	return (
		<>
			{startOfSection && (
				<GridItem
					colSpan={{ base: 1, md: 2 }}
					borderTop='1px solid'
					borderColor='border.muted'
					my={1}
				/>
			)}
			{sectionTitle && (
				<>
					{!collapsible && (
						<GridItem
							colSpan={{ base: 1, md: 2 }}
							fontSize='14px'
							fontWeight='600'
							mb={description ? -4 : -2}>
							{sectionTitle}
						</GridItem>
					)}

					{/* Collapsible sections show it in their header. */}
					{description && !collapsible && (
						<GridItem
							colSpan={{ base: 1, md: 2 }}
							fontSize='13px'
							color='fg.muted'
							my={-2}>
							{description}
						</GridItem>
					)}
				</>
			)}

			<GridItem
				colSpan={{ base: 1, md: wide ? 2 : span || 2 }}
				minW={0}>
				{children}
			</GridItem>
		</>
	);
};

export default FormItemAccordion;
