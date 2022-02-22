import { Identifier, RecordType } from 'core';
import { IRecordSchema } from '../record.interface';

export interface IAbstractedRecordSchema extends IRecordSchema {
    context: 'abstracted',
    type: RecordType,
    transaction?: Identifier,
    creator?: Identifier
}