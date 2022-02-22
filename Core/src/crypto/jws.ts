import { JWS, JWK } from 'jose';

import { InvalidJSONWebSignature } from '@core/errors/errors';

export class JWSHelper {
	constructor() { }

	static SignJSONObject(payload: Object, key: JWK.RSAKey): string {
		return JWS.sign(payload, key);
	}

	static Sign(payload: string, key: JWK.RSAKey): string {
		return JWS.sign(payload, key);
	}

	static Verify(signature: string, key: JWK.RSAKey): Buffer {
		try {
			return JWS.verify(signature, key);
		} catch {
			throw new InvalidJSONWebSignature(key, signature);
		}
	}
}