import { IAbstractedRecordSubmissionSchema, IAbstractedRecordSubmissionModel } from './abstracted/submission';
import { IRawRecordSubmissionSchema, IRawRecordSubmissionModel } from './raw/submission';
import { AbstractedRecordSubmission, RawRecordSubmission } from '@service/database/schemata';

export type SupportedRecordSubmissionSchema = IAbstractedRecordSubmissionSchema | IRawRecordSubmissionSchema;
export type SupportedRecordSubmissionModel = IAbstractedRecordSubmissionModel | IRawRecordSubmissionModel;
export const SupportedRecordSubmissionModels = {
    'abstracted': AbstractedRecordSubmission,
    'raw': RawRecordSubmission
};
export const SupportedRecordSubmissions: string[] = Object.keys(SupportedRecordSubmissionModels);

export * from './submission.controller';
export * from './submission.interface';
export * from './submission.model';
export * from './abstracted/submission';
export * from './raw/submission';