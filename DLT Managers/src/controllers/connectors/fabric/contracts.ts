import { v4 as uuidv4 } from 'uuid';
import { Contract, ContractEvent, ContractListener, Gateway, Network } from 'fabric-network';
import config from 'config';
import { existsSync } from 'fs';
import { ShellString } from 'shelljs';

import { ExecuteCommand, BASH_COMMAND_AS_SUDO_USER, ReplaceSpacesAndRemoveUppercases, ContractInvocationType, FabricOrganization, FabricParticipant, GenericObject, FABRIC_NETWORK_FOLDER } from 'core';
import { IContractModel, GetDLTInstanceEntry, GetContractEntry, CreateContractEntry, IFabricNetworkModel, CreateContractVersionEntry, IContractVersionModel, CreateContractManagementEntry, CreateContractInvocationEntry, CreatContractOperationTaskEntry, IContractOperationTaskModel } from '@service/database/schemata';
import { GATEWAY } from './controller';

let CONTRACTS: { [key: string]: Contract };
let LISTENERS: { [key: string]: { [key: string]: ContractListener } };

async function DeployChaincode(instance_identifier: string, chaincode: string = 'store', version: string = 'v1', location: string = `${FABRIC_NETWORK_FOLDER}/chaincodes`, language: 'golang' | 'node' | 'java' = 'node', channel: string = 'channel'): Promise<boolean> {
  // TODO: As we are in the case of a deployment of a smart contract template, location and other parameters should be fed more appropriately  
  
  try {  
        const chaincode_path: string = `${location}/${chaincode}`;
      if (!existsSync(chaincode_path)) {
        console.log(`Path to chaincode does not exist: ${chaincode_path}`);
        console.log('Aborting installation...');
        return false;
      } else {
        const instance: IFabricNetworkModel = await GetDLTInstanceEntry(instance_identifier, 'fabric') as IFabricNetworkModel;
        
        let parent_contract: IContractModel;
        try {
          parent_contract = await GetContractEntry(chaincode);
        } catch {
          // TODO: Make sure that the catched error is due to the absence of the entry in database
          parent_contract = await CreateContractEntry({ identifier: chaincode, instance: instance_identifier, network: 'fabric' });
          await CreateContractManagementEntry({ identifier: uuidv4(), type: 'registration', contract: chaincode, date: Date.now(), caller: instance.get('organization')['name'] });
        }

        const contract_version: IContractVersionModel = await CreateContractVersionEntry({ contract: chaincode, version: version });

        parent_contract.state('state', 'installing');
        await parent_contract.save();
        contract_version.state('state', 'installing');
        await contract_version.save();
        
        PackageChaincode(instance, location, chaincode, version, language);
        InstallChaincode(instance, chaincode, version);
        ApproveChaincode(instance, channel, chaincode, version);
        CommitChaincode(instance, channel, chaincode, version);

        parent_contract.state('state', 'deployed');
        await parent_contract.save();
        contract_version.state('state', 'deployed');
        await contract_version.save();

        await CreateContractManagementEntry({ identifier: uuidv4(), type: 'installation', contract: chaincode, date: Date.now(), caller: instance.get('organization')['name'] });

        console.log('Installation of chaincode: done');
        const network: Network = await GATEWAY.getNetwork(channel);
        CONTRACTS[`${chaincode}-${version}`] = network.getContract(`${chaincode}-${version}`);
        return true;
      }
    } catch (error) {
      console.log('An unexpected error occurred during installation of chaincode:');
      console.log((error as Error).message);
      return false;
    }
}

async function InvokeChaincode(instance_identifier: string, type: ContractInvocationType, chaincode: string, version: string, fn: string, parameters: any[]): Promise<string> {
  const contract = CONTRACTS[`${chaincode}-${version}`];

  if(!contract) throw new Error('Contract is not deployed');

  // TODO: Register an operation task entry
  try {
    const operation: string = uuidv4();

    const task: IContractOperationTaskModel = await CreatContractOperationTaskEntry({ identifier: uuidv4(), instance: instance_identifier, network: 'fabric', operation });

    const instance: IFabricNetworkModel = await GetDLTInstanceEntry(instance_identifier, 'fabric') as IFabricNetworkModel;
        
    let transaction: Transaction;
    let response: string;
    if(type === 'invoke') {
      transaction = contract.createTransaction(fn);
      task.state('state', 'submitted');
      await task.save();

      response  = (await transaction.submit(...parameters)).toString();
    } else {
      transaction = contract.createTransaction(fn);
      task.state('state', 'submitted');
      await task.save();

      response = transaction.evaluate(...parameters).toString();
    }

    await CreateContractInvocationEntry({ identifier: operation, type, contract: chaincode, date: Date.now(), reference: transaction.getTransactionID(), function: fn, parameters: parameters, ...(response && { response }), caller: instance.get('organization')['name'] });

    task.set('state', 'executed');
    await task.save();

    return response;
  } catch(error: Error) {
    console.error(`[FABRIC] An error occurred while calling contract: ${ chaincode } (version: ${ version })`);
    console.error(`[FABRIC] ${error}`);
    throw error;
  }
}

