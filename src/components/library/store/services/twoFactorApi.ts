import mainApi from './mainApi';

/**
 * Two-factor sign-in (backend library/controllers/twoFactor).
 *
 * The login step's calls carry the `ticket` that `auth/login` returns instead
 * of a token when 2FA is on; they need no session. The settings calls act on
 * the signed-in admin's own account and refresh `self`.
 */

export type TwoFactorChallenge = {
	ticket: string;
	expiresIn: number;
	methods: { passkey: boolean; email: boolean; backup: boolean };
	/** The admin's email, masked (ab••••@example.com). */
	email: string;
};

export type TwoFactorPasskey = {
	_id: string;
	name: string;
	deviceType?: 'singleDevice' | 'multiDevice';
	backedUp?: boolean;
	transports: string[];
	createdAt: string;
	lastUsedAt: string | null;
};

/** A QR link for adding a passkey on another device, as the computer showing it polls it. */
export type PasskeyLink = {
	_id: string;
	status: 'waiting' | 'opened' | 'added' | 'expired';
	/** "Safari on iPhone", once the phone opened the link. */
	device: string | null;
	passkey: { _id: string; name: string } | null;
	expiresAt: string | null;
};

export type TwoFactorStatus = {
	enabled: boolean;
	email: { enabled: boolean; address: string };
	passkeys: TwoFactorPasskey[];
	backupCodes: { total: number; remaining: number };
	updatedAt: string | null;
};

export const twoFactorApi = mainApi.injectEndpoints({
	endpoints: builder => ({
		/* sign-in */
		sendTwoFactorCode: builder.mutation<{ sentTo: string; resendIn: number; expiresIn: number }, { ticket: string }>({
			query: body => ({ url: 'auth/2fa/login/email', method: 'POST', body }),
		}),
		verifyTwoFactorCode: builder.mutation<{ token: string }, { ticket: string; method: 'email' | 'backup'; code: string }>({
			query: body => ({ url: 'auth/2fa/login/verify', method: 'POST', body }),
		}),
		twoFactorPasskeyOptions: builder.mutation<any, { ticket: string }>({
			query: body => ({ url: 'auth/2fa/login/passkey/options', method: 'POST', body }),
		}),
		verifyTwoFactorPasskey: builder.mutation<{ token: string }, { ticket: string; response: any }>({
			query: body => ({ url: 'auth/2fa/login/passkey/verify', method: 'POST', body }),
		}),

		/* settings */
		getTwoFactor: builder.query<TwoFactorStatus, void>({
			query: () => 'auth/2fa',
			providesTags: ['self'],
		}),
		enableTwoFactor: builder.mutation<{ backupCodes: string[]; status: TwoFactorStatus }, { password: string }>({
			query: body => ({ url: 'auth/2fa/enable', method: 'POST', body }),
			invalidatesTags: ['self'],
		}),
		disableTwoFactor: builder.mutation<TwoFactorStatus, { password: string }>({
			query: body => ({ url: 'auth/2fa/disable', method: 'POST', body }),
			invalidatesTags: ['self'],
		}),
		setTwoFactorEmail: builder.mutation<TwoFactorStatus, { enabled: boolean }>({
			query: body => ({ url: 'auth/2fa/email', method: 'PUT', body }),
			invalidatesTags: ['self'],
		}),
		newBackupCodes: builder.mutation<{ backupCodes: string[]; status: TwoFactorStatus }, { password: string }>({
			query: body => ({ url: 'auth/2fa/backup-codes', method: 'POST', body }),
			invalidatesTags: ['self'],
		}),
		passkeyCreationOptions: builder.mutation<any, void>({
			query: () => ({ url: 'auth/2fa/passkeys/options', method: 'POST', body: {} }),
		}),
		addPasskey: builder.mutation<TwoFactorPasskey, { response: any; name: string }>({
			query: body => ({ url: 'auth/2fa/passkeys', method: 'POST', body }),
			invalidatesTags: ['self'],
		}),
		renamePasskey: builder.mutation<TwoFactorPasskey, { id: string; name: string }>({
			query: ({ id, name }) => ({ url: `auth/2fa/passkeys/${id}`, method: 'PATCH', body: { name } }),
			invalidatesTags: ['self'],
		}),
		removePasskey: builder.mutation<TwoFactorStatus, string>({
			query: id => ({ url: `auth/2fa/passkeys/${id}`, method: 'DELETE' }),
			invalidatesTags: ['self'],
		}),

		/* a passkey on another device, by QR code */
		createPasskeyLink: builder.mutation<PasskeyLink & { url: string }, { password: string }>({
			query: body => ({ url: 'auth/2fa/passkeys/link', method: 'POST', body }),
		}),
		getPasskeyLink: builder.query<PasskeyLink, string>({
			query: id => `auth/2fa/passkeys/link/${id}`,
			// Polled while the QR is showing; never served from cache.
			keepUnusedDataFor: 0,
		}),
		cancelPasskeyLink: builder.mutation<{ message: string }, string>({
			query: id => ({ url: `auth/2fa/passkeys/link/${id}`, method: 'DELETE' }),
		}),
		openPasskeyLink: builder.mutation<
			{ admin: { name?: string; email: string }; suggestedName: string; options: any; expiresAt: string },
			{ token: string }
		>({
			query: body => ({ url: 'auth/2fa/passkey-link/open', method: 'POST', body }),
		}),
		finishPasskeyLink: builder.mutation<{ passkey: TwoFactorPasskey }, { token: string; response: any; name: string }>({
			query: body => ({ url: 'auth/2fa/passkey-link/finish', method: 'POST', body }),
		}),
	}),
	overrideExisting: false,
});

export const {
	useSendTwoFactorCodeMutation,
	useVerifyTwoFactorCodeMutation,
	useTwoFactorPasskeyOptionsMutation,
	useVerifyTwoFactorPasskeyMutation,
	useGetTwoFactorQuery,
	useEnableTwoFactorMutation,
	useDisableTwoFactorMutation,
	useSetTwoFactorEmailMutation,
	useNewBackupCodesMutation,
	usePasskeyCreationOptionsMutation,
	useAddPasskeyMutation,
	useRenamePasskeyMutation,
	useRemovePasskeyMutation,
	useCreatePasskeyLinkMutation,
	useGetPasskeyLinkQuery,
	useCancelPasskeyLinkMutation,
	useOpenPasskeyLinkMutation,
	useFinishPasskeyLinkMutation,
} = twoFactorApi;
