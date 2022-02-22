import config from 'config';
import { createHash as create_hash, randomBytes as random, scryptSync as hash, Hash } from 'crypto';
import { JWK } from 'jose';

import { LOCAL_KEY_STORE, GATEWAY_KEY_STORE } from '@core/crypto/jwks';
import { JWSHelper } from '@core/crypto/jws';
import { HashingError, OutOfRangeError, HTTPRequestSigningError } from '@core/errors/errors';
import { KeyStoreType, Fingerprint, Signature } from '@core/types/types';

export function GenerateUniqueIdentifier(size?: number): string {
	const default_size: number = Number(config.get('crypto.identifier.size'));
	return random(size ?? (Number.isNaN(default_size) ? 16 : default_size)).toString('hex');
}

// TODO URGENT: Modify (salt should be always used, returned value should be hash + salt); probably create a distinct function here
export function ComputeSHA256(input: string | Object, salt?: string): Fingerprint {
	// TODO: Create a canonical representation of Object
	const hash: Hash = create_hash('sha256').update((input instanceof Object) ? JSON.stringify(input) : input);
	if (salt) hash.update(ComputeSHA256(salt));
	return hash.digest('hex');
}

// TODO URGENT: Modify (salt should be optional, returned value should be hash + salt, name of function should be changed)
export function HashInputUsingSalt(input: string, salt: string, operations: number = 1): Fingerprint {
	if((operations <= 0) || (operations > 8)) {
		throw new OutOfRangeError('operations', 1, 8, operations);
	}

	try {
		let value: string = input;
		const scrypt_key_size: number = Number(config.get('crypto.scrypt.key_size'));
		const scrypt_cost: number = Number(config.get('crypto.scrypt.cost'));
		const scrypt_block_size: number = Number(config.get('crypto.scrypt.block_size'));
		for (let i = 0; i < operations; i++) {
			value = hash(value, salt, Number.isNaN(scrypt_key_size) ? 256 : scrypt_key_size, { N: Number.isNaN(scrypt_cost) ? 65536 : scrypt_cost, r: Number.isNaN(scrypt_block_size) ? 8 : scrypt_block_size, maxmem: (Number.isNaN(scrypt_cost) ? 65536 : scrypt_cost) * (Number.isNaN(scrypt_block_size) ? 8 : scrypt_block_size) * 256 }).toString('hex');
		}
	    return value;
	} catch {
		throw new HashingError();
	}
}

export function SignContent(content: string, kid: string): Signature {
	if (LOCAL_KEY_STORE.get(kid)) return JWSHelper.Sign(content, LOCAL_KEY_STORE.get(kid) as JWK.RSAKey);
	else throw new Error('Signing key does not exist'); // TODO: Handle error
}

export function VerifySignature(signature: string, kid: string, store: KeyStoreType = 'local'): string {
	const key: JWK.RSAKey = ((store === 'local') ? LOCAL_KEY_STORE.get(kid) : GATEWAY_KEY_STORE.get(kid)) as JWK.RSAKey;
	if (key) return JWSHelper.Verify(signature, key).toString();
	else throw new Error('Signing key does not exist'); // TODO: Handle error
}

export function SignHTTPRequest(request: Object): string {
	try {
		return JWSHelper.SignJSONObject(request, LOCAL_KEY_STORE.get(config.get('crypto.signing.keys.http')) as JWK.RSAKey);
	} catch {
		throw new HTTPRequestSigningError();
	}
}