function PackageChaincode(instance: IFabricNetworkModel, location: string, chaincode: string, version: string, language: 'golang' | 'node' | 'java'): void {
    console.log(`Packaging chaincode ${chaincode}...`);
    console.log('NOTE: We rely on first designated organization for this task');

    ExecuteCommand(`${BASH_COMMAND_AS_SUDO_USER} -c 'cp -R ${location}/${chaincode} ${FABRIC_NETWORK_FOLDER}/networks/${ReplaceSpacesAndRemoveUppercases(instance.get('identifier'))}/configuration/chaincodes'`);

    const organization: FabricOrganization = instance.get('organization') as FabricOrganization;
    const organization_formatted_name: string = ReplaceSpacesAndRemoveUppercases(organization['name']);
    const peer: FabricParticipant = organization['peers']['participants'].find((p: FabricParticipant) => p['name'] === organization['cli']) as FabricParticipant;
    const peer_tls_msp: string = `/opt/gopath/src/github.com/hyperledger/fabric/peers/${peer['name']}/tls-msp`;

    ExecuteCommand(`docker exec ${organization_formatted_name}-cli bash -c 'cd /opt/gopath/src/github.com/hyperledger/fabric/chaincodes/${chaincode} && CORE_PEER_ADDRESS=${organization_formatted_name}-${peer['name']}:${peer['port']} CORE_PEER_TLS_CERT_FILE=${peer_tls_msp}/signcerts/cert.pem CORE_PEER_TLS_KEY_FILE=${peer_tls_msp}/keystore/key.pem CORE_PEER_TLS_ROOTCERT_FILE=${peer_tls_msp}/tlscacerts/tls-cert.pem peer lifecycle chaincode package ${chaincode}-${version}.tar.gz --path /opt/gopath/src/github.com/hyperledger/fabric/chaincodes/${chaincode}/ --lang ${language} --label ${chaincode}-${version}'`);

    console.log('Package created successfully');
}

function InstallChaincode(instance: IFabricNetworkModel, chaincode: string, version: string): void {
    console.log(`Installing chaincode ${chaincode}...`);

    const organization: FabricOrganization = instance.get('organization') as FabricOrganization;
    const organization_formatted_name: string = ReplaceSpacesAndRemoveUppercases(organization['name']);
    const peer: FabricParticipant = organization['peers']['participants'].find((p: FabricParticipant) => p['name'] === organization['cli']) as FabricParticipant;
    const peer_tls_msp: string = `/opt/gopath/src/github.com/hyperledger/fabric/peers/${peer['name']}/tls-msp`;

    console.log(`Peer: ${peer['name']}`);

    ExecuteCommand(`docker exec ${organization_formatted_name}-cli bash -c 'CORE_PEER_ADDRESS=${organization_formatted_name}-${peer['name']}:${peer['port']} CORE_PEER_TLS_CERT_FILE=${peer_tls_msp}/signcerts/cert.pem CORE_PEER_TLS_KEY_FILE=${peer_tls_msp}/keystore/key.pem CORE_PEER_TLS_ROOTCERT_FILE=${peer_tls_msp}/tlscacerts/tls-cert.pem peer lifecycle chaincode install /opt/gopath/src/github.com/hyperledger/fabric/chaincodes/${chaincode}/${chaincode}-${version}.tar.gz'`);

    console.log('Chaincode installed successfully for organization');
}

// TODO: Stop when sufficient organizations have approved the chaincode with success
function ApproveChaincode(instance: IFabricNetworkModel, channel: string, chaincode: string, version: string): void {
    console.log('Approving chaincode by all organizations of the network...');

    const organization: FabricOrganization = instance.get('organization') as FabricOrganization;
    const organization_formatted_name: string = ReplaceSpacesAndRemoveUppercases(organization['name']);
    const peer: FabricParticipant = organization['peers']['participants'].find((p: FabricParticipant) => p['name'] === organization['cli']) as FabricParticipant;
    const peer_tls_msp: string = `/opt/gopath/src/github.com/hyperledger/fabric/peers/${peer['name']}/tls-msp`;
    const orderer: FabricParticipant = organization['orderers']['participants'][0];

    console.log(`Peer: ${peer['name']}`);
    console.log(`Orderer: ${orderer['name']}`);

    const installed_chaincodes: ShellString = ExecuteCommand(`docker exec ${organization_formatted_name}-cli bash -c 'CORE_PEER_ADDRESS=${organization_formatted_name}-${peer['name']}:${peer['port']} CORE_PEER_TLS_CERT_FILE=${peer_tls_msp}/signcerts/cert.pem CORE_PEER_TLS_KEY_FILE=${peer_tls_msp}/keystore/key.pem CORE_PEER_TLS_ROOTCERT_FILE=${peer_tls_msp}/tlscacerts/tls-cert.pem peer lifecycle chaincode queryinstalled --output json'`);
    const chaincode_package_id: string = JSON.parse(installed_chaincodes.stdout)?.['installed_chaincodes'].find(((chaincode_informations: { 'package_id': string, 'label': string }) => chaincode_informations['label'] === `${chaincode}-${version}`))?.['package_id'];

    if (chaincode_package_id) {
    console.log('Package ID fetched');
    console.log('Approving chaincode...');

    ExecuteCommand(`docker exec ${organization_formatted_name}-cli bash -c 'CORE_PEER_ADDRESS=${organization_formatted_name}-${peer['name']}:${peer['port']} CORE_PEER_CHAINCODELISTENADDRESS=${organization_formatted_name}-${peer['name']}:${peer['port']} CORE_PEER_TLS_CERT_FILE=${peer_tls_msp}/signcerts/cert.pem CORE_PEER_TLS_KEY_FILE=${peer_tls_msp}/keystore/key.pem CORE_PEER_TLS_ROOTCERT_FILE=${peer_tls_msp}/tlscacerts/tls-cert.pem peer lifecycle chaincode approveformyorg --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/orderers/msp/tlscacerts/tls-cert.pem -o ${organization_formatted_name}-${orderer['name']}:${orderer['port']} --channelID ${ channel } --name ${chaincode}-${version} --version ${version} --sequence 1 --waitForEvent 600 --init-required --package-id ${chaincode_package_id}'`);
    console.log('Chaincode approved');
    } else {
    console.log('WARNING: Could not fetch package ID of the chaincode!');
    }
}

