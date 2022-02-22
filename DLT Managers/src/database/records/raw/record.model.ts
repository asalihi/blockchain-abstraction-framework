import { Document } from 'mongoose';

import { MongooseSchema } from 'core';
import { IRawRecordSchema } from './record.interface';

export const RawRecordSchema: MongooseSchema = new MongooseSchema({
    'transaction': {
        type: String,
        required: false
    }
});

export interface IRawRecordModel extends Document, IRawRecordSchema { };