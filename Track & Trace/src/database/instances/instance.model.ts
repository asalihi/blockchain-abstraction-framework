import { Document, NativeError, LeanDocument } from 'mongoose';

import { MongooseSchema, Maybe, Nullable, Identifier, ExecutionInstanceStateValues } from 'core';
import { IExecutionInstanceSchema } from './instance.interface';
import { ProcessVersion, IProcessVersionModel, IExecutionInstanceTraceModel } from '@service/database/schemata';
import { FetchExecutionInstanceTraces } from '../traces/trace';

export const EXECUTION_INSTANCE_COLLECTION_NAME: string = 'execution-instances';

export const ExecutionInstanceSchema: MongooseSchema = new MongooseSchema({
	'process': {
		type: String,
		required: true
	},
	'version': {
		type: String,
		required: true
	},
	'instance': {
		type: String,
		unique: true,
		required: true
	},
	'state': {
		type: String,
		enum: ExecutionInstanceStateValues,
		required: true
	},
	'creation': {
		type: Number,
		required: true
	},
	'start': {
		type: Number,
		required: false
	},
	'deviation': {
		type: Number,
		required: false
	},
	'stop': {
		type: Number,
		required: false
	},
	'signature': {
		type: String,
		required: true
	},
	'execution': {
		type: Schema.Types.Mixed,
		required: true,
		default: {},
		_id: false
	},
	'resources': {
		type: {
			'data': {
				type: {
					// TODO: We should not have data if state was not activated
					'creation': { type: String, required: false },
					'start': { type: String, required: false },
					'deviation': { type: String, required: false },
					'stop': { type: String, required: false }
				},
				required: false,
				_id: false
			},
			'options': {
				type: String,
				required: false
			}
		},
		required: true,
		default: {},
		_id: false
	},
	'traces': {
		'creation': {
			type: String,
			validate: async function (this: IExecutionInstanceModel) {
				const traces: LeanDocument<IExecutionInstanceTraceModel>[] = await FetchExecutionInstanceTraces({ filters: { process: this.process, version: this.version, instance: this.instance, type: 'creation' } }, this.$session());
				const identifier: Maybe<Identifier> = this.get('traces.creation');
				return ((traces.length === 0) && !identifier) || (identifier && traces.find((trace: LeanDocument<IExecutionInstanceTraceModel>) => trace['identifier'] === identifier));
			}
		},
		'start': {
			type: String,
			validate: async function (this: IExecutionInstanceModel) {
				const traces: LeanDocument<IExecutionInstanceTraceModel>[] = await FetchExecutionInstanceTraces({ filters: { process: this.process, version: this.version, instance: this.instance, type: 'activation' } }, this.$session());
				const identifier: Maybe<Identifier> = this.get('traces.start');
				return ((traces.length === 0) && !identifier) || (identifier && traces.find((trace: LeanDocument<IExecutionInstanceTraceModel>) => trace['identifier'] === identifier));
			}
		},
		'updates': { type: [{ type: String, _id: false }], default: [], required: true },
		'deviation': {
			type: String,
			validate: async function (this: IExecutionInstanceModel) {
				const traces: LeanDocument<IExecutionInstanceTraceModel>[] = await FetchExecutionInstanceTraces({ filters: { process: this.process, version: this.version, instance: this.instance, type: 'deviation' } }, this.$session());
				const identifier: Maybe<Identifier> = this.get('traces.deviation');
				return ((traces.length === 0) && !identifier) || (identifier && traces.find((trace: LeanDocument<IExecutionInstanceTraceModel>) => trace['identifier'] === identifier));
			}
		},
		'stop': {
			type: String,
			validate: async function (this: IExecutionInstanceModel) {
				const traces: LeanDocument<IExecutionInstanceTraceModel>[] = await FetchExecutionInstanceTraces({ filters: { process: this.process, version: this.version, instance: this.instance, type: { $in: ['termination', 'cancelation'] } } }, this.$session());
				const identifier: Maybe<Identifier> = this.get('traces.stop');
				return ((traces.length === 0) && !identifier) || (identifier && traces.find((trace: LeanDocument<IExecutionInstanceTraceModel>) => trace['identifier'] === identifier));
			}
		},
		_id: false
    }
}, { collection: EXECUTION_INSTANCE_COLLECTION_NAME });

ExecutionInstanceSchema.pre('validate', async function (this: IExecutionInstanceModel, next: (error?: NativeError) => void) {
	// TODO: Validate options

	const version: Nullable<IProcessVersionModel & Document> = await ProcessVersion.findOne({ process: this.process, version: this.version }).session(this.$session());
	version ? next() : next(new Error('Instance does not refer to a valid process'));

	// TODO URGENT: Validate states and traces
});

export interface IExecutionInstanceModel extends Document, IExecutionInstanceSchema { };
