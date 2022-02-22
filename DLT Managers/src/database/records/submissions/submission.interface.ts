import { GenericObject, Identifier, RecordSubmissionActions, RecordSubmissionOptions, RecordSubmissionState } from 'core';

export interface IRecordSubmissionSchema {
    identifier: Identifier,
    registration: string,
    actions?: RecordSubmissionActions,
    options?: RecordSubmissionOptions,
    state: RecordSubmissionState,
    metadata?: GenericObject
}