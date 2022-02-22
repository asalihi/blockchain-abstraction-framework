import { Document, Schema } from 'mongoose';

import { MongooseSchema } from 'core';
import { ContractInvocationTypeValues } from 'core';
import { IContractInvocationSchema } from './operation.interface';

export const ContractInvocationSchema: MongooseSchema = new MongooseSchema({
    'type': {
        type: String,
        required: true,
        enum: ContractInvocationTypeValues
    },
    'function': {
        type: String,
        required: true
    },
    'parameters': {
        type: Schema.Types.Mixed,
        required: false
    },
    'response': {
        type: Schema.Types.Mixed,
        required: false
    },
    'caller': {
        type: String,
        required: true
    }
});

export interface IContractInvocationModel extends Document, IContractInvocationSchema { };