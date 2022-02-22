import { Identifier } from 'core';
import { IRecordSubmissionSchema } from '../submission.interface';

export interface IAbstractedRecordSubmissionSchema extends IRecordSubmissionSchema {
    type: 'abstracted',
    record: Identifier
}