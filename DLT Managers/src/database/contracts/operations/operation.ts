import { IContractInvocationSchema, IContractInvocationModel } from './invocation/operation';
import { IContractManagementSchema, IContractManagementModel } from './management/operation';
import { IRawContractOperationSchema, IRawContractOperationModel } from './raw/operation';
import { ContractInvocation, ContractManagement, RawContractOperation } from '@service/database/schemata';

export type SupportedContractOperationSchema = IContractInvocationSchema | IContractManagementSchema | IRawContractOperationSchema;
export type SupportedContractOperationModel = IContractInvocationModel | IContractManagementModel | IRawContractOperationModel;
export const SupportedContractOperationModels = {
    'invocation': ContractInvocation,
    'management': ContractManagement,
    'raw': RawContractOperation
};
export const SupportedContractOperations: string[] = Object.keys(SupportedContractOperationModels);

export * from './operation.controller';
export * from './operation.interface';
export * from './operation.model';
export * from './invocation/operation';
export * from './management/operation';
export * from './raw/operation';
export * from './tasks/task';