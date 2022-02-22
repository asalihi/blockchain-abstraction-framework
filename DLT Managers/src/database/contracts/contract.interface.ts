import { GenericObject, Identifier, ContractState, ContractOptions } from 'core';

export interface IContractSchema {
    identifier: Identifier,
    instance: Identifier,
    network: Identifier,
    state: ContractState,
    metadata?: GenericObject,
    options?: ContractOptions,
    versions: Identifier[]
}