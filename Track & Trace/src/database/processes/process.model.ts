import { Document, NativeError, LeanDocument } from 'mongoose';

import { MongooseSchema, Maybe, Identifier, ProcessStateValues } from 'core';
import { IProcessSchema } from './process.interface';
import { IProcessTraceModel } from '@service/database/schemata';
import { FetchProcessTraces } from '../traces/trace';

export const PROCESS_COLLECTION_NAME: string = 'processes';

export const ProcessSchema: MongooseSchema = new MongooseSchema({
    'process': {
        type: String,
        unique: true,
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
        validate: function (this: IProcessSchema): boolean { return this.deactivation ? (this.deactivation! >= this.creation) : true },
        required: function (this: IProcessSchema): boolean { return (this.state === 'deactivated') ? true : false }
    },
    'signature': {
        type: String,
        required: true
    },
    'versions': {
        type: [{ type: String }],
        required: true,
        default: []
    },
    'resources': {
        type: {
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
                validate: async function (this: Document) {
                    const traces: LeanDocument<IProcessTraceModel>[] = await FetchProcessTraces({ filters: { process: this.$parent()!.get('process'), type: 'creation' } }, this.$session());
                    const identifier: Maybe<Identifier> = this.get('creation');
                    return ((traces.length === 0) && !identifier) || (identifier && traces.find((trace: LeanDocument<IProcessTraceModel>) => trace['identifier'] === identifier));
                }
            },
            'deactivation': {
                type: String,
                validate: async function (this: Document) {
                    const traces: LeanDocument<IProcessTraceModel>[] = await FetchProcessTraces({ filters: { process: this.$parent()!.get('process'), type: 'deactivation' } }, this.$session());
                    const identifier: Maybe<Identifier> = this.get('deactivation');
                    return ((traces.length === 0) && !identifier) || (identifier && traces.find((trace: LeanDocument<IProcessTraceModel>) => trace['identifier'] === identifier));
                }
            }
        },
        required: true,
        default: {},
        _id: false
    }
}, { collection: PROCESS_COLLECTION_NAME });

ProcessSchema.pre('validate', async function (next: (error?: NativeError) => void) {
    // TODO: Verify options
    next();
});

export interface IProcessModel extends Document, IProcessSchema { };