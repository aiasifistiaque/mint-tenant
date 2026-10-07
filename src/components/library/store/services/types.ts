export type LoginPayloadType = {
	token: string;
	refreshToken?: string;
};

export type LoginBodyType = {
	email: string;
	password: string;
};
