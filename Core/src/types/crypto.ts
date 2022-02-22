import { JSONWebKeySet } from 'jose';

export type KeyStoreType = 'local' | 'gateway';
export type KeyIdentifiers = { kids: string[], creation: string };
export type KeyStoreInformation = { kids: string[], creation: string };
export type KeyStoreContent = { keys: JSONWebKeySet, creation: string };
export type RSAKeyParameters = { 'kid': string, 'type': 'PS256' | 'RS256' };
export type ListOfRSAKeyParameters = RSAKeyParameters[];
export type Signature = string;
export type Fingerprint = string;