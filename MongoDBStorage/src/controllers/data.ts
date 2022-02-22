import { FilterQuery, Document } from 'mongoose';

import { Message, RegisteredData, Identifier } from 'core';
import { IDataSchema, IDataModel, GetDataEntry, CreateDataEntry, CountDataEntries as CountStoredDataEntries, FetchDataEntries as FetchStoredDataEntries } from '@service/database/schemata';

export async function HandleReceivedMessage(message: Message): Promise<void> {
    // TODO URGENT: Define logic
}

export async function RetrieveData(identifier: Identifier): Promise<IDataModel> {
    return await GetDataEntry(identifier);
}

export async function CountDataEntries(filters: FilterQuery<IDataModel & Document>): Promise<number> {
    return await CountStoredDataEntries(filters);
}

// TODO: Set type for expected parameters (same in DB controller)
export async function FetchDataEntries(parameters: any): Promise<(IDataSchema & { '_id'?: string })[]> {
    return await FetchStoredDataEntries(parameters);
}

export async function RegisterData(data: Omit<RegisteredData, 'identifier' | 'metadata'>): Promise<IDataModel> {
    return await CreateDataEntry(data);
}