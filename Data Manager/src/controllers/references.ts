import { FilterQuery, Document, LeanDocument } from 'mongoose';

import { Identifier, StoredReference, Fingerprint, ComputeSHA256, RegisteredData } from 'core';
import { RegisterData } from '@service/controllers/custodians';
import { GetRepository } from '@service/controllers/repositories';
import { IReferenceSchema, IReferenceModel, GetReferenceEntry, CountReferences as CountStoredReferences, FetchReferences as FetchStoredReferences, CreateReferenceEntry, AddRecordToReference, IRepositoryModel } from '@service/database/schemata';

// TODO: Handle errors

export async function GetReference(reference: Identifier): Promise<IReferenceModel> {
    return await GetReferenceEntry(reference);
}

export async function CountReferences(filters: FilterQuery<IReferenceModel & Document>): Promise<number> {
    return await CountStoredReferences(filters);
}

// TODO: Set type for expected parameters (same in DB controller)
export async function FetchReferences(parameters: any): Promise<(IReferenceSchema & { '_id'?: string })[]> {
    return await FetchStoredReferences(parameters);
}

// TODO: Add support for options (signature, encryption, etc.)
export async function RegisterReference(reference: Pick<StoredReference, 'repository'> & { 'identifier'?: Identifier, 'data': { [key: string]: any } }): Promise<LeanDocument<IReferenceModel>> {
    // TODO: Handle error

    try {
        const repository: IRepositoryModel = await GetRepository(reference['repository']);

        const registered_data: RegisteredData = await RegisterData(repository.get('custodian'), { 'data': reference['data'] }); // Add signature and encryption when asked by user

        const fingerprint: Fingerprint = ComputeSHA256(reference['data']);
        const reference_entry: IReferenceModel = await CreateReferenceEntry(Object.assign(reference, { 'data': registered_data['identifier'], 'fingerprint': fingerprint }) as Pick<StoredReference, 'repository' | 'data' | 'fingerprint'> & { 'identifier'?: Identifier });
        // TODO URGENT: Registration of associated record
        return reference_entry.toJSON();
    } catch (error) {
        throw error;
    }
}

export async function RegisterRecord(reference: Identifier, record: Identifier): Promise<Identifier> {
    const reference_entry: IReferenceModel = await AddRecordToReference(reference, record);
    return reference_entry.get('record');
}