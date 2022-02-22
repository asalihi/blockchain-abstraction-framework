import { JSONWebKeySet } from 'jose';

export type Hash = string;
export type Salt = string;
export type HashWithSalt = { value: Hash, salt: Salt };
export type PasswordHashedWithSalt = HashWithSalt;
export type KeyStoreInformation = { kids: string[], creation: string };
export type KeyStoreContent = { keys: JSONWebKeySet, creation: string };
export type RSAKeyParameters = { 'kid': string, 'type': 'PS256' | 'RS256' };
export type ListOfRSAKeyParameters = RSAKeyParameters[];