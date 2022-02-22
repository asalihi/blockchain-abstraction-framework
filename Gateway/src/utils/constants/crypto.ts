import config from 'config';
import { JWT } from 'jose';
import { homedir } from 'os';

import { Folder, ListOfRSAKeyParameters } from '@service/utils/types';

export const LOCAL_RSA_KEYS: ListOfRSAKeyParameters = [
	{ 'kid': config.get('crypto.signing.keys.jwt'), 'type': 'RS256' },
	{ 'kid': config.get('crypto.signing.keys.http'), 'type': 'PS256' }
];

export const CRYPTO_MATERIALS_FOLDER: Folder = `${homedir()}/${config.get('crypto.materials.folder') ?? (config.get('platform') + '/' + config.get('module') + '/crypto-materials')}`;

export const DEFAULT_JWT_SIGN_OPTIONS: JWT.SignOptions = { iat: true, kid: true };
export const DEFAULT_JWT_VERIFY_OPTIONS: JWT.VerifyOptions = { issuer: config.get('module'), audience: config.get('module') }; // TODO URGENT: Change
