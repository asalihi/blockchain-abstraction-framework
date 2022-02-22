import config from 'config';

import { ListOfRSAKeyParameters } from 'core';

export const LOCAL_RSA_KEYS: ListOfRSAKeyParameters = [
	{ 'kid': config.get('crypto.signing.keys.http'), 'type': 'RS256' }
];