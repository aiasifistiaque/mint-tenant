import { Field, Stack, StackProps } from '@chakra-ui/react';
import { ReactNode, FC } from 'react';

type FormStackProps = StackProps & {
	children: ReactNode;
	label?: string;
	helper?: string;
	isRequired?: boolean;
};

const FormStack: FC<FormStackProps> = ({ children, label, isRequired, helper, ...props }) => {
	return (
		<Stack
			gap={4}
			{...props}>
			<Field.Root
				gap={1.5}
				w='full'
				required={isRequired}>
				{label && (
					<Field.Label
						color='text.formLabel.light'
						_dark={{ color: 'text.formLabel.dark' }}
						userSelect='none'
						m={0}
						fontSize='13px'
						lineHeight='1.3'
						letterSpacing='-0.005em'
						fontWeight='600'>
						{label}
						{isRequired && <Field.RequiredIndicator color='red.500' />}
					</Field.Label>
				)}
				{children}
				{helper && (
					<Field.HelperText
						color='fg.muted'
						m={0}
						fontSize='12px'
						lineHeight='1.45'>
						{helper}
					</Field.HelperText>
				)}
			</Field.Root>
		</Stack>
	);
};

export default FormStack;
