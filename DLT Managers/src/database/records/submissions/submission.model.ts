import { Document } from 'mongoose';

import { MongooseSchema } from 'core';
import { RecordSubmissionStateValues } from 'core';
import { IRecordSubmissionSchema } from './submission.interface';

export const RECORD_SUBMISSION_COLLECTION_NAME: string = 'record-submissions';

export const RecordSubmissionSchema: MongooseSchema = new MongooseSchema({
	'identifier': {
		type: String,
		unique: true,
		required: true
	},
	'registration': {
		type: Number,
		required: true
	},
	'actions': {
		type: MongooseSchema.Types.Mixed,
		required: false
	},
	'options': {
		type: MongooseSchema.Types.Mixed,
		required: false
	},
	'state': {
		type: String,
		required: true,
		enum: RecordSubmissionStateValues
	},
	'metadata': {
		type: MongooseSchema.Types.Mixed,
		required: false
	}
}, { discriminatorKey: 'type', collection: RECORD_SUBMISSION_COLLECTION_NAME });

export interface IRecordSubmissionModel extends Document, IRecordSubmissionSchema { };