import { Document } from 'mongoose';

import { MongooseSchema, CustodianTypeValues } from 'core';
import { ICustodianSchema } from './custodian.interface';

export const CUSTODIAN_COLLECTION_NAME: string = 'custodians';

export const CustodianSchema: MongooseSchema = new MongooseSchema({
	'identifier': {
		type: String,
		unique: true,
		required: true
	},
	'type': {
		type: String,
		required: true,
		enum: CustodianTypeValues
	},
	'registration': {
		type: Number,
		required: true
    },
	'server': {
		type: String,
		required: true, // TODO: Validate type
		get: (server: string) => JSON.parse(server)
	},
	'configuration': {
		type: MongooseSchema.Types.Mixed,
		required: false
    }
}, { collection: CUSTODIAN_COLLECTION_NAME });

// TODO: Validate server

export interface ICustodianModel extends Document, ICustodianSchema { };