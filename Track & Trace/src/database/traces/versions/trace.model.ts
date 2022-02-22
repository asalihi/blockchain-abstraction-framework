import { Document, NativeError } from 'mongoose';

import { Nullable, ProcessTraceTypeValues, MongooseSchema } from 'core';
import { IProcessVersionTraceSchema } from './trace.interface';
import { ProcessVersionTrace } from '@service/database/schemata';

export const ProcessVersionTraceSchema: MongooseSchema = new MongooseSchema({
    'process': {
        type: String,
        required: true
    },
    'version': {
        type: String,
        required: true
    },
    'type': {
        type: String,
        required: true,
        enum: ProcessTraceTypeValues
    }
});

ProcessVersionTraceSchema.pre('validate', async function (this: IProcessVersionTraceModel, next: (error?: NativeError) => void) {
    const trace: Nullable<IProcessVersionTraceModel & Document> = await ProcessVersionTrace.findOne({ process: this.process, version: this.version, type: this.type }).session(this.$session()) as IProcessVersionTraceModel;
    trace ? next(new Error(`A trace of type '${this.type}' was already registered for version '${this.version}' of process '${this.process}'`)) : next();
});

export interface IProcessVersionTraceModel extends Document, IProcessVersionTraceSchema { };