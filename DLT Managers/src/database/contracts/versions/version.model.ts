import { Document } from 'mongoose';

import { MongooseSchema } from 'core';
import { ContractStateValues } from 'core';
import { IContractVersionSchema } from './version.interface';

export const CONTRACT_VERSION_COLLECTION_NAME: string = 'smart-contract-versions';

export const ContractVersionSchema: MongooseSchema = new MongooseSchema({
    'contract': {
        type: String,
        required: true
    },
    'version': {
        type: String,
        required: true
    },
    'reference': {
        type: String,
        required: false
    },
    'state': {
        type: String,
        required: true,
        enum: ContractStateValues
    }
}, { collection: CONTRACT_VERSION_COLLECTION_NAME });

ContractVersionSchema.index({ 'contract': 1, 'version': 1 }, { 'unique': true });

export interface IContractVersionModel extends Document, IContractVersionSchema { };