import { Identifier, Signature, Timestamp, TraceDLTReference, TrackAndTraceTraceContext } from 'core';

export interface ITrackAndTraceTraceSchema {
    'identifier': Identifier,
    'context': TrackAndTraceTraceContext,
    'timestamp': Timestamp,
    'signature': Signature,
    'reference': TraceDLTReference
}