import { Document } from 'mongoose';

import { DLTReferenceStateValues, MongooseSchema } from 'core';
import { ITrackAndTraceTraceSchema } from './trace.interface';

export const TRACK_AND_TRACE_TRACE_COLLECTION_NAME: string = 'track-and-trace-traces';

export const TrackAndTraceTraceSchema: MongooseSchema = new MongooseSchema({
	'identifier': {
		type: String,
		unique: true,
		required: true
	},
	'timestamp': {
		type: Number,
		required: true
	},
	'signature': {
		type: String,
		required: true
	},
	'data': {
		type: String,
		required: false
	},
	'reference': {
		type: {
			platform: { type: String, required: true },
			identifier: { type: String, required: true },
			state: { type: String, required: true, enum: DLTReferenceStateValues }
		},
		required: false,
		_id: false
	}
}, { discriminatorKey: 'context', collection: TRACK_AND_TRACE_TRACE_COLLECTION_NAME });

export interface ITrackAndTraceTraceModel extends Document, ITrackAndTraceTraceSchema { };