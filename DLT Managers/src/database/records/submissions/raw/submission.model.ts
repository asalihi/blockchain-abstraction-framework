import { Document } from 'mongoose';

import { MongooseSchema } from 'core';
import { IRawRecordSubmissionSchema } from './submission.interface';

export const RawRecordSubmissionSchema: MongooseSchema = new MongooseSchema({
    'record': {
        type: String,
        required: true
    }
});

export interface IRawRecordSubmissionModel extends Document, IRawRecordSubmissionSchema { };