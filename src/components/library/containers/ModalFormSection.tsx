'use client';
import { ContainerProps, Heading } from '@chakra-ui/react';
import { FC, ReactNode } from 'react';

import { Column } from '..';

type FormContainerProps = any & {
	children: ReactNode;
	title?: string;
};

const W_BASE = '100%';
const W_MD = '100%';
const W_LG = '100%';

const PADDING = 4;

/**
 * A group of fields inside a drawer.
 *
 * Sections are separated by a hairline rule rather than boxed in their own
 * bordered cards: the drawer is already a container, and nesting panels inside
 * it puts three borders between the page and an input. `border.muted` is the
 * same rule the drawer's own header and footer use, so the divisions inside the
 * form read as part of the same surface instead of as separate widgets.
 */
const ModalFormSection: FC<FormContainerProps> = ({ title, children, ...props }) => {
	return (
		<Column
			_notLast={{
				borderBottomWidth: '1px',
				borderColor: 'border.muted',
			}}
			h='fit-content'
			mx='auto'
			py={PADDING}
			_first={{ pt: 0 }}
			_last={{ pb: 0 }}
			w={{ base: W_BASE, md: W_MD, lg: W_LG }}
			{...props}>
			{Boolean(title) && (
				// A quiet section label, not a page heading: `md` sat at the same
				// weight and size as the drawer's own title and competed with it.
				<Heading
					fontSize='13px'
					fontWeight='600'
					letterSpacing='-0.005em'
					color='fg'
					mb={3}>
					{title}
				</Heading>
			)}
			<Column
				w='full'
				gap={4}>
				{children}
			</Column>
		</Column>
	);
};

export default ModalFormSection;
