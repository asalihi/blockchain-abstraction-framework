import { Identifier, ContractOperationType } from 'core';
import { IContractOperationSchema } from '../operation.interface';

export interface IRawContractOperationSchema extends IContractOperationSchema {
    context: 'raw',
    type: ContractOperationType,
    submission: any
}