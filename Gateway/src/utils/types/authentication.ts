export enum UserRole { USER = 'user', ADMIN = 'admin', SUPERUSER = 'superuser' };
export type UsernameWithRole = { username: string, role: UserRole };

export type JWTRegisteredClaims = {
	iss?: string,
	sub?: string,
	aud?: string | string[],
	exp?: Number,
	nbf?: Number,
	iat?: Number,
	jti?: string
};

export type JWTPublicClaims = { [claim: string]: any };

export type TokenPayload = JWTRegisteredClaims & JWTPublicClaims;

export type TokenValue = string;

export type Token = { encoded: TokenValue, payload: TokenPayload };

export type StoredToken = {
	jti: string,
	value: string,
	salt: string
};

export enum TokenType {
	REFRESH = 'refresh',
	ACCESS = 'access',
	AUTHENTIFICATION = 'authentication'
};

export type JWTCredentials = {
	token: TokenValue,
	expires_in: Number,
	type: TokenType
};

export type PairOfTokens = {
	refresh_token: JWTCredentials,
	access_token: JWTCredentials
};