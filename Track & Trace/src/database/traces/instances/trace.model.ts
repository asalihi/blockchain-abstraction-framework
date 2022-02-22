import { Document, NativeError } from 'mongoose';

import { ExecutionInstanceTraceTypeValues, MongooseSchema } from 'core';
import { IExecutionInstanceTraceSchema } from './trace.interface';
import { ExecutionInstanceTrace } from '@service/database/schemata';

export const ExecutionInstanceTraceSchema: MongooseSchema = new MongooseSchema({
    'instance': {
        type: String,
        required: true
    },
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
        enum: ExecutionInstanceTraceTypeValues
    }
});

export interface IExecutionInstanceTraceModel extends Document, IExecutionInstanceTraceSchema { };

ExecutionInstanceTraceSchema.pre('validate', async function (this: IExecutionInstanceTraceModel, next: (error?: NativeError) => void) {
    if (await ExecutionInstanceTrace.findOne({ instance: this.instance, type: this.type }).session(this.$session())) {
        return next(new Error(`A trace of type '${this.type}' was already registered for instance '${this.instance}'`));
    }

    if ((this.type === 'activation') && !(await ExecutionInstanceTrace.findOne({ instance: this.instance, type: 'creation' }).session(this.$session()))) {
        return next(new Error(`A trace of type '${this.type}' could not be registered as instance '${this.instance}' has not been created yet`));
    }

    if ((['deviation', 'termination'].includes(this.type)) && !(await ExecutionInstanceTrace.findOne({ instance: this.instance, type: 'activation' }).session(this.$session()))) {
        return next(new Error(`A trace of type '${this.type}' could not be registered as instance '${this.instance}' has not been activated yet`));
    }

    if ((['deviation', 'termination', 'cancelation'].includes(this.type)) && (await ExecutionInstanceTrace.findOne({ instance: this.instance, type: { $in: ['termination', 'cancelation'] } }).session(this.$session()))) {
        return next(new Error(`A trace of type '${this.type}' could not be registered as instance '${this.instance}' was already stopped`));
    }

    return next();
});