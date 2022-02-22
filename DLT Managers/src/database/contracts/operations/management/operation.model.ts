import { Document, Schema } from 'mongoose';

import { MongooseSchema } from 'core';
import { ContractManagementTypeValues } from 'core';
import { IContractManagementSchema } from './operation.interface';

export const ContractManagementSchema: MongooseSchema = new MongooseSchema({
    'type': {
        type: String,
        required: true,
        enum: ContractManagementTypeValues
    },
    'caller': {
        type: String,
        required: true
    }
});

export interface IContractManagementModel extends Document, IContractManagementSchema { };