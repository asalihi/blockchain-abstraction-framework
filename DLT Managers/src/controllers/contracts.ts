import { Identifier, DLTNetwork, ContractInvocationType } from 'core';

import { DeployFabricContract, InvokeFabricContract, DeployEthereumContract, InvokeEthereumContract } from '@service/controllers/connectors/connectors';

export async function DeployTemplateContract(network: DLTNetwork, instance: Identifier, contract: Identifier, version: Identifier): Promise<boolean> {
    switch(network) {
        case 'ethereum': return await DeployEthereumContract(instance, contract, version);
        case 'fabric': return await DeployFabricContract(instance, contract, version);
        default: throw new Error('Unsupported network');
    }
}

export async function InvokeTemplateContract(network: DLTNetwork, instance: Identifier, type: ContractInvocationType, contract: Identifier, version: Identifier, fn: string, parameters: any[] = []): Promise<any> {
    switch(network) {
        case 'ethereum': return await InvokeEthereumContract(instance, type, contract, version, fn, parameters);
        case 'fabric': return await InvokeFabricContract(instance, type, contract, version, fn, parameters);
        default: throw new Error('Unsupported network');
    }
}