import { Identifier, ContractInvocationType, ContractInvocationParameters } from 'core';
import { IContractOperationSchema } from '../operation.interface';

export interface IContractInvocationSchema extends IContractOperationSchema {
    context: 'invocation',
    type: ContractInvocationType,
    function: Identifier,
    parameters?: ContractInvocationParameters,
    response?: any,
    caller: Identifier
}