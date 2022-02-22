import { Query, SaveOptions, QueryOptions, ClientSession } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

import { QueryExecutionError, ElementNotFoundInCollection, Nullable, Identifier } from 'core';
import { DATABASE_CONNECTION as connection } from '@service/database/database';
import { IDLTInstanceModel } from './instance.model';
import { SupportedNetworks, SupportedNetworkSchema, SupportedNetworkModel, SupportedNetworkModels } from './networks/networks';
import { DLTInstance, IDLTInstanceProfileModel, DLTInstanceProfile, FabricNetwork, EthereumNetwork } from '@service/database/schemata';

type InstanceQuery = Query<Nullable<IDLTInstanceModel>, IDLTInstanceModel>;

async function ExecuteQuery(identifier: string, operation: string, query: InstanceQuery): Promise<SupportedNetworkModel> {
	let instance: Nullable<IDLTInstanceModel>;
	try {
		instance = await query.exec();
	} catch(error) {
		console.log('Error from execute query');
		throw new QueryExecutionError(operation);
	}

	if (instance) return instance as SupportedNetworkModel;

	throw new ElementNotFoundInCollection('DLT instance', identifier);
}

export async function GetDLTInstanceEntry(identifier: string, network: string, session?: ClientSession): Promise<SupportedNetworkModel> {
	switch(network) {
		case 'fabric': return ExecuteQuery(identifier, 'fetch', FabricNetwork.findOne({ identifier: identifier }).session(session ?? null));
		default: throw new QueryExecutionError('retrieval of an unsupported DLT instance');
	}
}

export async function CreateDLTInstanceEntry(parameters: Omit<SupportedNetworkSchema, 'creation' | 'deactivation' | 'state'>, session?: ClientSession): Promise<SupportedNetworkModel> {
	try {
		const operations = async (parameters: Omit<SupportedNetworkSchema, 'creation' | 'deactivation' | 'state'>, session: ClientSession): Promise<SupportedNetworkModel> => {
			if (SupportedNetworks.includes(parameters['network'])) {
				const identifier: Identifier = parameters['identifier'];
				// TODO: Maybe call CreateDLTInstanceProfileEntry with an option specifying that object should not be saved instead of using directly the class
				const profile: IDLTInstanceProfileModel = new DLTInstanceProfile(parameters['profile']);
				let instance: SupportedNetworkModel;
				switch(parameters['network']) {
					case 'ethereum': {
						instance = new EthereumNetwork(Object.assign(parameters, { state: 'unavailable', 'creation': Date.now(), profile: profile._id }));
						break;
					}
					case 'fabric': {
						instance = new FabricNetwork(Object.assign(parameters, { state: 'unavailable', 'creation': Date.now(), profile: profile._id }));
						break;
					}
				}
				profile.set('instance', instance.identifier);
				await Promise.all([profile.save({ session }), instance.save({ session })]);
				return instance;
			} else throw new QueryExecutionError('creation of an unsupported DLT instance');
		};

		if (session) {
			return await operations(parameters, session);
		} else {
			return await connection.transaction(async function executor(session: ClientSession): Promise<SupportedNetworkModel> {
				return await operations(parameters, session);
			}).catch((error) => { /* TODO: Handle error better */ throw error; });
		}
	} catch (error) {
		console.log('Error during creation of an instance');
		console.log(error);
		throw new QueryExecutionError('creation of DLT instance entry');
	}
}