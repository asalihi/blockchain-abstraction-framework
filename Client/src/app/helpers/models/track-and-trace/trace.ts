export const ExecutionTraceTypeValues = ['end', 'cancelation', 'task'];
export const ExecutionTraceTypeOptions = [{ 'value': 'task', 'name': 'Task registration' }, { 'value': 'end', 'name': 'End of execution' }, { 'value': 'cancelation', 'name': 'Execution cancelation' }];
export type ExecutionTraceType = typeof ExecutionTraceTypeValues[number];
export const DLTReferenceStatusValues = ['waiting', 'saved', 'error', 'timeout'];
export type DLTReferenceStatus = typeof DLTReferenceStatusValues[number];
export type ExecutionTraceDLTReference = { 'platform': 'N/A' | string, 'identifier': 'N/A' | string, 'status': DLTReferenceStatus };
export const EventTypeValues = ['start', 'end'];
export type EventType = typeof EventTypeValues[number];
export type Event = { 'identifier': string, 'type': EventType };

export interface ITraceParameters {
  'task'?: string,
  'end'?: string,
  'data'?: Object,
  'options'?: Object
}

export interface ITrace {
  'identifier': string,
  'instance': string,
  'type': ExecutionTraceType,
  'task'?: string,
  'end'?: string,
  'data'?: any,
  'timestamp': number,
  'signature': string,
  'reference': ExecutionTraceDLTReference
}

export interface IListOfTraces {
  'items': number,
  'pages': number,
  'current': number,
  'size': number,
  'traces': ITrace[]
}


