import { Document } from 'mongoose';

import { MongooseSchema } from 'core';
import { ContractInvocationTypeValues, ContractManagementTypeValues } from 'core';
import { IContractOperationSchema } from './operation.interface';

export const CONTRACT_OPERATION_COLLECTION_NAME: string = 'smart-contract-operations';

export const ContractOperationSchema: MongooseSchema = new MongooseSchema({
	'identifier': {
		type: String,
		unique: true,
		required: true
	},
	'contract': {
		type: String,
		required: true
	},
	'type': {
		type: String,
		required: true,
		enum: [...ContractInvocationTypeValues, ...ContractManagementTypeValues]
	},
	'date': {
		type: Number,
		required: true
	},
	'reference': {
		type: String,
		required: false
	}
}, { discriminatorKey: 'context', collection: CONTRACT_OPERATION_COLLECTION_NAME });

export interface IContractOperationModel extends Document, IContractOperationSchema { };