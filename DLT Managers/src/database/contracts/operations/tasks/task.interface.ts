import { GenericObject, Identifier, ContractOperationTaskActions, ContractOperationTaskOptions, ContractOperationTaskState } from 'core';

export interface IContractOperationTaskSchema {
    identifier: Identifier,
    instance: Identifier,
    network: Identifier,
    registration: number,
    operation: Identifier,
    actions?: ContractOperationTaskActions,
    options?: ContractOperationTaskOptions,
    state: ContractOperationTaskState,
    metadata?: GenericObject
}