'use client';
import {
	VInput,
	VPassword,
	useCustomToast,
	useLgoinMutation,
	useAppDispatch,
	login,
	LoginContainer,
	TwoFactorChallenge,
} from '@/components/library';
import TwoFactorStep from './_components/TwoFactorStep';
import { Box, Link as ChakraLink } from '@chakra-ui/react';
import { SIGNED_OUT_KEY } from '@/components/provider/SessionGuard';
import NextLink from 'next/link';
import { IS_TENANT_PANEL } from '@/components/library/config/lib/constants/panel';

import React, { FC, ChangeEvent, useState, useEffect } from 'react';

type FormDataType = {
	email: string;
	password: string;
};

const LoginPage: FC<{}> = () => {
	const [formData, setFormData] = useState<FormDataType>({
		email: '',
		password: '',
	});

	const [trigger, result] = useLgoinMutation();
	const dispatch = useAppDispatch();

	const { isSuccess, isError, isLoading, error } = result;
	const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	const handleSubmit = (e: any) => {
		e.preventDefault();
		trigger(formData);
	};

	// Sent here because this session was signed out elsewhere (SessionGuard):
	// say so once, then forget it.
	const [signedOut, setSignedOut] = useState(false);
	useEffect(() => {
		try {
			if (sessionStorage.getItem(SIGNED_OUT_KEY)) {
				setSignedOut(true);
				sessionStorage.removeItem(SIGNED_OUT_KEY);
			}
		} catch {
			/* storage blocked */
		}
	}, []);

	// With two-factor on, the password earns a ticket instead of the token:
	// the second step (TwoFactorStep) trades it for the session.
	const [challenge, setChallenge] = useState<TwoFactorChallenge | null>(null);

	useEffect(() => {
		if (result.isSuccess) {
			const data: any = result.data;
			if (data?.twoFactor) setChallenge(data.twoFactor);
			else dispatch(login(data));
		}
	}, [isLoading]);

	useCustomToast({
		isError,
		isLoading: isLoading,
		error: error,
	});

	if (challenge)
		return (
			<TwoFactorStep
				challenge={challenge}
				onToken={token => dispatch(login({ token } as any))}
				onRestart={() => {
					setChallenge(null);
					setFormData(f => ({ ...f, password: '' }));
					result.reset();
				}}
			/>
		);

	return (
		<LoginContainer
			title='Welcome back'
			subtitle='Sign in to your MINT account.'
			submitLabel='Sign in'
			isLoading={isLoading}
			handleSubmit={handleSubmit}
			footer={
				IS_TENANT_PANEL ? (
					<>
						New here?{' '}
						<ChakraLink
							as={NextLink}
							href='/auth/register'
							color='fg'
							fontWeight='600'>
							Create an account
						</ChakraLink>
					</>
				) : (
					'New to the team? Ask an administrator to send you an invitation.'
				)
			}>
			{signedOut && (
				<Box
					role='status'
					px={3}
					py={2.5}
					borderRadius='lg'
					bg='orange.subtle'
					color='orange.fg'
					fontSize='13px'>
					You were signed out on this device — from another device, or by an administrator. Sign in again to continue.
				</Box>
			)}
			<VInput
				label='Email'
				isRequired
				size='md'
				type='email'
				autoComplete='email'
				autoFocus
				placeholder='you@company.com'
				value={formData.email}
				onChange={handleChange}
				name='email'
			/>
			<Box position='relative'>
				<VPassword
					label='Password'
					isRequired
					size='md'
					autoComplete='current-password'
					placeholder='Your password'
					value={formData.password}
					onChange={handleChange}
					name='password'
				/>
				{/* Sits on the label's row, across from it. */}
				<ChakraLink
					as={NextLink}
					href='/auth/forgot-password'
					position='absolute'
					top={0}
					right={0}
					fontSize='13px'
					lineHeight='1.3'
					color='fg.muted'
					_hover={{ color: 'fg' }}>
					Forgot password?
				</ChakraLink>
			</Box>
		</LoginContainer>
	);
};

export default LoginPage;
