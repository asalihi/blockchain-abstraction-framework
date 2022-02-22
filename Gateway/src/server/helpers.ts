import config from 'config';
import { JWK } from 'jose';
import { Request } from 'express';

import { LOCAL_KEY_STORE } from '@service/crypto/jwks';
import { JWTHelper } from '@service/crypto/jwt';
import { HashInputUsingSalt, GenerateRefreshToken, GenerateAccessToken } from '@service/crypto/helpers';
import { IAPISessionModel, GetAPISessionEntry, RemoveAPISessionEntry, IUserSchema, IUserModel, GetUserEntry } from '@service/database/schemata';
import { UsernameWithRole, UserRole, StaticServerErrorObject, Nullable, Maybe, Endpoint, JWTCredentials, PairOfTokens, StoredToken, TokenValue, TokenPayload, TokenType, Token } from '@service/utils/types';
import { AUTHORIZED_ENDPOINTS, BEARER_JWT_SIGNED_TOKEN } from '@service/utils/constants';
import { APIError, InternalServerError, ElementNotFoundInCollection, UnsupportedEndpoint, AuthorizationHeaderMissing, MissingBearerToken, TokenVerificationError, InvalidTokenType, TokenReuseError, InvalidSession, SimultaneousTokenRenew, GenerationOfPairOfTokensError } from '@service/utils/errors';

export function VerifyCORS(origin: string, callback: (error: any, success: boolean) => void): void {
	if ((AUTHORIZED_ENDPOINTS === '*') || AUTHORIZED_ENDPOINTS.includes(origin)) {
        callback(null, true);
    } else {
        callback(null, false);
    };
}

export function CreateAPIError(status: number, error: StaticServerErrorObject): APIError {
	return new APIError(error.code, status, error.message, error.description, error.resolution);
}

export function GetEndpoint(endpoint: string): Endpoint {
	switch (endpoint) {
		case config.get('server.endpoints.web'):
			return Endpoint.WEB;
		case config.get('server.endpoints.api'):
			return Endpoint.API;
		default:
			throw new UnsupportedEndpoint(endpoint);
	}
}

export async function RetrieveCaller(req: Request, endpoint: Endpoint): Promise<IUserModel> {
	let caller: Nullable<IUserModel>;
	switch (endpoint) {
		case Endpoint.WEB: {
			caller = req.user as IUserModel;
			break;
		}
		case Endpoint.API: {
			let token: TokenPayload = JWTHelper.Decode(ExtractTokenFromHeader(req));
			caller = await GetUserEntry(token.sub!);
			break;
		}
		default: throw new UnsupportedEndpoint(endpoint);
	}

	if (caller) return caller;
	else throw new ElementNotFoundInCollection('user', 'unknown');
}

export function RemoveConfidentialProperties(user: IUserSchema): { username: string, role: UserRole } {
	const { username, role }: UsernameWithRole = user;
	return { username, role };
}

export async function ClearAPISession(username: string): Promise<IAPISessionModel> {
	try {
		return await RemoveAPISessionEntry(username);
	} catch {
		throw new InternalServerError();
	}
}

export function GenerateNewPairOfTokens(username: string, session: string, parent: TokenValue, salt: string): PairOfTokens {
	try {
		const refresh: JWTCredentials = GenerateRefreshToken(username, session, HashInputUsingSalt(parent, salt));
		let access: JWTCredentials = GenerateAccessToken(username);
		return { 'refresh_token': refresh, 'access_token': access };
	} catch {
		throw new GenerationOfPairOfTokensError();
	}
}

export function ExtractTokenFromHeader(req: Request): TokenValue {
	const authorization: Maybe<string> = req.get('Authorization');
	if (authorization) {
		const result: Nullable<RegExpExecArray> = BEARER_JWT_SIGNED_TOKEN.exec(authorization);
		if (result) return result.groups!.token as TokenValue;
		else throw new MissingBearerToken();
	} else {
		throw new AuthorizationHeaderMissing();
	}
}

export function VerifyTokenSignature(token: TokenValue): TokenPayload {
	try {
		return JWTHelper.Verify(token, LOCAL_KEY_STORE.get(config.get('crypto.signing.keys.jwt')) as JWK.RSAKey);
	} catch {
		// TODO: Specify why verification has failed (e.g. exp validation has failed (check jose documentation)) by using stored data in thrown error
		throw new TokenVerificationError(token);
	}
}

export async function VerifySessionIntegrity(payload: TokenPayload): Promise<void> {
	let session: IAPISessionModel;
	try {
		session = await GetAPISessionEntry(payload.sub!);
	} catch {
		throw new InvalidSession();
	}

	const parent: StoredToken = session.last_used_token as StoredToken;
	await VerifyHierarchyOfRefreshToken(payload, parent, session.identifier);
}

export function ValidateTypeOfToken(provided: TokenType, expected: TokenType): void {
	if (provided !== expected) throw new InvalidTokenType(provided, expected);
}

async function VerifyHierarchyOfRefreshToken(payload: TokenPayload, parent: StoredToken, session: string): Promise<void> {
	const user: string = payload.sub!;
	if (payload.jti === parent.jti) {
		await ClearAPISession(user);
		throw new TokenReuseError();
	}

	if (HashInputUsingSalt(payload.parent, parent.salt) !== parent.value) {
		if (payload.session !== session) throw new InvalidSession();
		else {
			await ClearAPISession(user);
			throw new SimultaneousTokenRenew();
		}
	}
}