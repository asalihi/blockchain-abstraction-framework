import { GenericObject, Identifier, DLTNetwork, DLT_NETWORKS } from "core";

import { DeployFabricInstance, DeployEthereumInstance } from '@service/controllers/connectors/connectors';

export async function DeployInstance(identifier: Identifier, network: DLTNetwork, configuration?: GenericObject): Promise<void> {
    switch(network) {
        case 'ethereum': return await DeployEthereumInstance(identifier, configuration);
        case 'fabric': return await DeployFabricInstance(identifier, configuration);
        default: throw new Error('Unsupported network');
    }
}