'use client';

import { REFRESH_TOKEN, TOKEN_NAME } from '../';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type AuthStateType = {
	token: string | null;
	loggedIn: boolean;
};

type LoginPayloadType = {
	token: string;
	refreshToken?: string;
};

// Define the initial state
const initialState: AuthStateType = {
	token:
		typeof window !== 'undefined' && localStorage.getItem(TOKEN_NAME) != null
			? localStorage.getItem(TOKEN_NAME)
			: null,
	loggedIn: typeof window !== 'undefined' && localStorage.getItem(TOKEN_NAME) !== null,
};
export const authSlice = createSlice({
	name: 'auth',
	initialState: initialState,
	reducers: {
		logout: (state): void => {
			localStorage.setItem(TOKEN_NAME, 'null');
			localStorage.setItem(REFRESH_TOKEN, 'null');
			state.token = null;
			state.loggedIn = false;
			void (document.location.href = '/auth/login');
		},
		login: (state, action: PayloadAction<LoginPayloadType>): void => {
			const { token, refreshToken }: LoginPayloadType = action.payload;
			state.token = token;
			state.loggedIn = true;
			localStorage.setItem(TOKEN_NAME, token);
			// localStorage.setItem(REFRESH_TOKEN, refreshToken);
			void (document.location.href = '/');
		},
		refresh: (state, action: PayloadAction<string>): void => {
			localStorage.setItem(TOKEN_NAME, action.payload);
			state.token = action.payload;
			state.loggedIn = true;
		},
	},
});

export const { login, logout, refresh: refreshAuth } = authSlice.actions;

export default authSlice.reducer;
