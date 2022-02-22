import { Identifier } from 'core';
import { IRecordSchema } from '../record.interface';

export interface IRawRecordSchema extends IRecordSchema {
    context: 'raw',
    transaction?: Identifier
}