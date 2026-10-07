import { FlexProps } from '@chakra-ui/react';
import React from 'react';

export type TemplateProps = {
	children?: React.ReactNode;
};

export type FlexPropsType = FlexProps & {
	children?: React.ReactNode;
};
