import { existsSync } from 'fs';
import { Gateway, Wallet, Wallets, X509Identity } from 'fabric-network';
import config from 'config';

import { ReplaceSpacesAndCapitalizeFirstLetterOnly, SCRIPT_EXECUTED_AS_ROOT, FabricNetworkConfiguration, FABRIC_FOLDER_FOR_DEPLOYED_NETWORKS, ReadFile, ExecuteCommand, BASH_COMMAND_AS_SUDO_USER, FABRIC_NETWORK_FOLDER, HYPERLEDGER_FABRIC_CA_VERSION, HYPERLEDGER_FABRIC_VERSION } from 'core';
import { IFabricNetworkModel, GetDLTInstanceEntry } from '@service/database/schemata';
import { SetupFabricContracts, RemoveFabricContractListeners } from './contracts';

export let WALLET: Wallet;
export let GATEWAY: Gateway;

export function SetupFabricManager(): void {
	InstallFabricBinariesIfMissing();
    ExecuteCommand(`${BASH_COMMAND_AS_SUDO_USER} -c 'mkdir -p ${FABRIC_NETWORK_FOLDER}/profiles'`);
}                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 

export function InstallFabricBinariesIfMissing(): void {
	if(!existsSync(`${FABRIC_NETWORK_FOLDER}/tools`)) ExecuteCommand(`${BASH_COMMAND_AS_SUDO_USER} -c 'mkdir ${ FABRIC_NETWORK_FOLDER }/tools'`);

	if(!existsSync(`${FABRIC_NETWORK_FOLDER}/tools/fabric-${HYPERLEDGER_FABRIC_VERSION}`)) {
		console.log(`WARNING: Fabric binaries not found in folder: ${FABRIC_NETWORK_FOLDER}/tools/fabric-${HYPERLEDGER_FABRIC_VERSION}`);
		console.log('Fetching Fabric binaries...');
		ExecuteCommand(`${BASH_COMMAND_AS_SUDO_USER} -c 'mkdir -p ${FABRIC_NETWORK_FOLDER}/tools/fabric-${HYPERLEDGER_FABRIC_VERSION}'`);
		ExecuteCommand(`${BASH_COMMAND_AS_SUDO_USER} -c 'curl -L https://github.com/hyperledger/fabric/releases/download/v${HYPERLEDGER_FABRIC_VERSION}/hyperledger-fabric-linux-amd64-${HYPERLEDGER_FABRIC_VERSION}.tar.gz -o ${FABRIC_NETWORK_FOLDER}/tools/fabric-${HYPERLEDGER_FABRIC_VERSION}/hyperledger-fabric-linux-amd64-${HYPERLEDGER_FABRIC_VERSION}.tar.gz'`);
		ExecuteCommand(`${BASH_COMMAND_AS_SUDO_USER} -c 'tar --strip-components 1 -C ${FABRIC_NETWORK_FOLDER}/tools/fabric-${HYPERLEDGER_FABRIC_VERSION} -zxvf ${FABRIC_NETWORK_FOLDER}/tools/fabric-${HYPERLEDGER_FABRIC_VERSION}/hyperledger-fabric-linux-amd64-${HYPERLEDGER_FABRIC_VERSION}.tar.gz bin'`);
		ExecuteCommand(`${BASH_COMMAND_AS_SUDO_USER} -c 'rm -rf ${FABRIC_NETWORK_FOLDER}/tools/fabric-${HYPERLEDGER_FABRIC_VERSION}/hyperledger-fabric-linux-amd64-${HYPERLEDGER_FABRIC_VERSION}.tar.gz'`);
		console.log('Fabric binaries fetched successfully');
	}

	if(!existsSync(`${FABRIC_NETWORK_FOLDER}/tools/fabric-ca-${HYPERLEDGER_FABRIC_CA_VERSION}`)) {
		console.log(`WARNING: Fabric CA binaries not found in folder: ${FABRIC_NETWORK_FOLDER}/tools/fabric-ca-${HYPERLEDGER_FABRIC_CA_VERSION}`);
		console.log('Fetching Fabric CA binaries...');
		ExecuteCommand(`${BASH_COMMAND_AS_SUDO_USER} -c 'mkdir -p ${FABRIC_NETWORK_FOLDER}/tools/fabric-ca-${HYPERLEDGER_FABRIC_CA_VERSION}'`);
		ExecuteCommand(`${BASH_COMMAND_AS_SUDO_USER} -c 'curl -L https://github.com/hyperledger/fabric-ca/releases/download/v${HYPERLEDGER_FABRIC_CA_VERSION}/hyperledger-fabric-ca-linux-amd64-${HYPERLEDGER_FABRIC_CA_VERSION}.tar.gz -o ${FABRIC_NETWORK_FOLDER}/tools/fabric-ca-${HYPERLEDGER_FABRIC_CA_VERSION}/hyperledger-fabric-ca-linux-amd64-${HYPERLEDGER_FABRIC_CA_VERSION}.tar.gz'`);
		ExecuteCommand(`${BASH_COMMAND_AS_SUDO_USER} -c 'tar --strip-components 1 -C ${FABRIC_NETWORK_FOLDER}/tools/fabric-ca-${HYPERLEDGER_FABRIC_CA_VERSION} -zxvf ${FABRIC_NETWORK_FOLDER}/tools/fabric-ca-${HYPERLEDGER_FABRIC_CA_VERSION}/hyperledger-fabric-ca-linux-amd64-${HYPERLEDGER_FABRIC_CA_VERSION}.tar.gz'`);
		ExecuteCommand(`${BASH_COMMAND_AS_SUDO_USER} -c 'rm -rf ${FABRIC_NETWORK_FOLDER}/tools/fabric-ca-${HYPERLEDGER_FABRIC_CA_VERSION}/hyperledger-fabric-ca-linux-amd64-${HYPERLEDGER_FABRIC_CA_VERSION}.tar.gz'`);
		console.log('Fabric CA binaries fetched successfully');
	}
}

