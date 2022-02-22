import { NextFunction, Request, Response } from 'express';
import { JWK } from 'jose';

import { KeyStore, EXTERNAL_KEY_STORES, RetrieveJWKSOfModule } from '@service/crypto/jwks';
import { HashInputUsingSalt } from '@service/crypto/helpers';
import { FetchModules } from '@service/controller/modules';
import { IModuleSchema } from '@service/database/schemata';
import { JWSHelper } from '@service/crypto/jws';
import { AuthorizationHeaderMissing, HTTPSignatureExpired, InvalidData, InvalidEndpoint, InvalidHTTPSignature, InvalidIssuer, InvalidJWKS, InvalidMethod, MissingHTTPSignature, SigningKeyNotFoundInJWKS } from '@service/utils/errors';
import { HTTP_SIGNATURE_REGEX } from '@service/utils/constants';
import { CompareDates, ConvertDate, GetCurrentDateInSeconds, Sort } from '@service/utils/helpers';
import { Maybe, Nullable } from '@service/utils/types';
import { SERVER_ENDPOINT } from '@service/server/server';

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

export async function ValidateJWKSEndpoint(req: Request, res: Response, next: NextFunction): Promise<void> {
	// TODO: Use specific type
	const modules: (IModuleSchema & { '_id'?: string })[] = await FetchModules();
	const module: Maybe<(IModuleSchema & { '_id'?: string })> = modules.find((module: (IModuleSchema & { '_id'?: string })) => res.locals.jwks.includes(module['server']));
	if (module) {
		res.locals.module = module['identifier'];
		return next();
	}
	else return next(new InvalidJWKS());
}

export async function ValidateHTTPRequestSignature(req: Request, res: Response, next: NextFunction): Promise<void> {
	// TODO URGENT: Consider explicit 'activation' of a module when starting it again, forcing gateway to retrieve JWKS (and do other operations if needed, like sending an API key)
	const keystore: KeyStore = EXTERNAL_KEY_STORES[res.locals.module];

	if (keystore.date() === 'N/A') {
		await RetrieveJWKSOfModule(res.locals.module);
    }

	const key = EXTERNAL_KEY_STORES[res.locals.module].get(res.locals.kid) as JWK.RSAKey;
	if (!key) return next(new SigningKeyNotFoundInJWKS(res.locals.kid));

	try {
		const payload: string | Object = JWSHelper.Verify(res.locals.signature, key);
		res.locals.payload = JSON.parse(Buffer.from(payload as string, 'base64').toString());
		return next();
	} catch (error) {
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
	if (issuer === res.locals.module) return next();
	else return next(new InvalidIssuer(issuer, res.locals.module));
}

export function VerifyMethod(req: Request, res: Response, next: NextFunction): void {
	const method: string = res.locals.payload.method;
	if (method === req.method.toLowerCase()) return next();
	else return next(new InvalidMethod(method, req.method));
}

export function VerifyEndpoint(req: Request, res: Response, next: NextFunction): void {
	const endpoint: string = res.locals.payload.endpoint;

	if (endpoint === req.originalUrl) {
		return next();
	}
	else return next(new InvalidEndpoint(endpoint, req.originalUrl));
}

export function VerifyData(req: Request, res: Response, next: NextFunction): void {
	const nonce: string = res.locals.payload.nonce;
	const data: string = res.locals.payload.data;

	if (!data) return next();
	else if (data === HashInputUsingSalt(JSON.stringify(Sort(req.body)), nonce)) return next();
	else return next(new InvalidData());
}