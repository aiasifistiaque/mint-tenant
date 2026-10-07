'use client';
import { ContainerProps, Heading } from '@chakra-ui/react';
import { FC, ReactNode } from 'react';
import { Column } from '..';

type FormContainerProps = any & {
	children: ReactNode;
	title?: string;
};

const W_BASE = '100%';
const W_MD = '80%';
const W_LG = '50%';

const PADDING = 12;

const FormSection: FC<FormContainerProps> = ({ title, children, ...props }) => {
	return (
		<Column
			_notLast={{
				borderBottom: '1px solid',
				borderColor: 'border',
			}}
			_last={{
				pb: 32,
			}}
			h='fit-content'
			mx='auto'
			py={PADDING}
			w={{ base: W_BASE, md: W_MD, lg: W_LG }}
			{...props}>
			{Boolean(title) && (
				<Heading
					size='md'
					mb={4}>
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

export default FormSection;
