import { Document } from 'mongoose';

import { IReferenceSchema } from './reference.interface';

export const REFERENCE_COLLECTION_NAME: string = 'references';

export const ReferenceSchema: MongooseSchema = new MongooseSchema({
	'identifier': {
		type: String,
		unique: true,
		required: true
	},
	'creation': {
		type: Number,
		required: true
    },
	'repository': {
		type: String,
		required: true
	},
	'data': {
		type: String,
		required: true
	},
	'fingerprint': {
		type: String,
		required: true
	},
	'record': {
		type: String,
		required: false,
		// TODO: Restore when record will be handled correctly
		// immutable: true
    }
}, { collection: REFERENCE_COLLECTION_NAME });

export interface IReferenceModel extends Document, IReferenceSchema { };