async function Initialize(): Promise<void> {
    WALLET = await SetupWallet();
    GATEWAY = await SetupGateway(WALLET);
    await SetupFabricContracts(GATEWAY);
}

function Shutdown(): void {
    try {
        RemoveFabricContractListeners();
        if(GATEWAY) GATEWAY.disconnect();
    } catch(error) {
        console.error('[FABRIC] An error occurred during shutdown');
        console.error(error);
    }
}

async function SetupWallet(): Promise<Wallet> {
    const instance: IFabricNetworkModel = await GetDLTInstanceEntry(config.get('blockchain.fabric.network'), 'fabric') as IFabricNetworkModel;
    const instance_configuration: FabricNetworkConfiguration = instance.get('configuration');    

    ExecuteCommand(`rm -rf ${ FABRIC_NETWORK_FOLDER }/wallets/*`);
    const wallet: Wallet = await Wallets.newFileSystemWallet(`${FABRIC_NETWORK_FOLDER}/wallets/*`);

    const administrator_key: string = ReadFile(`${ FABRIC_FOLDER_FOR_DEPLOYED_NETWORKS}/${instance.get('identifier')}}/network/${instance_configuration['organization']['name']}/peers/participants/${instance_configuration['organization']['peers']['administrator']['name']}/msp/keystore/key.pem`).toString();
    const administrator_certificate: string = ReadFile(`${FABRIC_FOLDER_FOR_DEPLOYED_NETWORKS}/${instance.get('identifier')}}/network/${instance_configuration['organization']['name']}/peers/participants/${instance_configuration['organization']['peers']['administrator']['name']}/msp/signcerts/cert.pem`).toString();
    const administrator_identity: X509Identity = {
        credentials: {
            certificate: administrator_certificate,
            privateKey: administrator_key
        },
        mspId: `${ReplaceSpacesAndCapitalizeFirstLetterOnly(instance_configuration['organization']['name'])}PeersMSP`,
        type: 'X.509'
    };
    await wallet.put(config.get('blockchain.fabric.identity'), administrator_identity);
    if (SCRIPT_EXECUTED_AS_ROOT) ExecuteCommand(`chown $SUDO_USER:$SUDO_USER ${FABRIC_NETWORK_FOLDER}/wallets/${ config.get('blockchain.fabric.identity') }.id`);

    return wallet;
}

async function SetupGateway(wallet: Wallet): Promise<Gateway> {
    const gateway: Gateway = new Gateway();

    const connection_profile_buffer: Buffer = ReadFile(`${FABRIC_NETWORK_FOLDER}/profiles/${config.get('blockchain.fabric.network')}-connection-profile.json`);
    const connection_profile: Record<string, unknown> = JSON.parse(connection_profile_buffer.toString());


    await gateway.connect(connection_profile, {
        wallet: wallet,
        identity: config.get('blockchain.fabric.identity'),
        discovery: { enabled: true, asLocalhost: true }
    });

    return gateway;
}

export { Initialize as InitializeFabricConnector, Shutdown as ShutdownFabricConnector };