import { Document } from 'mongoose';

import { MongooseSchema } from 'core';
import { ContractOperationTaskStateValues } from 'core';
import { IContractOperationTaskSchema } from './task.interface';

export const CONTRACT_OPERATION_TASK_COLLECTION_NAME: string = 'smart-contract-operation-tasks';

export const ContractOperationTaskSchema: MongooseSchema = new MongooseSchema({
    'identifier': {
        type: String,
        required: true,
        unique: true
    },
    'instance': {
        type: String,
        required: true
    },
    'network': {
        type: String,
        required: true
    },
    'actions': {
        type: MongooseSchema.Types.Mixed,
        required: false
    },
    'options': {
        type: MongooseSchema.Types.Mixed,
        required: false
    },
    'state': {
        type: String,
        required: true,
        enum: ContractOperationTaskStateValues
    },
    'metadata': {
        type: MongooseSchema.Types.Mixed,
        required: false
    }
}, { collection: CONTRACT_OPERATION_TASK_COLLECTION_NAME });

export interface IContractOperationTaskModel extends Document, IContractOperationTaskSchema { };