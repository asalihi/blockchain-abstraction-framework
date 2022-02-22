import { Document, NativeError } from 'mongoose';

import { MongooseSchema, Nullable, ProcessTraceTypeValues } from 'core';
import { IProcessTraceSchema } from './trace.interface';
import { ProcessTrace } from '@service/database/schemata';

export const ProcessTraceSchema: MongooseSchema = new MongooseSchema({
    'process': {
        type: String,
        required: true
    },
    'type': {
        type: String,
        required: true,
        enum: ProcessTraceTypeValues
    }
});

ProcessTraceSchema.pre('validate', async function (this: IProcessTraceModel, next: (error?: NativeError) => void) {
    const trace: Nullable<IProcessTraceModel & Document> = await ProcessTrace.findOne({ process: this.process, type: this.type }).session(this.$session()) as IProcessTraceModel;
    trace ? next(new Error(`A trace of type '${ this.type }' was already registered for process '${ this.process }'`)) : next();
});

export interface IProcessTraceModel extends Document, IProcessTraceSchema { };