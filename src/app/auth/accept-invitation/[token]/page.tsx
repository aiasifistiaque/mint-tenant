'use client';
import {
	VInput,
	VPassword,
	useCustomToast,
	useGetInvitationInfoQuery,
	useAcceptInvitationMutation,
	useAppDispatch,
	login,
	LoginContainer,
} from '@/components/library';
import { Text } from '@chakra-ui/react';
import { useParams } from 'next/navigation';

import React, { FC, ChangeEvent, useState, useEffect } from 'react';
import { IS_TENANT_PANEL } from '@/components/library/config/lib/constants/panel';
import TenantAcceptInvitation from './_components/TenantAcceptInvitation';

type FormDataType = {
	name: string;
	phone: string;
	password: string;
	confirmPassword: string;
};

const AdminAcceptInvitationPage: FC<{}> = () => {
	const params = useParams<{ token: string }>();
	const dispatch = useAppDispatch();

	const {
		data: invitation,
		isLoading: isLoadingInvitation,
		isError: isInvalidInvitation,
	} = useGetInvitationInfoQuery(params.token);

	const [formData, setFormData] = useState<FormDataType>({
		name: '',
		phone: '',
		password: '',
		confirmPassword: '',
	});

	const [trigger, result] = useAcceptInvitationMutation();
	const { isSuccess, isError, isLoading, error } = result;

	const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	const handleSubmit = (e: any) => {
		e.preventDefault();
		if (formData.password !== formData.confirmPassword) return;
		trigger({
			token: params.token,
			name: formData.name,
			phone: formData.phone,
			password: formData.password,
		});
	};

	useCustomToast({
		isError,
		isLoading,
		error,
		isSuccess,
		successTitle: 'Welcome aboard',
		successText: 'Your account is ready.',
	});

	useEffect(() => {
		if (isSuccess && result.data) dispatch(login(result.data));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isSuccess]);

	const passwordsMismatch =
		formData.confirmPassword.length > 0 && formData.password !== formData.confirmPassword;

	if (!isLoadingInvitation && isInvalidInvitation) {
		return (
			<LoginContainer
				title='This invitation has expired'
				hideSubmit
				isLoading={false}
				handleSubmit={(e: any) => e.preventDefault()}>
				<Text
					fontSize='sm'
					color='fg.muted'
					textAlign='center'>
					This invitation link is invalid or has expired. Ask an admin to send you a new one.
				</Text>
			</LoginContainer>
		);
	}

	return (
		<LoginContainer
			title='Join MINT'
			subtitle='Finish setting up your account.'
			submitLabel='Create account'
			isLoading={isLoading || isLoadingInvitation}
			handleSubmit={handleSubmit}>
			<VInput
				label='Email'
				size='md'
				value={invitation?.email || ''}
				disabled
				readOnly
				name='email'
			/>
			<VInput
				label='Name'
				isRequired
				size='md'
				value={formData.name}
				onChange={handleChange}
				name='name'
			/>
			<VInput
				label='Phone'
				size='md'
				value={formData.phone}
				onChange={handleChange}
				name='phone'
			/>
			<VPassword
				label='Password'
				isRequired
				size='md'
				value={formData.password}
				onChange={handleChange}
				name='password'
			/>
			<VPassword
				label='Confirm password'
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

/** The tenant panel's invitations are into an organization (TenantAcceptInvitation). */
const AcceptInvitationPage: FC<{}> = () => (IS_TENANT_PANEL ? <TenantAcceptInvitation /> : <AdminAcceptInvitationPage />);

export default AcceptInvitationPage;
