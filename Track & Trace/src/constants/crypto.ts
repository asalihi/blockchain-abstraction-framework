import config from 'config';

import { ListOfRSAKeyParameters } from 'core';

export const LOCAL_RSA_KEYS: ListOfRSAKeyParameters = [
	{ 'kid': config.get('crypto.signing.keys.http'), 'type': 'RS256' },
	{ 'kid': config.get('crypto.signing.keys.track_and_trace'), 'type': 'RS256' },
];