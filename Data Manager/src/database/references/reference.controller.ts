import { Document, Query, ClientSession, FilterQuery } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

import { Nullable, Identifier, StoredReference, QueryExecutionError, ElementNotFoundInCollection } from 'core';
import { DATABASE_CONNECTION as connection } from '@service/database/database';
import { Reference, IReferenceSchema, IReferenceModel, AddEntryToRepository } from '@service/database/schemata';

type ReferenceQuery = Query<Nullable<IReferenceModel>, Document<IReferenceModel>>;

async function ExecuteQuery(identifier: string, operation: string, query: ReferenceQuery): Promise<IReferenceModel> {
	let reference: Nullable<IReferenceModel>;
	try {
		reference = await query.exec();
	} catch (error) {
		throw new QueryExecutionError(operation);
	}

	if (reference) return reference;

	throw new ElementNotFoundInCollection('reference', identifier);
}

export async function GetReferenceEntry(identifier: Identifier, session?: ClientSession): Promise<IReferenceModel> {
	const query: ReferenceQuery = Reference.findOne({ identifier: identifier }).session(session ?? null);
	return await ExecuteQuery(identifier, 'fetch', query);
}

export async function CreateReferenceEntry(data: Pick<StoredReference, 'repository' | 'data' | 'fingerprint'> & { 'identifier'?: Identifier }, session?: ClientSession): Promise<IReferenceModel> {
	let success: boolean = false;
	let reference: IReferenceModel;

	const operations = async (data: Omit<StoredReference, 'identifier' | 'creation'> & { 'identifier'?: Identifier }, session: ClientSession): Promise<void> => {
		// TODO URGENT: Create record and set it at creation, then enable 'immutable: true' option in Mongoose model
		reference = await new Reference(Object.assign({ 'identifier': uuidv4() }, data, { 'creation': Date.now() })).save({ session });
		try {
			await AddEntryToRepository(reference.get('repository'), reference.get('identifier'), session);
		} catch (error) {
			throw error;
        }
		success = true;
	};

	if (session) {
		await operations(data, session);
	} else {
		await connection.transaction(async function executor(session: ClientSession): Promise<void> {
			await operations(data, session);
		}).catch((error) => { /* TODO: Log error */ });
	}

	if (success) return reference!;
	else throw new QueryExecutionError('creation of reference');
}

export async function CountReferences(filters?: FilterQuery<IReferenceModel & Document>, session?: ClientSession): Promise<number> {
	return await Reference.countDocuments(filters ?? {});
}

export async function FetchReferences(parameters: any, session?: ClientSession): Promise<(IReferenceSchema & { '_id'?: string })[]> {
	let query: Query<(IReferenceModel & Document)[], IReferenceModel & Document, {}> = Reference.find(parameters['filters'] ?? {}).skip(parameters['page'] * parameters['size']).limit(parameters['size']).session(session ?? null);

	if (parameters['sort_field']) {
		query = query.sort({ [parameters['sort_field']]: parameters['sort_direction'] });
	}

	return await query.lean().exec();
}

export async function AddRecordToReference(reference: Identifier, record: Identifier, session?: ClientSession): Promise<IReferenceModel> {
	const reference_entry: IReferenceModel = await GetReferenceEntry(reference, session);
	if (!reference_entry.get('record')) {
		const query: ReferenceQuery = Reference.findOneAndUpdate({ identifier: reference }, { 'record': record }, { strict: true }).session(session ?? null);
		return await ExecuteQuery(reference, 'add record', query);
	} else {
		throw new Error('Reference already contains a record'); // TODO: Handle error
    }
}