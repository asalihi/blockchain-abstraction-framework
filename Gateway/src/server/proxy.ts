import config from 'config';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

import { GenerateUniqueIdentifier, HashInputUsingSalt, SignHTTPRequest } from '@service/crypto/helpers';
import { GetDateInSeconds, AddSecondsToCurrentDate, Sort } from '@service/utils/helpers';
import { SERVER_ENDPOINT } from './server';

const PROXY: AxiosInstance = axios.create();

// TODO: Add audience and set variable for expires option
PROXY.interceptors.request.use((configuration: AxiosRequestConfig): AxiosRequestConfig => {
	let nonce: string = GenerateUniqueIdentifier(8);
	let payload: Object = ({
		nonce: nonce,
		expires: GetDateInSeconds(AddSecondsToCurrentDate(10)),
		issuer: config.get('module'),
		method: configuration.method!.toLowerCase(),
		endpoint: configuration.url,
		...(configuration.data && { data: HashInputUsingSalt(JSON.stringify(Sort(configuration.data)), nonce) })
	});
	Object.assign(configuration.headers, { 'Authorization': `Signature jwks=${Buffer.from(`${SERVER_ENDPOINT}${config.get('server.jwks')}`).toString('base64')},kid=${Buffer.from(config.get('crypto.signing.keys.http')).toString('base64')},sig=${Buffer.from(SignHTTPRequest(payload)).toString('base64')}` });
	return configuration;
});

export { PROXY };