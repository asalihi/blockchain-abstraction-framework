// TODO: Handle options for signature, encryption etc.
import { AxiosResponse } from 'axios';

import { Identifier, HTTPMethod, StoredReference, RegisteredData } from '@core/types/types';
import { SendHTTPRequestToGatewayAPI } from '@core/helpers/helpers';

export async function RetrieveReference(reference: Identifier): Promise<StoredReference> {
	// TODO URGENT: Set appropriate headers
	// TODO: Support options
	try {
		const response: AxiosResponse = await SendHTTPRequestToGatewayAPI(`/data-manager/references/${reference}`, HTTPMethod.GET);

		if ((response.status >= 200) && (response.status < 300)) return response.data;
		else throw new Error('Data Manager returned an error while handling the request'); // TODO: Handle error
	} catch (error) {
		throw new Error('An error occurred while sending request to Data Manager'); // TODO: Handle error
	}
}

export async function RetrieveData(reference: Identifier): Promise<RegisteredData> {
	// TODO URGENT: Set appropriate headers
	// TODO: Support options
	try {
		const response: AxiosResponse = await SendHTTPRequestToGatewayAPI(`/data-manager/references/${reference}/data`, HTTPMethod.GET);

		if ((response.status >= 200) && (response.status < 300)) return response.data;
		else throw new Error('Data Manager returned an error while handling the request'); // TODO: Handle error
	} catch (error) {
		throw new Error('An error occurred while sending request to Data Manager'); // TODO: Handle error
	}
}

// TODO: Set appropriate return type
export async function RegisterReference(repository: Identifier, data: any, options?: { [key: string]: any }): Promise<any> {
	// TODO URGENT: Set appropriate headers
	// TODO: Support options
	try {
		const response: AxiosResponse = await SendHTTPRequestToGatewayAPI(`/data-manager/repositories/${repository}/entries`, HTTPMethod.POST, { 'parameters': { 'data': data } });

		if ((response.status >= 200) && (response.status < 300)) return response.data;
		else throw new Error('Data Manager returned an error while handling the request'); // TODO: Handle error
	} catch {
		throw new Error('An error occurred while sending request to Data Manager'); // TODO: Handle error
	}
}

export async function RegisterRecord(reference: Identifier, record: Identifier): Promise<Identifier> {
	// TODO URGENT: Set appropriate headers
	// TODO: Support options
	try {
		const response: AxiosResponse = await SendHTTPRequestToGatewayAPI(`/data-manager/references/${reference}/record`, HTTPMethod.POST, { 'parameters': { 'record': record } });

		if ((response.status >= 200) && (response.status < 300)) return response.data['record'];
		else throw new Error('Data Manager returned an error while handling the request'); // TODO: Handle error
	} catch {
		throw new Error('An error occurred while sending request to Data Manager'); // TODO: Handle error
	}
}