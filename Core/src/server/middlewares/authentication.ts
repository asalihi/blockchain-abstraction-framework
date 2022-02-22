import config from 'config';
import { NextFunction, Request, Response } from 'express';
import { JWK } from 'jose';

import { HTTP_SIGNATURE_REGEX, GATEWAY_FULL_JWKS_ENDPOINT, SERVER_ENDPOINT } from '@core/constants/constants';
import { JWSHelper, HashInputUsingSalt, GATEWAY_KEY_STORE } from '@core/crypto/crypto';
import { AuthorizationHeaderMissing, HTTPSignatureExpired, InvalidData, InvalidEndpoint, InvalidHTTPSignature, InvalidIssuer, InvalidJWKS, InvalidMethod, MissingHTTPSignature, SigningKeyNotFoundInJWKS } from '@core/errors/errors';
import { CompareDates, ConvertDate, GetCurrentDateInSeconds, Sort } from '@core/helpers/helpers';
import { Maybe, Nullable } from '@core/types/types';

export function ExtractHTTPRequestSignature(req: Request, res: Response, next: NextFunction): void {
	const authorization: Maybe<string> = req.get('Authorization');

	if (authorization) {
		const result: Nullable<RegExpExecArray> = HTTP_SIGNATURE_REGEX.exec(authorization);
		if (result) {
			res.locals.jwks = Buffer.from(result.groups!.jwks, 'base64').toString();
			res.locals.kid = Buffer.from(result.groups!.kid, 'base64').toString();
			res.locals.signature = Buffer.from(result.groups!.signature, 'base64').toString();

			return next();
		}
		else return next(new MissingHTTPSignature());
	} else {
		return next(new AuthorizationHeaderMissing());
	}
}

export function ValidateJWKSEndpoint(req: Request, res: Response, next: NextFunction): void {
	if (res.locals.jwks === GATEWAY_FULL_JWKS_ENDPOINT) return next();
	else return next(new InvalidJWKS());
}

export async function ValidateHTTPRequestSignature(req: Request, res: Response, next: NextFunction): Promise<void> {
	const key = GATEWAY_KEY_STORE.get(res.locals.kid) as JWK.RSAKey;
	if (!key) return next(new SigningKeyNotFoundInJWKS(res.locals.kid));

	try {
		const payload: string | Object = JWSHelper.Verify(res.locals.signature, key);
		res.locals.payload = JSON.parse(Buffer.from(payload as string, 'base64').toString());

		return next();
	} catch {
		return next(new InvalidHTTPSignature(res.locals.signature));
	}
}

export function VerifyExpiry(req: Request, res: Response, next: NextFunction): void {
	const expires: number = res.locals.payload.expires;
	if (CompareDates(expires, GetCurrentDateInSeconds()) > 0) return next();
	else return next(new HTTPSignatureExpired(ConvertDate(expires)));
}

export function VerifyIssuer(req: Request, res: Response, next: NextFunction): void {
	const issuer: string = res.locals.payload.issuer;
	if (issuer === config.get('gateway.identifier')) return next();
	else return next(new InvalidIssuer(issuer, config.get('gateway.identifier')));
}

export function VerifyMethod(req: Request, res: Response, next: NextFunction): void {
	const method: string = res.locals.payload.method;
	if (method === req.method.toLowerCase()) return next();
	else return next(new InvalidMethod(method, req.method));
}

export function VerifyEndpoint(req: Request, res: Response, next: NextFunction): void {
	const endpoint: string = res.locals.payload.endpoint;
	if (endpoint === (SERVER_ENDPOINT + req.originalUrl)) return next();
	else return next(new InvalidEndpoint(endpoint, req.originalUrl));
}

export function VerifyData(req: Request, res: Response, next: NextFunction): void {
	const nonce: string = res.locals.payload.nonce;
	const data: string = res.locals.payload.data;
	if (!data) return next();
	else if (data === HashInputUsingSalt(JSON.stringify(Sort(req.body)), nonce)) return next();
	else return next(new InvalidData());
}