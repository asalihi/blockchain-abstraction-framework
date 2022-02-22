import { GenericObject, Identifier, Timestamp, Transaction, DLTIdentity } from '@core/types/types';

/* RECORD */
export const RecordStateValues = ['unsigned', 'signed', 'submitted', 'validated', 'invalid'];
export type RecordState = typeof RecordStateValues[number];

export const RecordTypeValues = ['transfers', 'information'];
export type RecordType = typeof RecordTypeValues[number];

export type RawRecord = { identifier: Identifier, instance: Identifier, state: RecordState, transaction?: Identifier };
export type AbstractedRecord = { identifier: Identifier, instance: Identifier, state: RecordState, type: RecordType, transaction?: Identifier, creator?: Identifier };
export type Record = RawRecord | AbstractedRecord;

/* RECORD SUBMISSION */
export const RecordSubmissionStateValues = ['pending', 'ongoing', 'completed', 'error'];
export type RecordSubmissionState = typeof RecordSubmissionStateValues[number];
export type RecordSubmissionActions = GenericObject;
export type RecordSubmissionOptions = GenericObject;
export type RecordSubmissionBase = { identifier: Identifier, registration: Timestamp, actions?: RecordSubmissionActions, options?: RecordSubmissionOptions, state: RecordSubmissionState, metadata?: GenericObject };
export type AbstractedRecordSubmission = RecordSubmissionBase & { record: AbstractedRecord };
export type RawRecordSubmission = RecordSubmissionBase & { record: RawRecord };
export type RecordSubmission = AbstractedRecordSubmission | RawRecordSubmission;