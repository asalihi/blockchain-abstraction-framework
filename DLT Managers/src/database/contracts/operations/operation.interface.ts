import { Identifier, ContractReference, ContractOperationType } from 'core';

export interface IContractOperationSchema {
    identifier: Identifier,
    type: ContractOperationType,
    contract: ContractReference,
    date: number,
    reference?: Identifier
}