import { Document } from 'mongoose';

import { MongooseSchema } from 'core';
import { ContractStateValues } from 'core';
import { IContractSchema } from './contract.interface';

export const CONTRACT_COLLECTION_NAME: string = 'smart-contracts';

export const ContractSchema: MongooseSchema = new MongooseSchema({
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
    'state': {
        type: String,
        required: true,
        enum: ContractStateValues
    },
    'metadata': {
        type: MongooseSchema.Types.Mixed,
        required: false
    },
    'options': {
        type: MongooseSchema.Types.Mixed,
        required: false
    },
    'versions': {
        type: [{ type: String }],
        required: true,
        default: []
    }
}, { collection: CONTRACT_COLLECTION_NAME });

export interface IContractModel extends Document, IContractSchema { };