'use client';
import {
	VInput,
	VPassword,
	useCustomToast,
	useAppDispatch,
	useRegisterMutation,
	login,
	LoginContainer,
} from '@/components/library';
import { Link as ChakraLink } from '@chakra-ui/react';
import NextLink from 'next/link';
import React, { FC, ChangeEvent, FormEvent, useState, useEffect } from 'react';
import { IS_TENANT_PANEL } from '@/components/library/config/lib/constants/panel';
import TenantRegister from './_components/TenantRegister';

type FormDataType = {
	name: string;
	email: string;
	restaurant: string;
	password: string;
	confirm: string;
};

const AdminRegisterPage: FC<{}> = () => {
	const [formData, setFormData] = useState<FormDataType>({
		name: '',
		email: '',
		restaurant: '',
		password: '',
		confirm: '',
	});

	const [trigger, result] = useRegisterMutation();
	const dispatch = useAppDispatch();

	const { isError, isLoading, error } = result;
	const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	const mismatch = formData.confirm.length > 0 && formData.password !== formData.confirm;

	const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (formData.password !== formData.confirm) return;
		trigger(formData);
	};

	useEffect(() => {
		if (result.isSuccess) {
			dispatch(login(result.data));
		}
	}, [isLoading]);

	useCustomToast({
		isError,
		isLoading: isLoading,
		error: error,
	});

	return (
		<LoginContainer
			title='Create your account'
			subtitle='Set up your restaurant in a minute.'
			submitLabel='Create account'
			isLoading={isLoading}
			handleSubmit={handleSubmit}
			footer={
				<>
					Already have an account?{' '}
					<ChakraLink
						as={NextLink}
						href='/auth/login'
						color='fg'
						fontWeight='600'>
						Sign in
					</ChakraLink>
				</>
			}>
			<VInput
				label='Name'
				isRequired
				size='md'
				autoComplete='name'
				autoFocus
				placeholder='Your full name'
				value={formData.name}
				onChange={handleChange}
				name='name'
			/>
			<VInput
				label='Email'
				isRequired
				size='md'
				type='email'
				autoComplete='email'
				placeholder='you@company.com'
				value={formData.email}
				onChange={handleChange}
				name='email'
			/>
			<VInput
				label='Restaurant name'
				isRequired
				size='md'
				autoComplete='organization'
				placeholder='The name guests know you by'
				value={formData.restaurant}
				onChange={handleChange}
				name='restaurant'
			/>
			<VPassword
				label='Password'
				isRequired
				size='md'
				placeholder='Choose a password'
				value={formData.password}
				onChange={handleChange}
				name='password'
			/>
			<VPassword
				label='Confirm password'
				isRequired
				size='md'
				placeholder='Type it again'
				value={formData.confirm}
				onChange={handleChange}
				name='confirm'
				aria-invalid={mismatch || undefined}
				helper={mismatch ? 'Passwords don’t match.' : undefined}
			/>
		</LoginContainer>
	);
};

/** The tenant panel signs up a new account and organization; the old form stays for the admin build. */
const RegisterPage: FC<{}> = () => (IS_TENANT_PANEL ? <TenantRegister /> : <AdminRegisterPage />);

export default RegisterPage;
