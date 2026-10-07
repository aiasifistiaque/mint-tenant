'use client';
import { VPassword, useCustomToast, useResetPasswordMutation, LoginContainer } from '@/components/library';
import { useParams, useRouter } from 'next/navigation';

import React, { FC, ChangeEvent, useState, useEffect } from 'react';

type FormDataType = {
	password: string;
	confirmPassword: string;
};

const ResetPasswordPage: FC<{}> = () => {
	const params = useParams<{ token: string }>();
	const router = useRouter();

	const [formData, setFormData] = useState<FormDataType>({
		password: '',
		confirmPassword: '',
	});

	const [trigger, result] = useResetPasswordMutation();
	const { isSuccess, isError, isLoading, error } = result;

	const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	const handleSubmit = (e: any) => {
		e.preventDefault();
		if (formData.password !== formData.confirmPassword) return;
		trigger({ token: params.token, password: formData.password });
	};

	useCustomToast({
		isError,
		isLoading,
		error,
		isSuccess,
		successTitle: 'Password reset',
		successText: 'Your password has been reset. Please log in.',
	});

	useEffect(() => {
		if (isSuccess) router.replace('/auth/login');
	}, [isSuccess]);

	const passwordsMismatch =
		formData.confirmPassword.length > 0 && formData.password !== formData.confirmPassword;

	return (
		<LoginContainer
			title='Set a new password'
			subtitle='Choose a password you don’t use anywhere else.'
			submitLabel='Save password'
			isLoading={isLoading}
			handleSubmit={handleSubmit}>
			<VPassword
				label='New password'
				autoFocus
				isRequired
				size='md'
				value={formData.password}
				onChange={handleChange}
				name='password'
			/>
			<VPassword
				label='Confirm new password'
				isRequired
				size='md'
				value={formData.confirmPassword}
				onChange={handleChange}
				name='confirmPassword'
				helper={passwordsMismatch ? "Passwords don't match" : undefined}
			/>
		</LoginContainer>
	);
};

export default ResetPasswordPage;
