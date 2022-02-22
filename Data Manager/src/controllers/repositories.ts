import { FilterQuery, Document, LeanDocument } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

import { Identifier, Repository } from 'core';
import { RegisterReference } from '@service/controllers/references';
import { IRepositorySchema, IRepositoryModel, GetRepositoryEntry, CountRepositories as CountStoredRepositories, FetchRepositories as FetchStoredRepositories, CreateRepositoryEntry, IReferenceModel } from '@service/database/schemata';

// TODO: Handle errors

export async function GetRepository(repository: Identifier): Promise<IRepositoryModel> {
    return await GetRepositoryEntry(repository);
}

export async function CountRepositories(filters: FilterQuery<IRepositoryModel & Document>): Promise<number> {
    return await CountStoredRepositories(filters);
}

// TODO: Set type for expected parameters (same in DB controller)
export async function FetchRepositories(parameters: any): Promise<(IRepositorySchema & { '_id'?: string })[]> {
    return await FetchStoredRepositories(parameters);
}

export async function RegisterRepository(repository: Omit<Repository, 'identifier' | 'creation' | 'state' | 'entries'> & { 'identifier'?: string }): Promise<Identifier> {
    // TODO: Handle error
    const repository_entry: IRepositoryModel = await CreateRepositoryEntry(Object.assign({ 'identifier': uuidv4() }, repository) as Omit<Repository, 'identifier' | 'creation' | 'state' | 'entries'> & { 'identifier'?: string });
    return repository_entry.get('identifier');
}

export async function AddEntryToRepository(repository: Identifier, entry: { 'identifier'?: Identifier, 'data': { [key: string]: any } }): Promise<LeanDocument<IReferenceModel>> {
    return RegisterReference(Object.assign(entry, { 'repository': repository }));
}