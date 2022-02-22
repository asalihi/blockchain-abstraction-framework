import { Identifier } from '@core/types/types';

export type ConditionProperties = { [key: string]: any };
export type ConditionBase = { 'identifier': Identifier };

export type DescriptionOfConditionProperty = { 'key': Identifier, 'type': string, 'values': string[], 'description': string };
export type DescriptionOfConditionProperties = DescriptionOfConditionProperty[];
export type DescriptionOfCondition = { 'condition': Identifier, 'name': string, 'description': string, 'properties': DescriptionOfConditionProperties };
export type DescriptionOfConditions = DescriptionOfCondition[];

export * from './execution/conditions';
export * from './notifications/conditions';