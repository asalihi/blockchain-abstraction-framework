import { Identifier, ProcessTraceType } from 'core';
import { ITrackAndTraceTraceSchema } from '../trace.interface';

export interface IProcessTraceSchema extends ITrackAndTraceTraceSchema {
    'context': 'process',
    'process': Identifier,
    'type': ProcessTraceType
}