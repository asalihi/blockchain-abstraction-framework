import { Identifier } from '@core/types/types';

export const TraceTypeValues = ['generic'];
export type TraceType = typeof TraceTypeValues[number];
export const DLTReferenceStateValues = ['waiting', 'saved', 'error', 'timeout'];
export type DLTReferenceState = typeof DLTReferenceStateValues[number];
export type TraceDLTReference = { 'platform': 'N/A' | Identifier, 'identifier': 'N/A' | Identifier, 'state': DLTReferenceState };