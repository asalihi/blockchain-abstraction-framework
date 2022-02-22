import { Identifier, ContractTemplateState, PlatformSupportingContractTemplate, ContractInterface } from 'core';

export interface IContractTemplateSchema {
    identifier: Identifier,
    name: string,
    version: number,
    state: ContractTemplateState,
    platforms: PlatformSupportingContractTemplate[],
    description: string,
    interface: ContractInterface
}