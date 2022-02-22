import config from 'config';
import Web3 from 'web3';
import { isEmpty } from 'lodash';

import { ExecuteCommand, ReplaceSpacesAndRemoveUppercases, ETHEREUM_FOLDER_FOR_DEPLOYED_NETWORKS } from 'core';
import { RemoveEthereumContractListeners, SetupEthereumContracts } from './contracts';
import { EthereumNetwork, GetDLTInstanceEntry } from '@service/database/schemata';
import { IEthereumNetworkModel } from '@service/database/instances/networks/ethereum/ethereum.model';

// TODO: Handle multiple platform, relying on data stored in DB

export let ENDPOINT: Web3;

export async function SetupEthereumManager(): Promise<void> {
	InstallGethIfMissing();
    await Initialize();
}                 

export function InstallGethIfMissing(): void {
    if (isEmpty(ExecuteCommand(`bash -c 'which geth'`))) {
        console.log('Installing ethereum tools...');
        ExecuteCommand(`add-apt-repository -y ppa:ethereum/ethereum`);
        ExecuteCommand(`apt-get update`);
        ExecuteCommand(`apt-get install ethereum -y`);
        // We assume truffle and solc are not installed neither, so we proceed with their installation
        // TODO: Handle this case better
        ExecuteCommand(`npm install -g truffle`);
        ExecuteCommand(`npm install -g solc`);
        console.log('Ethereum tools installed successfully');
    }
}

async function Initialize(): Promise<void> {
    const installed_platforms: number = await EthereumNetwork.countDocuments({});
    if(installed_platforms > 0) {
        const ethereum_instance: IEthereumNetworkModel = await GetDLTInstanceEntry(config.get('blockchain.ethereum.identifier'), 'ethereum') as IEthereumNetworkModel;
        const ethereum_instance_configuration = ethereum_instance.get('configuration');
        const provider = new Web3.providers.WebsocketProvider(config.get('blockchain.ethereum.provider'), {
            reconnect: {
                auto: true,
                delay: 5000,
                maxAttempts: 5,
                onTimeout: false,
            },
        });
        ENDPOINT = new Web3(provider);
        await UnlockAccount(ethereum_instance_configuration['account'], ethereum_instance_configuration['password']);
        await SetupEthereumContracts(config.get('blockchain.ethereum.identifier'));
    }
}

async function Shutdown(): Promise<void> {
    try {
        if(ENDPOINT) {
            RemoveEthereumContractListeners();
            ExecuteCommand(`geth attach ${ config.get('blockchain.ethereum.ipc') } --exec "loadScript('${ETHEREUM_FOLDER_FOR_DEPLOYED_NETWORKS}/${ReplaceSpacesAndRemoveUppercases(identifier)}/data/geth.ipc --exec "loadScript('${ETHEREUM_FOLDER_FOR_DEPLOYED_NETWORKS}/${ReplaceSpacesAndRemoveUppercases(config.get('blockchain.ethereum.identifier'))}/scripts/stop-miner.js')"`);
        }
    } catch (error) {
        console.error('[ETHEREUM] An error occurred during shutdown');
        console.error(error);
    }
}

export async function UnlockAccount(account: string, password: string): Promise<void> {
    await ENDPOINT.eth.personal.unlockAccount(account, password, 0);
}

export { Initialize as InitializeEthereumConnector, Shutdown as ShutdownEthereumConnector };