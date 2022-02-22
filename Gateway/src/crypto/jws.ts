import { JWS, JWK } from 'jose';

import { InvalidJSONWebSignature } from '@service/utils/errors';

export class JWSHelper {
	constructor() { }

	static SignJSONObject(payload: Object, key: JWK.RSAKey): string {
		return JWS.sign(payload, key);
	}
	
	static Sign(payload: string, key: JWK.RSAKey): string {
		return JWS.sign(payload, key);
	}

	static Verify(signature: string, key: JWK.RSAKey): string | Object {
		try {
			return JWS.verify(signature, key);
		} catch (error) {
			throw new InvalidJSONWebSignature(key, signature);
		}
	}
}