import { Identifier, ContractManagementType } from 'core';
import { IContractOperationSchema } from '../operation.interface';

export interface IContractManagementSchema extends IContractOperationSchema {
    context: 'management',
    type: ContractManagementType,
    caller: Identifier
}