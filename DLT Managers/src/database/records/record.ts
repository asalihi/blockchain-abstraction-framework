import { IAbstractedRecordSchema, IAbstractedRecordModel } from './abstracted/record';
import { IRawRecordSchema, IRawRecordModel } from './raw/record';
import { AbstractedRecord, RawRecord } from '@service/database/schemata';

export type SupportedRecordSchema = IAbstractedRecordSchema | IRawRecordSchema;
export type SupportedRecordModel = IAbstractedRecordModel | IRawRecordModel;
export const SupportedRecordModels = {
    'abstracted': AbstractedRecord,
    'raw': RawRecord
};
export const SupportedRecords: string[] = Object.keys(SupportedRecordModels);

export * from './submissions/submission';
export * from './record.controller';
export * from './record.interface';
export * from './record.model';
export * from './abstracted/record';
export * from './raw/record';