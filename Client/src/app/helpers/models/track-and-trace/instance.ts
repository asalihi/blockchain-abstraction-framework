const InstanceStateValues = ['inactive', 'running', 'finished', 'cancelled', 'error'];
type InstanceState = typeof InstanceStateValues[number];

export const InstanceStateActionValues = ['activation', 'deactivation', 'cancelation'];
export type InstanceStateActions = typeof InstanceStateActionValues[number];

export interface IInstanceParameters {
  'process'?: string,
  'version'?: string,
  'instance': string,
  'data'?: Object,
  'options'?: Object
}

export interface IInstanceParametersWithProcessAndVersion extends IInstanceParameters { 'process': string, 'version': string };

export interface IInstanceTraces {
  'creation'?: string,
  'start'?: string,
  'updates'?: string[],
  'deviation'?: string,
  'stop'?: string
};

export interface IInstance {
  'process': string,
  'version': string,
  'instance': string,
  'state': InstanceState,
  'creation': number,
  'start'?: number,
  'end'?: number,
  'signature': string,
  'traces'?: IInstanceTraces
}

export interface IListOfInstances {
  'items': number,
  'pages': number,
  'current': number,
  'size': number,
  'instances': IInstance[]
}

export interface IInstanceStatistics {
  'total': number,
  'active'?: number
}


