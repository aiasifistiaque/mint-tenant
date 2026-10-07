'use client';
import { VInput, useCustomToast, useForgotPasswordMutation, LoginContainer } from '@/components/library';
import { Text, Link as ChakraLink } from '@chakra-ui/react';
import NextLink from 'next/link';

import React, { FC, ChangeEvent, useState } from 'react';

const ForgotPasswordPage: FC<{}> = () => {
	const [email, setEmail] = useState('');
	const [sent, setSent] = useState(false);

	const [trigger, result] = useForgotPasswordMutation();
	const { isSuccess, isError, isLoading, error } = result;

	const handleChange = (e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value);

	const handleSubmit = (e: any) => {
		e.preventDefault();
		trigger({ email }).then(() => setSent(true));
	};

	useCustomToast({
		isError,
		isLoading,
		error,
		isSuccess,
		successTitle: 'Check your email',
		successText: 'If that email is registered, a password reset link has been sent.',
	});

	return (
		<LoginContainer
			title='Reset your password'
			subtitle={sent && isSuccess ? undefined : 'Enter your email and we’ll send you a link to set a new one.'}
			submitLabel='Send reset link'
			hideSubmit={sent && isSuccess}
			isLoading={isLoading}
			handleSubmit={handleSubmit}
			footer={
				<ChakraLink
					as={NextLink}
					href='/auth/login'
					color='fg'
					fontWeight='600'>
					Back to sign in
				</ChakraLink>
			}>
			{sent && isSuccess ? (
				<Text
					fontSize='sm'
					color='fg.muted'
					textAlign='center'>
					If that email is registered, a password reset link has been sent. Please check your inbox.
				</Text>
			) : (
				<VInput
					label='Email'
					isRequired
					size='md'
					value={email}
					onChange={handleChange}
					name='email'
					type='email'
					autoComplete='email'
					autoFocus
					placeholder='you@company.com'
				/>
			)}
		</LoginContainer>
	);
};

export default ForgotPasswordPage;
