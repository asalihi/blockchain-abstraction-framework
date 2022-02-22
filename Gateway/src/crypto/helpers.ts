import config from 'config';
import { JWK } from 'jose';
import { randomBytes as random, scryptSync as hash, createHash as create_hash } from 'crypto';

import { JWTHelper } from '@service/crypto/jwt';
import { JWSHelper } from '@service/crypto/jws';
import { LOCAL_KEY_STORE } from '@service/crypto/jwks';
import { GetCurrentDateInSeconds, GetNumberOfSeconds } from '@service/utils/helpers';
import { OutOfRangeError, HashingError, HTTPRequestSigningError, TokenSigningError } from '@service/utils/errors';
import { Hash, HashWithSalt, JWTRegisteredClaims, JWTPublicClaims, TokenPayload, TokenValue, TokenType, JWTCredentials } from '@service/utils/types';

export function GenerateUniqueIdentifier(size: number = Number(config.get('crypto.identifier.size'))): string {
	return random(size > 0 ? size : Number(config.get('crypto.identifier.size'))).toString('hex');
}

export function ComputeSHA256(input: string | Object): string {
	// TODO: Create a canonical representation of Object
	return create_hash('sha256').update(JSON.stringify(input)).digest('hex');
}

// TODO URGENT: Check with core and modify this function
export function HashInput(input: string, operations: number = 1): HashWithSalt {
	let salt: string = random(Number(config.get('crypto.salt.size'))).toString('hex');
	let value: string = HashInputUsingSalt(input, salt, operations);
	return { value: value, salt: salt };
}

// TODO URGENT: Check with core and modify this function
export function HashInputUsingSalt(input: string, salt: string, operations: number = 1): Hash {
	if((operations <= 0) || (operations > 8)) {
		throw new OutOfRangeError('operations', 1, 8, operations);
	}

	try {
		let value: string = input;
		for(let i=0; i < operations; i++) {
			value = hash(value, salt, Number(config.get('crypto.scrypt.key_size')), { N: Number(config.get('crypto.scrypt.cost')), r: Number(config.get('crypto.scrypt.block_size')), maxmem: Number(config.get('crypto.scrypt.cost')) * Number(config.get('crypto.scrypt.block_size'))*256 }).toString('hex');
		}
	    return value;
	} catch {
		throw new HashingError();
	}
}

export function GenerateRefreshToken(subject: string, session: string, parent: TokenValue, options: JWTRegisteredClaims = GenerateDefaultRegisteredClaims(TokenType.REFRESH)): JWTCredentials {
	let claims: JWTPublicClaims = { type: TokenType.REFRESH, session: session, parent: parent };
	return GenerateToken(subject, Object.assign(GenerateDefaultRegisteredClaims(TokenType.REFRESH), options), claims);
}

export function GenerateAccessToken(subject: string, options: JWTRegisteredClaims = GenerateDefaultRegisteredClaims(TokenType.ACCESS)): JWTCredentials {
	let claims: JWTPublicClaims = { type: TokenType.ACCESS };
	return GenerateToken(subject, Object.assign(GenerateDefaultRegisteredClaims(TokenType.ACCESS), options), claims);
}

export function SignHTTPRequest(request: Object): string {
	try {
		return JWSHelper.SignJSONObject(request, LOCAL_KEY_STORE.get(config.get('crypto.signing.keys.http')) as JWK.RSAKey);
	} catch {
		throw new HTTPRequestSigningError();
	}
}

function GenerateDefaultRegisteredClaims(token: TokenType): JWTRegisteredClaims {
	let now: number = GetCurrentDateInSeconds();
	let jti: string = GenerateUniqueIdentifier();
	let iss: string = config.get('module');
	let aud: string = config.get('module'); // TODO URGENT: Change
	let nbf: number = now;
	let iat: number = now;
	let exp: number = now + GetNumberOfSeconds((token === TokenType.REFRESH) ? config.get('crypto.jwt.refresh.expiration') : ((token === TokenType.ACCESS) ? config.get('crypto.jwt.access.expiration') : config.get('crypto.jwt.authentication.expiration')));
	return { jti: jti, iss: iss, aud: aud, nbf: nbf, iat: iat, exp: exp };
}

function GenerateToken(subject: string, options: JWTRegisteredClaims, claims: JWTPublicClaims): JWTCredentials {
	return Object.assign({ token: GenerateAndSignPayload(subject, options, claims) }, { 'expires_in': Number(options.exp!) - Number(options.iat!), 'type': claims.type });
}

function GenerateAndSignPayload(subject: string, options: JWTRegisteredClaims, claims: JWTPublicClaims): TokenValue {
	const payload: TokenPayload = Object.assign({ 'sub': subject }, options, claims);
	const key: JWK.RSAKey = LOCAL_KEY_STORE.get(config.get('crypto.signing.keys.jwt')) as JWK.RSAKey;
	try {
		return JWTHelper.Sign(payload, key);
	} catch(error) {
		throw new TokenSigningError(key.kid, payload);
	}
}