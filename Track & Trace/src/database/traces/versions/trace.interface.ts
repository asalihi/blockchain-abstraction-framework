import { Identifier, ProcessTraceType } from 'core';
import { ITrackAndTraceTraceSchema } from '../trace.interface';

export interface IProcessVersionTraceSchema extends ITrackAndTraceTraceSchema {
    context: 'version',
    process: Identifier,
    version: Identifier,
    type: ProcessTraceType
}