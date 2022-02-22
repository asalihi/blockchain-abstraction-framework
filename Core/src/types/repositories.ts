import { Identifier } from "./core";

export const RepositoryStateValues = ['active', 'deactivated'];
export type RepositoryState = typeof RepositoryStateValues[number];
export type Repository = { 'identifier': Identifier, 'name': string, 'description'?: string, 'creation': number, 'custodian': Identifier, 'state': RepositoryState, 'entries': Identifier[] };