import { JWK, JWT } from 'jose';

import { DEFAULT_JWT_SIGN_OPTIONS, DEFAULT_JWT_VERIFY_OPTIONS } from '@service/utils/constants';
import { InvalidToken } from '@service/utils/errors';
import { TokenValue, TokenPayload } from '@service/utils/types';

export class JWTHelper {
	constructor() { }

	static Sign(payload: Object, key: JWK.RSAKey, options?: JWT.SignOptions): TokenValue {
		return JWT.sign(payload, key, Object.assign(DEFAULT_JWT_SIGN_OPTIONS, options));
	}

	static Verify(token: TokenValue, key: JWK.RSAKey, options?: JWT.VerifyOptions): TokenPayload {
		try {
			return JWT.verify(token, key, Object.assign(DEFAULT_JWT_VERIFY_OPTIONS, options));
		} catch(error) {
			throw new InvalidToken(key, token);
		}
	}

	static Decode(token: TokenValue): Object {
		return JWT.decode(token);
    }
}