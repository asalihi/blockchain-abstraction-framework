import { v4 as uuidv4 } from 'uuid';
import config from 'config';
import { existsSync } from 'fs';
import { Contract, EventData } from 'web3-eth-contract';
import { Subscription } from 'web3-core-subscriptions';

import { Maybe, ReadFile, ReplaceSpacesAndRemoveUppercases, Sleep, ExecuteCommand, ETHEREUM_FOLDER_FOR_DEPLOYED_NETWORKS, ContractInvocationType, GenericObject, ETHEREUM_NETWORK_FOLDER } from 'core';
import { IContractModel, GetDLTInstanceEntry, GetContractEntry, CreateContractEntry, IEthereumNetworkModel, CreateContractVersionEntry, IContractVersionModel, CreateContractManagementEntry, CreateContractInvocationEntry, CreatContractOperationTaskEntry, IContractOperationTaskModel } from '@service/database/schemata';
import { ENDPOINT, UnlockAccount } from './controller';

let CONTRACTS: { [key: string]: Contract };
let LISTENERS: { [key: string]: { [key: string]: Subscription } };

async function DeployContract(instance_identifier: string, contract: string = 'KVStore', version: string = 'v1', location: string = `${ETHEREUM_NETWORK_FOLDER}/truffles/contracts`,): Promise<boolean> {
  // TODO: As we are in the case of a deployment of a smart contract template, location and other parameters should be fed more appropriately  
  
  try {  
        const smart_contract_path: string = `${location}/${contract}.sol`;
      if (!existsSync(smart_contract_path)) {
        console.log(`Path to smart contract does not exist: ${smart_contract_path}`);
        console.log('Aborting installation...');
        return false;
      } else {
        const instance: IEthereumNetworkModel = await GetDLTInstanceEntry(instance_identifier, 'ethereum') as IEthereumNetworkModel;
        const instance_configuration = instance.get('configuration');
        const genesis_block = JSON.parse(ReadFile(`${ETHEREUM_FOLDER_FOR_DEPLOYED_NETWORKS}/${ReplaceSpacesAndRemoveUppercases(instance_identifier)}/genesis.json`).toString());

        let parent_contract: IContractModel;
        try {
          parent_contract = await GetContractEntry(contract);
        } catch {
          // TODO: Make sure that the catched error is due to the absence of the entry in database
          parent_contract = await CreateContractEntry({ identifier: contract, instance: instance_identifier, network: 'ethereum' });
          await CreateContractManagementEntry({ identifier: uuidv4(), type: 'registration', contract: contract, date: Date.now(), caller: instance.get('configuration')['account'] });
        }

        const contract_version: IContractVersionModel = await CreateContractVersionEntry({ contract: contract, version: version });

        parent_contract.state('state', 'installing');
        await parent_contract.save();
        contract_version.state('state', 'installing');
        await contract_version.save();
        
        ExecuteCommand(`geth attach ${ETHEREUM_FOLDER_FOR_DEPLOYED_NETWORKS}/${ReplaceSpacesAndRemoveUppercases(instance_identifier)}/data/geth.ipc --exec "loadScript('${ETHEREUM_FOLDER_FOR_DEPLOYED_NETWORKS}/${ReplaceSpacesAndRemoveUppercases(identifier)}/scripts/start-miner.js')"`);
        await UnlockAccount(instance_configuration['account'], instance_configuration['password']);
        ExecuteCommand(`cd '${ETHEREUM_FOLDER_FOR_DEPLOYED_NETWORKS}/truffle' && truffle migrate`);
        await Sleep(10000);
        
        const deployed_contract: any = JSON.parse(ReadFile(`${ETHEREUM_FOLDER_FOR_DEPLOYED_NETWORKS}/truffle/build/contracts/${contract}.json`).toString());
        CONTRACTS[`${contract}-${version}`] = new ENDPOINT.eth.Contract(deployed_contract['abi'], deployed_contract['networks'][genesis_block['config']['chainId']]['address']);

        // TODO: Store contract information in DB directly

        parent_contract.state('state', 'deployed');
        await parent_contract.save();
        contract_version.state('state', 'deployed');
        await contract_version.save();

        await CreateContractManagementEntry({ identifier: uuidv4(), type: 'installation', contract: contract, date: Date.now(), caller: instance.get('configuration')['account'] });

        console.log('Installation of smart contract: done');
        return true;
      }
    } catch (error) {
      console.log('An unexpected error occurred during installation of smart contract:');
      console.log((error as Error).message);
      return false;
    }
}