function CommitChaincode(instance: IFabricNetworkModel, channel: string, chaincode: string, version: string): void {
    console.log('Committing chaincode...');

    const organization: FabricOrganization = instance.get('organization') as FabricOrganization;
    const organization_formatted_name: string = ReplaceSpacesAndRemoveUppercases(organization['name']);
    const peer: FabricParticipant = organization['peers']['participants'].find((p: FabricParticipant) => p['name'] === organization['cli']) as FabricParticipant;
    const peer_tls_msp: string = `/opt/gopath/src/github.com/hyperledger/fabric/peers/${peer['name']}/tls-msp`;
    const orderer: FabricParticipant = organization['orderers']['participants'][0];

    console.log(`Peer: ${peer['name']}`);
    console.log(`Orderer: ${orderer['name']}`);

    const parameters_related_to_peers: string = `--peerAddresses ${organization_formatted_name}-${peer['name']}:${peer['port']} --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/network/${organization_formatted_name}/peers/participants/${peer['name']}/tls-msp/tlscacerts/tls-cert.pem`;

    ExecuteCommand(`docker exec ${organization_formatted_name}-cli bash -c 'CORE_PEER_ADDRESS=${organization_formatted_name}-${peer['name']}:${peer['port']} CORE_PEER_CHAINCODELISTENADDRESS=${organization_formatted_name}-${peer['name']}:${peer['port']} CORE_PEER_TLS_CERT_FILE=${peer_tls_msp}/signcerts/cert.pem CORE_PEER_TLS_KEY_FILE=${peer_tls_msp}/keystore/key.pem CORE_PEER_TLS_ROOTCERT_FILE=${peer_tls_msp}/tlscacerts/tls-cert.pem peer lifecycle chaincode commit --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/orderers/msp/tlscacerts/tls-cert.pem -o ${organization_formatted_name}-${orderer['name']}:${orderer['port']} ${parameters_related_to_peers} --channelID ${channel} --name ${chaincode}-${version} --init-required --version ${version} --sequence 1'`);

    console.log('Chaincode committedd successfully');
}

async function SetupContracts(gateway: Gateway): Promise<void> {
  // TODO: Merge with data from database + support multiple HL Fabric networks
    const network: Network = await gateway.getNetwork(config.get('blockchain.fabric.channel'));
    CONTRACTS = {};
    LISTENERS = {};
    for(const [name, parameters] of Object.entries<GenericObject>(config.get('blockchain.fabric.contracts'))) {
        try {
          CONTRACTS[parameters['reference']] = network.getContract(parameters['reference']);
          LISTENERS[parameters['reference']] = {};
        } catch {
          console.log(`[FABRIC] Invalid reference: ${parameters['reference']} (contract: ${name})`);
          console.log(`[FABRIC] Check if contract has been deployed`);
        }
    }
}

async function AddContractListener(contract: string, name: string, listener: (event: ContractEvent) => Promise<void>): Promise<void> {
    if(CONTRACTS[contract]) {
        LISTENERS[contract][name] = await CONTRACTS[contract].addContractListener(listener);
    }
}

function RemoveContractListeners(): void {
    for(const contract of Object.keys(CONTRACTS)) {
        if(LISTENERS[contract]) {
            for(const listener of Object.values(LISTENERS[contract])) {
                CONTRACTS[contract].removeContractListener(listener);
            }
        }
    }
}

export { DeployChaincode as DeployFabricContract, InvokeChaincode as InvokeFabricContract, SetupContracts as SetupFabricContracts, AddContractListener as AddFabricContractListener, RemoveContractListeners as RemoveFabricContractListeners };