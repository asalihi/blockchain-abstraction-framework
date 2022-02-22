import { Document } from 'mongoose';

import { MongooseSchema } from 'core';
import { ContractTemplateStateValues } from 'core';
import { IContractTemplateSchema } from './template.interface';

export const CONTRACT_TEMPLATE_COLLECTION_NAME: string = 'smart-contract-templates';

export const ContractTemplateSchema: MongooseSchema = new MongooseSchema({
    'identifier': {
        type: String,
        required: true,
        unique: true
    },
    'name': {
        type: String,
        required: true
    },
    'version': {
        type: Number,
        required: false
    },
    'state': {
        type: String,
        required: true,
        enum: ContractTemplateStateValues
    },
    'platforms': {
        type: [MongooseSchema.Types.Mixed],
        required: true,
        default: []
    },
    'description': {
        type: String,
        required: true
    },
    'interface': {
        type: MongooseSchema.Types.Mixed,
        required: true
    }
}, { collection: CONTRACT_TEMPLATE_COLLECTION_NAME });

// TODO: Validate interface and platforms fields

export interface IContractTemplateModel extends Document, IContractTemplateSchema { };