async function InvokeContract(instance_identifier: string, type: ContractInvocationType, contract_identifier: string, version: string, fn: string, parameters: any[]): Promise<any> {
  const contract = CONTRACTS[`${contract_identifier}-${version}`];

  if(!contract) throw new Error('Contract is not deployed');

  // TODO: Register an operation task entry
  try {
    const operation: string = uuidv4();

    const task: IContractOperationTaskModel = await CreatContractOperationTaskEntry({ identifier: uuidv4(), instance: instance_identifier, network: 'fabric', operation });

    const instance: IEthereumNetworkModel = await GetDLTInstanceEntry(instance_identifier, 'ethereum') as IEthereumNetworkModel;
    
    let transaction: string = 'N/A';
    let response: Maybe<string>;

    if(type === 'invoke') {
      try {
        ExecuteCommand(`geth attach ${ETHEREUM_FOLDER_FOR_DEPLOYED_NETWORKS}/${ReplaceSpacesAndRemoveUppercases(instance_identifier)}/data/geth.ipc --exec "loadScript('${ETHEREUM_FOLDER_FOR_DEPLOYED_NETWORKS}/${ReplaceSpacesAndRemoveUppercases(instance_identifier)}/scripts/start-miner.js')"`);
        const promise = contract.methods[fn](...parameters).send({ from: instance.get('configuration')['account'] });

        task.state('state', 'submitted');
        await task.save();

        const receipt = await promise;

        transaction = receipt['transactionHash'];
        ExecuteCommand(`geth attach ${ETHEREUM_FOLDER_FOR_DEPLOYED_NETWORKS}/${ReplaceSpacesAndRemoveUppercases(instance_identifier)}/data/geth.ipc --exec "loadScript('${ETHEREUM_FOLDER_FOR_DEPLOYED_NETWORKS}/${ReplaceSpacesAndRemoveUppercases(instance_identifier)}/scripts/stop-miner.js')"`);
      } catch(error: Error) {
        console.error(`[ETHEREUM] An error occurred while invoking contract (contract: ${contract}, version: ${version})`);
        console.error(`[ETHEREUM] ${error}`);
        console.log('[ETHEREUM Stopping miner...');
        ExecuteCommand(`geth attach ${ETHEREUM_FOLDER_FOR_DEPLOYED_NETWORKS}/${ReplaceSpacesAndRemoveUppercases(instance_identifier)}/data/geth.ipc --exec "loadScript('${ETHEREUM_FOLDER_FOR_DEPLOYED_NETWORKS}/${ReplaceSpacesAndRemoveUppercases(instance_identifier)}/scripts/stop-miner.js')"`);
        console.log('[ETHEREUM] Miner stopped');
      }
    } else {
      try {
        const promise = contract.methods[fn](...parameters).call();
        task.state('state', 'submitted');
        await task.save();
        const receipt = await promise;
        response = (typeof receipt == 'string') ? receipt : JSON.stringify(receipt);
      } catch(error: Error) {
        console.error(`[ETHEREUM] An error occurred while reading contract (contract: ${contract}, version: ${version})`);
        console.error(`[ETHEREUM] ${error}`);
      }
    }

    await CreateContractInvocationEntry({ identifier: operation, type, contract, date: Date.now(), reference: transaction, function: fn, parameters: parameters, ...(response && { response }), caller: instance.get('configuration')['account'] });

    task.set('state', 'executed');
    await task.save();

    return response;
  } catch(error: Error) {
    console.error(`[ETHEREUM] An error occurred while calling contract: ${ contract } (version: ${ version })`);
    console.error(`[ETHEREUM] ${error}`);
    throw error;
  }
}

async function SetupContracts(instance_identifier: string = config.get('blockchain.ethereum.identifier')): Promise<void> {
  // TODO: Merge with data from database + support multiple Ethereum networks
    CONTRACTS = {};
    LISTENERS = {};

    const instance: IEthereumNetworkModel = await GetDLTInstanceEntry(instance_identifier, 'ethereum') as IEthereumNetworkModel;
    const instance_configuration = instance.get('configuration');
    const genesis_block = JSON.parse(ReadFile(`${ETHEREUM_FOLDER_FOR_DEPLOYED_NETWORKS}/${ReplaceSpacesAndRemoveUppercases(instance_identifier)}/genesis.json`).toString());

    for(const [name, parameters] of Object.entries<GenericObject>(config.get('blockchain.ethereum.contracts'))) {
        try {
          const deployed_contract: any = JSON.parse(ReadFile(`${ETHEREUM_FOLDER_FOR_DEPLOYED_NETWORKS}/truffle/build/contracts/${name}.json`).toString());
          CONTRACTS[parameters['reference']] = new ENDPOINT.eth.Contract(deployed_contract['abi'], deployed_contract['networks'][genesis_block['config']['chainId']]['address']);
          LISTENERS[parameters['reference']] = {};
        } catch {
          console.log(`[ETHEREUM] Invalid reference: ${parameters['reference']} (contract: ${name})`);
          console.log(`[ETHEREUM] Check if contract has been deployed`);
        }
    }
}

async function AddContractListener(contract: string, version: string, name: string, listener: (event: EventData) => Promise<void>): Promise<void> {
    if(CONTRACTS[`${contract}-${version}`]) {
      LISTENERS[`${contract}-${version}`][name] = CONTRACTS[`${contract}-${version}`].events[name]();
      LISTENERS[`${contract}-${version}`][name].on('data', listener);
    }
}

function RemoveContractListeners(): void {
    for(const contract of Object.keys(CONTRACTS)) {
        if(LISTENERS[contract]) {
            for(const listener of Object.values(LISTENERS[contract])) {
                listener.unsubscribe();
            }
        }
    }
}

export { DeployContract as DeployEthereumContract, InvokeContract as InvokeEthereumContract, SetupContracts as SetupEthereumContracts, AddContractListener as AddEthereumContractListener, RemoveContractListeners as RemoveEthereumContractListeners };