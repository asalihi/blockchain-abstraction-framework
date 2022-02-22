import { has } from 'lodash';
import { Document, NativeError } from 'mongoose';

import { MongooseSchema, ProcessElementTraceTypeValues, RegisteredData, RetrieveData } from 'core';
import { IProcessElementTraceSchema } from './trace.interface';
import { IProcessVersionModel, GetProcessVersionEntry } from '../../versions/version';
import { ExecutionInstanceTrace } from '@service/database/schemata';
import { IExecutionInstanceModel } from '../../instances/instance.model';
import { GetExecutionInstanceEntry } from '../../instances/instance.controller';

export const ProcessElementTraceSchema: MongooseSchemaSchema = new MongooseSchemaSchema({
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
    'element': {
        type: String,
        required: true
    },
    'resources': {
        type: {
            'options': {
                type: String,
                required: false
            },
            'data': {
                type: String,
                required: false
            },
            'verifications': {
                type: String,
                required: false
            }
        },
        required: true,
        default: {},
        _id: false
    },
    'type': {
        type: String,
        required: true,
        enum: ProcessElementTraceTypeValues
    }
});

ProcessElementTraceSchema.pre('validate', async function (this: IProcessElementTraceModel, next: (error?: NativeError) => void) {
    // TODO: Handle errors
    try {
        if (!(await ExecutionInstanceTrace.findOne({ instance: this.instance, type: 'activation' }).session(this.$session()))) {
            return next(new Error(`A trace of type '${this.type}' for element '${this.element}' could not be registered as instance '${this.instance}' was not activated yet`));
        }

        if (this.isNew && await ExecutionInstanceTrace.findOne({ instance: this.instance, type: { $in: ['deviation', 'termination', 'cancelation'] } }).session(this.$session())) {
            return next(new Error(`A trace of type '${this.type}' for element '${this.element}' could not be registered as instance '${this.instance}' was deviated/terminated/canceled`));
        }

        // TODO: Consider ignoring this verification as it should have been handled already
        if (this.type !== 'invalid_element') {
            const execution_instance_entry: IExecutionInstanceModel = await GetExecutionInstanceEntry(this.instance, this.$session());
            const instance_has_deviated: boolean = (this.type === 'deviation') || !!execution_instance_entry.get('deviation');

            if (!instance_has_deviated) {
                const process_version_entry: IProcessVersionModel = await GetProcessVersionEntry(this.process, this.version, this.$session());
                const process_version_model: RegisteredData = await RetrieveData(process_version_entry.get('resources.file'));
                if (!has(process_version_model['data']['tree'], `tasks.${this.element}`) && !has(process_version_model['data']['tree'], `events.${this.element}`)) {
                    return next(new Error(`A trace of type '${this.type}' could not be registered as element '${this.element}' does not exist in process version related to instance '${this.instance}'`));
                }
            }
        }

        return next();
    } catch { return next(new Error(`An error occurred during validation of trace for element '${ this.element }' of instance '${this.instance}'`)) }
});

export interface IProcessElementTraceModel extends Document, IProcessElementTraceSchema { };