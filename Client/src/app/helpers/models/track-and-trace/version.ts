const VersionStateValues = ['active', 'deactivated'];
type VersionState = typeof VersionStateValues[number];

export interface IVersionParameters {
  identifier: string,
  file: string,
  data?: Object,
  options?: Object
}

export type ProcessVersionTraces = { 'creation'?: string, 'deactivation'?: string };
export type ProcessVersionDataReferences = { 'creation'?: any, 'deactivation'?: any };
export type ProcessVersionResources = { 'file': any, 'data'?: ProcessVersionDataReferences, 'options'?: any };

export interface IVersion {
  'process': string,
  'version': string,
  'state': VersionState,
  'creation': number,
  'deactivation'?: number,
  'signature': string,
  'instances': string[],
  'traces': ProcessVersionTraces,
  'resources': ProcessVersionResources
}

export type IVersionInformation = Omit<IVersion, 'instances'> & { 'instances': number };

export interface IListOfVersions {
  'items': number,
  'pages': number,
  'current': number,
  'size': number,
  'versions': IVersionInformation[]
}



