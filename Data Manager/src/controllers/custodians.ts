import { AxiosResponse } from 'axios';
import { FilterQuery, Document } from 'mongoose';
import { OpenAPIV3 } from 'openapi-types';
import { v4 as uuidv4 } from 'uuid';

import { Maybe, Identifier, Custodian, HTTPEndpoint, ExecuteHTTPRequest, HTTPMethod, RegisteredData } from 'core';
import { DEFAULT_CUSTODIANS } from '@service/constants/constants';
import { ICustodianSchema, ICustodianModel, GetCustodianEntry, RegisterCustodianEntry, CreateCustodianEntry, CountCustodians as CountRegisteredCustodians, FetchCustodians as FetchRegisteredCustodians, IReferenceModel, IRepositoryModel } from '@service/database/schemata';
import { GetReference } from '@service/controllers/references';
import { GetRepository } from '@service/controllers/repositories';

// TODO: Handle errors

export async function RegisterCustodians(): Promise<void> {
    // TODO: Handle types
    await Promise.all(DEFAULT_CUSTODIANS.map(async (custodian: Omit<Custodian, 'registration'>) => await RegisterCustodianEntry(custodian as Omit<ICustodianSchema, 'registration' | 'server'> & { 'server': OpenAPIV3.Document })));
}

export async function GetCustodian(custodian: Identifier): Promise<ICustodianModel> {
    return await GetCustodianEntry(custodian);
}

export async function CreateCustodian(custodian: Omit<Custodian, 'registration'> & { 'identifier'?: Identifier }): Promise<Identifier> {
    // TODO: Handle error
    const custodian_entry: ICustodianModel = await CreateCustodianEntry(Object.assign({ 'identifier': uuidv4() }, custodian) as Omit<ICustodianSchema, 'registration' | 'server'> & { 'server': OpenAPIV3.Document });
    return custodian_entry.get('identifier');
}

export async function CountCustodians(filters: FilterQuery<ICustodianModel & Document>): Promise<number> {
    return await CountRegisteredCustodians(filters);
}

// TODO: Set type for expected parameters (same in DB controller)
export async function FetchCustodians(parameters: any): Promise<(ICustodianSchema & { '_id'?: string })[]> {
    return await FetchRegisteredCustodians(parameters);
}

export async function GetEndpoint(custodian: Identifier, description?: string): Promise<HTTPEndpoint> {
    const custodian_entry: ICustodianModel = await GetCustodianEntry(custodian);
    const specification: OpenAPIV3.Document = custodian_entry.get('server');
    const servers: Maybe<OpenAPIV3.ServerObject[]> = specification['servers'];
    if ((!servers) || (servers.length === 0)) {
        // TODO: Handle error
        throw new Error('No registered endpoint');
    }
    else {
        if (description) {
            const server: Maybe<OpenAPIV3.ServerObject> = servers.find((s: OpenAPIV3.ServerObject) => s['description'] === description);
            if (server) return server['url'];
            // TODO: Handle error
            else throw new Error('Endpoint not found');
        } else return servers[0]['url'];
    }
}

// TODO: Change location
export async function RegisterData(custodian: Identifier, data: Omit<RegisteredData, 'identifier' | 'metadata'>): Promise<RegisteredData> {
    let endpoint: HTTPEndpoint;
    try {
        endpoint = await GetEndpoint(custodian);
    } catch (error) {
        throw new Error('Endpoint of custodian could not be retrieved'); // TODO: Handle error
    }
    
    // TODO URGENT: Set appropriate headers
    // TODO: Support options
    try {
        const response: AxiosResponse = await ExecuteHTTPRequest(`${endpoint}/data`, HTTPMethod.POST, { 'parameters': { 'data': data } });

        if ((response.status >= 200) && (response.status < 300)) return response.data;
        else throw new Error('Custodian returned an error while handling the request'); // TODO: Handle error
    } catch (error) {
        throw new Error('An error occurred while sending request to the custodian'); // TODO: Handle error
    }
}

// TODO: Change location
export async function RetrieveData(reference: Identifier): Promise<RegisteredData> {
    const reference_entry: IReferenceModel = await GetReference(reference);
    const repository_entry: IRepositoryModel = await GetRepository(reference_entry.get('repository'));
    const endpoint: HTTPEndpoint = await GetEndpoint(repository_entry.get('custodian'));

    // TODO URGENT: Set appropriate headers
    // TODO: Support options
    try {
        const response: AxiosResponse = await ExecuteHTTPRequest(`${endpoint}/data/${reference_entry.get('data')}`, HTTPMethod.GET);

        // TODO URGENT: Verify the hash of retrieved data with respect to stored reference
        if ((response.status >= 200) && (response.status < 300)) return response.data;
        else throw new Error('Custodian returned an error while handling the request'); // TODO: Handle error
    } catch (error) {
        throw new Error('An error occurred while sending request to the custodian'); // TODO: Handle error
    }
}