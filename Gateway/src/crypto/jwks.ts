import { AxiosResponse } from 'axios';
import config from 'config';
import glob from 'glob';
import { JWK, JWKS, JSONWebKeySet } from 'jose';

import { FetchModules } from '@service/controller/modules';
import { IModuleSchema, GetModuleEntry } from '@service/database/schemata';
import { GetCurrentDay, ReadFile, WriteFile, ExecuteHTTPRequest } from '@service/utils/helpers';
import { CRYPTO_MATERIALS_FOLDER, DATE_REGEX } from '@service/utils/constants';
import { GenerateRSAKey, ExportRSAKey } from '@service/crypto/rsa';
import { Maybe, File, Folder, KeyStoreInformation, KeyStoreContent, HTTPMethod, ListOfRSAKeyParameters, Identifier } from '@service/utils/types';

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

		for (const key_parameters of parameters) {
			this.keys.add(GenerateRSAKey(key_parameters['kid'], key_parameters['type']));
		}

		this.creation = GetCurrentDay();

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
		return { kids: this.identifiers(), creation: this.date() };
	}

	public date(): string {
		return this.creation;
	}

	public get(kid?: string): JWK.RSAKey | JSONWebKeySet {
		if (kid) return this.keys.get({ kid: kid }) as JWK.RSAKey;
		else return this.keys.toJWKS(false) as JSONWebKeySet;
	}
}

export function InitializeLocalJWKS(parameters: Partial<{ file: File, keys: ListOfRSAKeyParameters, location: Folder }> = {}): void {
	LOCAL_KEY_STORE.initialize(parameters);
}

export function RenewLocalJWKS(parameters: ListOfRSAKeyParameters): void {
	LOCAL_KEY_STORE.generate(parameters);
}

export async function RetrieveExternalJWKS(): Promise<void> {
	// TODO: Use specific type
	const modules: (IModuleSchema & { '_id'?: string })[] = await FetchModules();

	for (const module of modules) {
		await RetrieveJWKSOfModule(module);
    }
};

export async function RetrieveJWKSOfModule(module: (IModuleSchema & { '_id'?: string }) | Identifier): Promise<void> {
	if (typeof module === 'string') module = await GetModuleEntry(module);

	let retry: number = 0;
	while (retry < Number(config.get('core.operations.retry'))) {
		try {
			const response: AxiosResponse = await ExecuteHTTPRequest(`${module['server']}/.well-known/jwks.json`, HTTPMethod.GET);
			if ((response.status >= 200) && (response.status < 300)) {
				const keystore: KeyStore = new KeyStore();
				keystore.update(response.data.keys, response.data.creation);
				EXTERNAL_KEY_STORES[module['identifier']] = keystore;
				return;
			} else {
				// TODO: Handle error
				throw new Error(`An error occurred while fetching keystore for module ${module['identifier']}`);
			}
		} catch {
			retry++;
		}
	}

	EXTERNAL_KEY_STORES[module['identifier']] = new KeyStore();
	// TODO URGENT: Log warning
}

export const LOCAL_KEY_STORE: KeyStore = new KeyStore();
export const EXTERNAL_KEY_STORES: { [key: string]: KeyStore } = {};