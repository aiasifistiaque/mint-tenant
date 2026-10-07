//CSS Properties

import { CenterProps, FlexProps } from '@chakra-ui/react';
import { ReactNode } from 'react';
import { IconNameOptions } from '../../..';

export type NoDataContainerProps = {
	title: string;
	icon?: IconNameOptions;
	iconSize?: number;
	children: ReactNode;
};

export const mainProps: CenterProps = {
	px: { base: 2, md: 20 },
	textAlign: 'center',
	flexDir: 'column',
	h: '300px',
	gap: 2,
};

export const iconContainerProps: FlexProps = {
	mb: 2,
	p: 5,
	borderColor: 'container.borderLight',
	borderRadius: 'full',
	borderWidth: 1,
};
