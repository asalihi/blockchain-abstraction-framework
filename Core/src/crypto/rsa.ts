import config from 'config';
import { JWK } from 'jose';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

import { HOME_DIRECTORY, CRYPTO_MATERIALS_FOLDER } from '@core/constants/constants';
import { RSAKeyExportError, RSAKeyGenerationError, RSAKeyImportError } from '@core/errors/errors';
import { ReadFile, WriteFile } from '@core/helpers/helpers';
import {Folder } from '@core/types/types';

export function GenerateRSAKey(kid?: string, algorithm: string = 'RS256'): JWK.RSAKey {
	try {
		return JWK.generateSync('RSA', 2048, { alg: algorithm, kid: kid ?? uuidv4(), use: 'sig', key_ops: ['sign', 'verify'] });
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
	const file: string = location ?? path.join(HOME_DIRECTORY, `${ config.get('platform') }/keys/${kid}_PUB.pem`);
	return LoadRSAKey(file, kid);
}

export function LoadRSAPrivateKey(kid: string, location?: Folder): JWK.RSAKey {
	const file: string = location ?? path.join(HOME_DIRECTORY, `${CRYPTO_MATERIALS_FOLDER}/keys/${kid}_PRIV.pem`);
	return LoadRSAKey(file, kid);
}

function LoadRSAKey(file: string, kid: string): JWK.RSAKey {
	try {
		return JWK.asKey({ key: ReadFile(file), passphrase: config.get('crypto.jwk.secret') }, { kid: kid, use: 'sig' }) as JWK.RSAKey;
	} catch {
		throw new RSAKeyImportError(file, kid);
	}
}