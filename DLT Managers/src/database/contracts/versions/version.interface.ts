import { Identifier, ContractState } from 'core';

export interface IContractVersionSchema {
    contract: Identifier,
    version: Identifier,
    reference?: Identifier,
    state: ContractState
}