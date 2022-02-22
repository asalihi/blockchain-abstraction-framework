import config from 'config';
import { Request, Response, NextFunction } from 'express';
import { authenticate } from 'passport';

import { IAPISessionModel, GetAPISessionEntry, CreateAPISessionEntry, UpdateAPISessionEntry, IUserModel } from '@service/database/schemata';
import { HashInput } from '@service/crypto/helpers';
import { GenerateNewPairOfTokens, ExtractTokenFromHeader, VerifyTokenSignature, ValidateTypeOfToken, VerifySessionIntegrity } from '@service/server/helpers';
import { GetCurrentDateInSeconds, GetElapsedSecondsBetweenDates, GetNumberOfSeconds } from '@service/utils/helpers';
import { ExpiredSession, APISessionUpdateError, AuthenticationFailed } from '@service/utils/errors';
import { Token, TokenType, TokenValue, TokenPayload } from '@service/utils/types';

export function AuthenticateAPIUser(req: Request, res: Response, next: NextFunction): void {
	authenticate('http', { session: false }, (error: any, user: IUserModel) => {
		if (error) return next(new AuthenticationFailed());
		else {
			req.login(user, async (error: any): Promise<void> => {
				if (error) return next(new AuthenticationFailed());

				try {
					// TODO URGENT: Use a transaction so that if generation of pair of tokens fails, the API session is not persisted in database
					const session: IAPISessionModel = await CreateAPISessionEntry({ username: user.username });
					res.status(200).send(GenerateNewPairOfTokens(user.username, session.identifier, config.get('crypto.jwt.genesis'), session.last_used_token.salt!));
				} catch {
					return next(new AuthenticationFailed());
				}
			});
		}
	})(req, res, next);
}

export function ExtractUsernameFromTokenPayload(req: Request, res: Response, next: NextFunction): void {
	res.locals.username = res.locals.last_used_token.payload.sub;
	return next();
}

export async function VerifySessionExpiration(req: Request, res: Response, next: NextFunction): Promise<void> {
	const session: IAPISessionModel = await GetAPISessionEntry(res.locals.username);
	if (GetElapsedSecondsBetweenDates(GetCurrentDateInSeconds(), Number(session.login)) >= GetNumberOfSeconds(config.get('server.session'))) {
		return next(new ExpiredSession());
	}
	return next();
}

export async function UpdateAPISession(req: Request, res: Response, next: NextFunction): Promise<void> {
	const last_used_token: Token = res.locals.last_used_token;
	try {
		res.locals.session = await UpdateAPISessionEntry({ username: res.locals.username, data: { last_used_token: Object.assign({ jti: last_used_token.payload.jti }, HashInput(last_used_token.encoded, 2)) } }) as IAPISessionModel;
	} catch {
		return next(new APISessionUpdateError());
	}
	return next();
}

export async function ValidateRefreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
	try {
		const token: TokenValue = ExtractTokenFromHeader(req);
		const payload: TokenPayload = VerifyTokenSignature(token);

		ValidateTypeOfToken(payload.type, TokenType.REFRESH);
		await VerifySessionIntegrity(payload);

		res.locals.last_used_token = { encoded: token, payload: payload };
		return next();
	} catch (error) {
		return next(error);
	}
}

export function ValidateAccessToken(req: Request, res: Response, next: NextFunction): void {
	try {
		const token: TokenValue = ExtractTokenFromHeader(req);
		const payload: TokenPayload = VerifyTokenSignature(token);

		ValidateTypeOfToken(payload.type, TokenType.ACCESS);

		res.locals.username = payload.sub;
		return next();
	} catch (error) {
		return next(error);
	}
}