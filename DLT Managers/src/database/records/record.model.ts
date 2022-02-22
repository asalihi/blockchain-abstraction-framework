import { Document } from 'mongoose';

import { MongooseSchema } from 'core';
import { RecordStateValues } from 'core';
import { IRecordSchema } from './record.interface';

export const RECORD_COLLECTION_NAME: string = 'records';

export const RecordSchema: MongooseSchema = new MongooseSchema({
	'identifier': {
		type: String,
		unique: true,
		required: true
	},
	'instance': {
		type: String,
		required: true
	},
	'state': {
		type: String,
		required: true,
		enum: RecordStateValues
	}
}, { discriminatorKey: 'context', collection: RECORD_COLLECTION_NAME });

export interface IRecordModel extends Document, IRecordSchema { };