import { Document } from 'mongoose';

import { MongooseSchema } from 'core';
import { IAbstractedRecordSubmissionSchema } from './submission.interface';

export const AbstractedRecordSubmissionSchema: MongooseSchema = new MongooseSchema({
    'record': {
        type: String,
        required: true
    }
});

export interface IAbstractedRecordSubmissionModel extends Document, IAbstractedRecordSubmissionSchema { };