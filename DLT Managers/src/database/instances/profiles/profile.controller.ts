import { Query, UpdateQuery, SaveOptions, QueryOptions } from 'mongoose';

import { QueryExecutionError, ElementNotFoundInCollection, Identifier, Nullable } from 'core';
import { IDLTInstanceProfileSchema, IDLTInstanceProfileModel } from './profile';
import { DLTInstanceProfile } from '@service/database/schemata';

type DLTInstanceProfileQuery = Query<Nullable<IDLTInstanceProfileModel>, IDLTInstanceProfileModel>;

async function ExecuteQuery(instance: string, operation: string, query: DLTInstanceProfileQuery): Promise<IDLTInstanceProfileModel> {
	let profile: Nullable<IDLTInstanceProfileModel>;
	try {
		profile = await query.exec();
	} catch(error) {
		throw new QueryExecutionError(operation);
	}

	if(profile) return profile;

	throw new ElementNotFoundInCollection('profile of DLT instance', instance);
}

export async function GetDLTInstanceProfileEntry(instance: string): Promise<IDLTInstanceProfileModel> {
	let query: DLTInstanceProfileQuery = DLTInstanceProfile.findOne({ instance: instance });
	return ExecuteQuery(instance, 'fetch of profile of instance', query);
}

export async function CreateDLTInstanceProfileEntry(context: { options?: SaveOptions, data: Partial<IDLTInstanceProfileSchema> }): Promise<IDLTInstanceProfileModel> {
	try {
		return await new DLTInstanceProfile(context['data']).save(context['options'] ?? {});
	} catch(error) {
		throw new QueryExecutionError('creation of profile of DLT instance');
	}
}

export async function UpdateDLTInstanceProfileEntry(context: { options?: QueryOptions, instance: Identifier, update: UpdateQuery<IDLTInstanceProfileModel> }): Promise<IDLTInstanceProfileModel> {
	let query: DLTInstanceProfileQuery = DLTInstanceProfile.findOneAndUpdate({ instance: context['instance'] }, context['update'], Object.assign({ new: true }, context['options'] ?? {}));
	return ExecuteQuery(context['instance'], 'update of profile of DLT instance', query);
}

export async function RemoveDLTInstanceProfileEntry(context: { options?: QueryOptions, instance: Identifier }): Promise<IDLTInstanceProfileModel> {
	let query: DLTInstanceProfileQuery = DLTInstanceProfile.findOneAndDelete({ instance: context['instance'] }, context['options'] ?? {});
	return ExecuteQuery(context['instance'], 'deletion of profile of DLT instance', query);
}