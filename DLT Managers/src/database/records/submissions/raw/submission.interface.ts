import { Identifier } from 'core';
import { IRecordSubmissionSchema } from '../submission.interface';

export interface IRawRecordSubmissionSchema extends IRecordSubmissionSchema {
    type: 'raw',
    record: Identifier
}