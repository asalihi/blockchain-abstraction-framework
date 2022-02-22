import { Identifier, RecordState } from 'core';

export interface IRecordSchema {
    identifier: Identifier,
    instance: Identifier,
    state: RecordState
}