import { AxiosResponse } from 'axios';
import config from 'config';
import { JSONWebKeySet, JWK, JWKS } from 'jose';
import glob from 'glob';

import { CRYPTO_MATERIALS_FOLDER, GATEWAY_JWKS_ENDPOINT } from '@core/constants/constants';
import { GenerateRSAKey, ExportRSAKey } from '@core/crypto/rsa';
import { DATE_REGEX } from '@core/constants/regex';
import { JWKSRetrievalError } from '@core/errors/errors';
import { GetCurrentDay, SendHTTPRequestToGateway, ReadFile, WriteFile } from '@core/helpers/helpers';
import { Maybe, File, Folder, HTTPMethod, KeyStoreInformation, KeyStoreContent, ListOfRSAKeyParameters } from '@core/types/types';

export class KeyStore {
	private keys: JWKS.KeyStore = new JWKS.KeyStore();
	private creation: string = 'N/A';

	constructor(parameters: Partial<{ file: File, keys: ListOfRSAKeyParameters, location: Folder }> = {}) {
		this.initialize(parameters);
	}

	public initialize(parameters: Partial<{ file: File, keys: ListOfRSAKeyParameters, location: Folder }> = {}): void {
		try {
			// TODO IMMEDIATELY: Set precedence for provided keys
			const file: Maybe<string> = parameters['file'] || glob.sync(`${parameters['location']}/JWKS_*.json`).pop();
			if (file) {
				const jwks: JSONWebKeySet = JSON.parse(ReadFile(file).toString()) as JSONWebKeySet;
				this.keys = JWKS.asKeyStore(jwks);
				const date: Maybe<string> = DATE_REGEX.exec(file)?.groups?.date;
				if (date) this.creation = date;
				else throw new Error('Malformed JWKS file'); // TODO: Handle error
			} else if (parameters['keys']) {
				return this.generate(parameters['keys']);
			} else {
				this.keys = new JWKS.KeyStore();
				this.creation = 'N/A';
			}
		} catch {
			// TODO: Handle error
			throw new Error('An error occurred while initializing key store');
		}
    }

	public generate(parameters: ListOfRSAKeyParameters): void {
		this.keys = new JWKS.KeyStore();
		this.creation = GetCurrentDay();

		for (const key_parameters of parameters) {
			this.keys.add(GenerateRSAKey(key_parameters['kid'], key_parameters['type']));
		}

		this.save(true);
	}

	public update(set: JSONWebKeySet, creation: string): void {
		this.keys = JWKS.asKeyStore(set);
		this.creation = creation;
	}

	public save(full: boolean = false): void {
		this.exportAllKeys();
		this.exportJWKS(full);
	}

	public exportJWKS(full: boolean = false, location: string = CRYPTO_MATERIALS_FOLDER, filename: string = `JWKS${full ? '_PRIVATE' : 'PUBLIC'}_${GetCurrentDay()}.json`): void {
		WriteFile({ 'location': location, 'name': filename }, JSON.stringify(this.keys.toJWKS(full)));
	}

	public exportAllKeys(): void {
		for (const key of this.all()) {
			ExportRSAKey(key, CRYPTO_MATERIALS_FOLDER);
		}
	}

	public export(kid: string): void {
		ExportRSAKey(this.get(kid) as JWK.RSAKey);
	}

	public all(): JWK.RSAKey[] {
		return this.keys.all() as JWK.RSAKey[];
	}

	public identifiers(): string[] {
		return this.keys.all().map(key => key.kid);
	}

	public json(): KeyStoreContent {
		return { keys: this.get() as JSONWebKeySet, creation: this.date() };
	}

	public info(): KeyStoreInformation {
		return { kids: this.identifiers(), creation: this.creation };
	}

	public date(): string {
		return this.creation;
	}

	public get(kid?: string): JWK.RSAKey | JSONWebKeySet {
		if (kid) return this.keys.get({ kid: kid }) as JWK.RSAKey;
		else return this.keys.toJWKS(false) as JSONWebKeySet;
	}
}

export async function RetrieveGatewayJWKS(): Promise<void> {
	let retry: number = 0;
	while (retry < Number(config.get('core.operations.retry'))) {
		try {
			const response: AxiosResponse = await SendHTTPRequestToGateway(GATEWAY_JWKS_ENDPOINT, HTTPMethod.GET);
			if ((response.status >= 200) && (response.status < 300)) {
				GATEWAY_KEY_STORE.update(response.data.keys, response.data.creation);
				return;
			} else {
				// TODO: Handle error
				throw new Error('An error occurred while fetching keystore');
            }
		} catch {
			retry++;
		}
	}
	throw new JWKSRetrievalError();
};

export function InitializeLocalJWKS(parameters: { file?: File, keys?: ListOfRSAKeyParameters, location?: Folder } = {}): void {
	LOCAL_KEY_STORE.initialize(parameters);
}

export function RenewLocalJWKS(parameters: ListOfRSAKeyParameters): void {
	LOCAL_KEY_STORE.generate(parameters);
}

export const GATEWAY_KEY_STORE: KeyStore = new KeyStore();
export const LOCAL_KEY_STORE: KeyStore = new KeyStore();