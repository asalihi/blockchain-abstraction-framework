import { Identifier, Signature, Timestamp, TraceType, TraceDLTReference } from '@core/types/types';

export interface ITraceSchema {
    'identifier': Identifier,
    'type': TraceType,
    'timestamp': Timestamp,
    'signature': Signature,
    'reference': TraceDLTReference
}