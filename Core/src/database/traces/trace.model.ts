import { Document, Schema } from 'mongoose';

import { ITraceSchema } from './trace.interface';
import { DLTReferenceStateValues } from '@core/types/types';

export const TRACE_COLLECTION_NAME: string = 'traces';

export const TraceSchema: Schema = new Schema({
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
	'reference': {
		type: {
			'platform': {
				type: Schema.Types.ObjectId,
				ref: 'Instance',
				required: true
			},
			'identifier': {
				type: String,
				required: true
			},
			'state': {
				type: String,
				enum: DLTReferenceStateValues,
				required: true
			}
		},
		required: true
	}
}, { discriminatorKey: 'type', collection: TRACE_COLLECTION_NAME, minimize: false });

export interface ITraceModel extends Document, ITraceSchema { };
