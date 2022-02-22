import { Document, NativeError, LeanDocument } from 'mongoose';

import { Maybe, Nullable, Identifier, ProcessStateValues, MongooseSchema } from 'core';
import { IProcessVersionSchema } from './version.interface';
import { IProcessModel, Process, IProcessVersionTraceModel } from '@service/database/schemata';
import { FetchProcessVersionTraces } from '../traces/trace';

export const PROCESS_VERSION_COLLECTION_NAME: string = 'process-versions';

export const ProcessVersionSchema: MongooseSchema = new MongooseSchema({
	'process': {
		type: String,
		required: true
	},
	'version': {
		type: String,
		required: true
    },
	'state': {
		type: String,
        enum: ProcessStateValues,
        required: true
	},
	'creation': {
		type: Number,
		required: true
	},
	'deactivation': {
        type: Number,
        validate: function (this: IProcessVersionSchema): boolean { return this.deactivation ? (this.deactivation! >= this.creation) : true }
	},
	'signature': {
		type: String,
		required: true
	},
    'instances': {
        type: [{ type: String }],
        required: true,
        default: []
    },
    'resources': {
        type: {
            'file': {
                type: String,
                required: true
            },
            'data': {
                type: {
                    'creation': { type: String, required: false },
                    'deactivation': { type: String, required: false }
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
        type: {
            'creation': {
                type: String,
                validate: async function (this: IProcessVersionModel) {
                    const traces: LeanDocument<IProcessVersionTraceModel>[] = await FetchProcessVersionTraces({ filters: { process: this.process, version: this.version, type: 'creation' } }, this.$session());
                    const identifier: Maybe<Identifier> = this.get('traces.creation');
                    return ((traces.length === 0) && !identifier) || (identifier && traces.find((trace: LeanDocument<IProcessVersionTraceModel>) => trace['identifier'] === identifier));
                }
            },
            'deactivation': {
                type: String,
                validate: async function (this: IProcessVersionModel) {
                    const traces: LeanDocument<IProcessVersionTraceModel>[] = await FetchProcessVersionTraces({ filters: { process: this.process, version: this.version, type: 'creation' } }, this.$session());
                    const identifier: Maybe<Identifier> = this.get('traces.deactivation');
                    return ((traces.length === 0) && !identifier) || (identifier && traces.find((trace: LeanDocument<IProcessVersionTraceModel>) => trace['identifier'] === identifier));
                }
            }
        },
        required: true,
        default: {},
        _id: false
    }
}, { collection: PROCESS_VERSION_COLLECTION_NAME });

ProcessVersionSchema.index({ 'process': 1, 'version': 1 }, { 'unique': true });

ProcessVersionSchema.pre('validate', async function (next: (error?: NativeError) => void) {
    // TODO: Verify options

    const version: Nullable<IProcessModel & Document> = await Process.findOne({ process: (<unknown>this as IProcessVersionSchema).process }).session(this.$session());
    // TODO: Handle error
    version ? next() : next(new Error('Version does not refer to a valid process'));
});

export interface IProcessVersionModel extends Document, IProcessVersionSchema { };
