import { Document, NativeError } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

import { Identifier, MongooseSchema } from 'core';
import { IDataSchema } from './data.interface';

export const DATA_COLLECTION_NAME: string = 'data';

export const DataSchema: MongooseSchema = new MongooseSchema({
	'identifier': {
		type: String,
		unique: true,
		required: true
	},
	'data': {
		type: MongooseSchema.Types.Mixed,
		required: true
	},
	'signature': {
		type: {
			'value': {
				type: String,
				required: true
			},
			'key': {
				type: String,
				required: true
            }
        },
		required: false
	},
	'encryption': {
		type: {
			'key': {
				type: String,
				required: true
            }
		},
		required: false
	},
	'metadata': {
		type: MongooseSchema.Types.Mixed, // TODO: Validate it as an object of key-value pairs
		required: false
    }
}, { collection: DATA_COLLECTION_NAME, minimize: false });

DataSchema.pre('validate', async function (next: (error?: NativeError) => void) {
	const identifier: Identifier = uuidv4();
	this.set('identifier', identifier);
	next();
});

export interface IDataModel extends Document, IDataSchema { };