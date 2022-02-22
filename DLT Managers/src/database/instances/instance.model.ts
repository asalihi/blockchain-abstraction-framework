import { Document } from 'mongoose';

import { MongooseSchema, DLT_NETWORKS, DLTInstanceState } from 'core';
import { IDLTInstanceSchema } from './instance.interface';

export const DLT_INSTANCE_COLLECTION_NAME: string = 'dlt-instances';

export const DLTInstanceSchema: MongooseSchema = new MongooseSchema({
    'identifier': {
        type: String,
        unique: true,
        required: true
    },
    'creation': {
        type: Number,
        required: true
    },
    'desactivation': {
        type: Number
    },
    'state': {
        type: String,
        required: true,
        enum: Object.values(DLTInstanceState)
    },
    'network': {
        type: String,
        required: true,
        enum: DLT_NETWORKS
    },
    'configuration': {
        type: MongooseSchema.Types.Mixed,
        required: false
    },
    'profile': {
        type: MongooseSchema.Types.ObjectId,
        ref: 'DLTInstanceProfile'
    }
}, { discriminatorKey: 'network', collection: DLT_INSTANCE_COLLECTION_NAME });

export interface IDLTInstanceModel extends Document, IDLTInstanceSchema { };