import config from 'config';
import { homedir } from 'os';
import path from 'path';
import { JWK } from 'jose';

import { CRYPTO_MATERIALS_FOLDER } from '@service/utils/constants';
import { ReadFile, WriteFile } from '@service/utils/helpers';
import { Folder } from '@service/utils/types';
import { RSAKeyGenerationError, RSAKeyExportError, RSAKeyImportError } from '@service/utils/errors';

export function GenerateRSAKey(kid?: string, algorithm: string = 'RS256'): JWK.RSAKey {
	try {
		return JWK.generateSync('RSA', 2048, { alg: algorithm, kid: kid, use: 'sig', key_ops: ['sign', 'verify'] });
	} catch {
		throw new RSAKeyGenerationError(kid);
	}
}

export function ExportRSAKey(key: JWK.RSAKey, location: Folder = `${CRYPTO_MATERIALS_FOLDER}/keys`): void {
	const public_key: string = key.toPEM();
	const private_key: string = key.toPEM(true, { passphrase: config.get('crypto.jwk.secret'), cipher: 'aes-256-cbc' });
	try {
		WriteFile({ 'location': location, 'name': `${key.kid}_PUB.pem` }, public_key);
		WriteFile({ 'location': location, 'name': `${key.kid}_PRIV.pem` }, private_key);
	} catch {
		throw new RSAKeyExportError(location);
	}
}

export function LoadRSAPublicKey(kid: string, location?: Folder): JWK.RSAKey {
	const file: string = location ?? path.join(homedir(), `${CRYPTO_MATERIALS_FOLDER}/keys/${kid}_PUB.pem`);
	return LoadRSAKey(file, kid);
}

export function LoadRSAPrivateKey(kid: string, location?: Folder): JWK.RSAKey {
	const file: string = location ?? path.join(homedir(), `${CRYPTO_MATERIALS_FOLDER}/keys/${kid}_PRIV.pem`);
	return LoadRSAKey(file, kid);
}

function LoadRSAKey(file: string, kid: string): JWK.RSAKey {
	try {
		return JWK.asKey({ key: ReadFile(file), passphrase: config.get('crypto.jwk.secret') }, { kid: kid, use: 'sig' }) as JWK.RSAKey;
	} catch {
		throw new RSAKeyImportError(file, kid);
	}
}