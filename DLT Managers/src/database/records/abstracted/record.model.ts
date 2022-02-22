import { Document } from 'mongoose';

import { MongooseSchema } from 'core';
import { RecordTypeValues } from 'core';
import { IAbstractedRecordSchema } from './record.interface';

export const AbstractedRecordSchema: MongooseSchema = new MongooseSchema({
    'type': {
        type: String,
        required: true,
        enum: RecordTypeValues
    },
    'transaction': {
        type: String,
        required: false
    },
    'creator': {
        type: String,
        required: false
    }
});

export interface IAbstractedRecordModel extends Document, IAbstractedRecordSchema { };