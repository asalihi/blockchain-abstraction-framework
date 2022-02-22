import { DurationCondition, DurationConditionDefinition, PartialDurationCondition } from '@core/index';
import { DistributiveExtension, DistributivePickValues, HTTPEndpoint, HTTPMethod, HTTPHeaders, HTTPParameters } from '@core/types/types';
import { CryptographyConditionDefinition, CryptographyCondition, PartialCryptographyCondition } from './cryptography';
import { DateConditionDefinition, DateCondition, PartialDateCondition, TimeConditionDefinition, TimeCondition, PartialTimeCondition, DatetimeConditionDefinition, DatetimeCondition, PartialDatetimeCondition } from './datetime';
import { NumberConditionDefinition, NumberCondition, PartialNumberCondition } from './number';
import { StringConditionDefinition, StringCondition, PartialStringCondition } from './string';

export type HTTPRequestConditionOptions = {};
export type RequestType = { 'type': 'request', 'request': { 'endpoint': HTTPEndpoint, 'method': HTTPMethod, 'headers'?: HTTPHeaders, 'parameters'?: HTTPParameters, 'options'?: HTTPRequestConditionOptions } };
export type RequestAndResponseType<V> = RequestType & { 'value': V };
export type TemplateType = { 'type': 'template', 'template': string };
export type InstantiatedTemplateType<V> = TemplateType & { 'value': V };
export type RawValueType<V> = { 'type': 'value', 'value': V };
export type SupportedPropertyTypeDefinition<V> = RequestType | TemplateType | RawValueType<V>;
export type SupportedPropertyType<V> = RequestAndResponseType<V> | InstantiatedTemplateType<V> | RawValueType<V>;
export type SupportedCondition = DistributivePickValues<ExecutionCondition, 'condition'>;
export type ExecutionCondition = CryptographyCondition | DateCondition | TimeCondition | DatetimeCondition |DurationCondition | NumberCondition | StringCondition;
export type PartialExecutionCondition = PartialCryptographyCondition | PartialDateCondition | PartialTimeCondition | PartialDatetimeCondition | PartialDurationCondition | PartialNumberCondition | PartialStringCondition;
export type ExecutionConditionDefinition = CryptographyConditionDefinition | DateConditionDefinition | TimeConditionDefinition | DatetimeConditionDefinition | DurationConditionDefinition | NumberConditionDefinition | StringConditionDefinition;

export type ListOfExecutionConditionDefinitions = ExecutionConditionDefinition[];
export type ListOfExecutionConditions = ExecutionCondition[];

export type VerifiedExecutionCondition = DistributiveExtension<ExecutionCondition, { 'validation': true }> | DistributiveExtension<ExecutionCondition, { 'validation': false, 'error'?: string }>;
export type ListOfVerifiedExecutionConditions = VerifiedExecutionCondition[];

export * from './cryptography';
export * from './datetime';
export * from './number';
export * from './string';