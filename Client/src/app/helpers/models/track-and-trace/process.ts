import { IVersionParameters } from '@client/helpers/models/track-and-trace/version';

const ProcessStateValues = ['active', 'deactivated'];
type ProcessState = typeof ProcessStateValues[number];

export interface IProcess {
  'identifier': string,
  'state': ProcessState,
  'creation': number,
  'deactivation'?: number,
  'versions': string[],
  'traces': { 'creation': string, 'deactivation'?: string }
}

export type IProcessInformation = Omit<IProcess, 'versions'> & { 'versions': number };

export interface IListOfProcesses {
  'items': number,
  'pages': number,
  'current': number,
  'size': number,
  'processes': IProcessInformation[]
}

export interface IProcessWithVersions {
  'process': string,
  'versions': IVersionParameters[],
  'data'?: Object,
  'options'?: Object
}

export interface IProcessStatistics {
    'total': number
}
