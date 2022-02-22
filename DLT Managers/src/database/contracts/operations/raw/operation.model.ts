import { Document, Schema } from 'mongoose';

import { MongooseSchema } from 'core';
import { ContractInvocationTypeValues, ContractManagementTypeValues } from 'core';
import { IRawContractOperationSchema } from './operation.interface';

export const RawContractOperationSchema: MongooseSchema = new MongooseSchema({
    'type': {
        type: String,
        required: true,
        enum: [...ContractInvocationTypeValues, ...ContractManagementTypeValues]
    },
    'submission': {
        type: MongooseSchema.Types.Mixed,
        required: true
    }
});

export interface IRawContractOperationModel extends Document, IRawContractOperationSchema { };