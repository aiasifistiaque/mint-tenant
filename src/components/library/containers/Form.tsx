'use client';
import { Box, Button, Flex, FlexProps, ButtonProps } from '@chakra-ui/react';
import { FC, useEffect, ReactNode, FormEvent } from 'react';
import { toaster } from '@/components/ui/toaster';

type FormProps = ButtonProps &
	FlexProps & {
		children: ReactNode;
		onSubmit: (e: FormEvent<HTMLFormElement>) => void;
		buttonText?: string;
		isError?: boolean;
		error?: any;
		isSuccess?: boolean;
		success?: string;
		isLoading?: boolean;
		button?: ReactNode;
	};

const Form: FC<FormProps> = ({
	children,
	isLoading,
	isError,
	error,
	buttonText = 'Submit',
	onSubmit,
	success,
	isSuccess,
	button,
	...props
}) => {
	useEffect(() => {
		if (isLoading) return;

		if (isError) {
			toaster.create({
				title: 'An error occurred',
				description: error?.data?.message || 'Something went wrong.',
				type: 'error',
				duration: 5000,
			});
		}

		if (isSuccess) {
			toaster.create({
				title: 'Success',
				description: success || 'Operation completed successfully',
				type: 'success',
				duration: 5000,
			});
		}
	}, [isLoading, isError, isSuccess, error, success]);

	return (
		<Flex
			flexDir='column'
			w='full'
			as='form'
			onSubmit={onSubmit}>
			{children}

			<Box pt={4}>
				{button ? (
					button
				) : (
					<Button
						type='submit'
						loading={isLoading}
						{...props}>
						{buttonText}
					</Button>
				)}
			</Box>
		</Flex>
	);
};

export default Form;
