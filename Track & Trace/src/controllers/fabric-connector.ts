import { BlockEvent, Contract, ContractEvent, ContractListener, Gateway, Network, Transaction, TransactionEvent, Wallet, Wallets, X509Identity } from 'fabric-network';
import config from 'config';

import { SCRIPT_EXECUTED_AS_ROOT, HOME_DIRECTORY, ExecuteCommand, ReadFile, RegisterRecord } from 'core';
import { RegisterProcessTraceReference, RegisterProcessVersionTraceReference, RegisterExecutionInstanceTraceReference, RegisterProcessElementTraceReference } from '@service/database/schemata';

let WALLET: Wallet;
let GATEWAY: Gateway;
let CONTRACT: Contract;
let LISTENER: ContractListener;

const connection_profile_buffer: Buffer = ReadFile(config.get('blockchain.fabric.profile'));
const connection_profile: Record<string, unknown> = JSON.parse(connection_profile_buffer.toString());

async function Initialize(): Promise<void> {
    WALLET = await SetupWallet();
    GATEWAY = await SetupGateway(WALLET);
    await SetupContract(GATEWAY);
}

function Shutdown(): void {
    try {
        if(CONTRACT) CONTRACT.removeContractListener(LISTENER);
        if(GATEWAY) GATEWAY.disconnect();
    } catch(error) {
        console.error('[FABRIC] An error occurred during shutdown');
        console.error(error);
    }
}

async function SetupWallet(): Promise<Wallet> {
    ExecuteCommand(`rm -rf ${ config.get('blockchain.fabric.wallets') }/*`);
    const wallet: Wallet = await Wallets.newFileSystemWallet(config.get('blockchain.fabric.wallets'));

    const administrator_key: string = ReadFile(config.get('blockchain.fabric.administrator.key')).toString();
    const administrator_certificate: string = ReadFile(config.get('blockchain.fabric.administrator.certificate')).toString();
    const administrator_identity: X509Identity = {
        credentials: {
            certificate: administrator_certificate,
            privateKey: administrator_key
        },
        mspId: config.get('blockchain.fabric.administrator.msp'),
        type: 'X.509'
    };
    await wallet.put(config.get('blockchain.fabric.administrator.identity'), administrator_identity);
    if (SCRIPT_EXECUTED_AS_ROOT) ExecuteCommand(`chown $SUDO_USER:$SUDO_USER ${ config.get('blockchain.fabric.wallets') }/${ config.get('blockchain.fabric.administrator.identity') }.id`);

    return wallet;
}

async function SetupContract(gateway: Gateway): Promise<void> {
    const network: Network = await gateway.getNetwork(config.get('blockchain.fabric.channel'));
    CONTRACT = network.getContract(config.get('blockchain.fabric.contract'));
    await SetupListener();
}

export async function SetupListener(): Promise<void> {
    const listener: (event: ContractEvent) => Promise<void> = async (event: ContractEvent): Promise<void> => {
        // TODO: Uncomment (if needed)
        // DisplayGenericInformationAboutEvent(event);

        if (event.eventName === 'RegisterEntry') {
            await ProcessEventRelatedToRegisteredEntry(event);
        }
    };

    LISTENER = await CONTRACT.addContractListener(listener);
}

export async function RegisterEntry(type: 'data' | 'trace', key: string, value: string): Promise<string | undefined> {
    try {
        const transaction: Transaction = CONTRACT.createTransaction('register');
        console.log('[FABRIC] Registering entry...');
        const response: string = (await transaction.submit(`${type}:${key}`, value)).toString();
        console.log('[FABRIC] Entry registered');
        return response;
    } catch (error) {
        console.error('[FABRIC] An error occurred while registering entry');
        console.error(`[FABRIC] ${error}`);
    }
}

export async function RetrieveEntry(type: 'data' | 'trace', key: string): Promise<string | undefined> {
    try {
        const result: Buffer = await CONTRACT.evaluateTransaction('retrieve', `${type}:${key}`);
        return result.toString();
    } catch (error) {
        console.error('[FABRIC] An error occurred while retrieving entry');
        console.error(`[FABRIC] ${error}`);
    }
}

async function SetupGateway(wallet: Wallet): Promise<Gateway> {
    const gateway: Gateway = new Gateway();

    await gateway.connect(connection_profile, {
        wallet: wallet,
        identity: config.get('blockchain.fabric.administrator.identity'),
        discovery: { enabled: true, asLocalhost: true }
    });

    return gateway;
}

function DisplayGenericInformationAboutEvent(event: ContractEvent): void {
    console.log(`[FABRIC] Event received: ${event.eventName} (contract: store)`);

    if (event.payload) {
        console.log('[FABRIC] Event payload:' + event.payload.toString());
    }

    const transaction: TransactionEvent = event.getTransactionEvent();
    const block: BlockEvent = transaction.getBlockEvent();
    console.log(`[FABRIC] Transaction: ${transaction.transactionId}`);
    console.log(`[FABRIC] Status: ${transaction.status}`);
    console.log(`[FABRIC] Block: ${block.blockNumber.toString()}`);
}

async function ProcessEventRelatedToRegisteredEntry(event: ContractEvent): Promise<void> {
    try {
        const transaction: TransactionEvent = event.getTransactionEvent();
        const data: { key: string, value: string } = JSON.parse(event.payload!.toString());
        const key_information: string[] = data['key'].split(':');

        if (key_information[0] === 'trace') {
            switch (key_information[1]) {
                case 'process': {
                    await RegisterProcessTraceReference(key_information[2], { 'platform': 'FABRIC', 'identifier': transaction.transactionId, state: 'saved' });
                    break;
                }
                case 'version': {
                    await RegisterProcessVersionTraceReference(key_information[2], { 'platform': 'FABRIC', 'identifier': transaction.transactionId, state: 'saved' });
                    break;
                }
                case 'instance': {
                    await RegisterExecutionInstanceTraceReference(key_information[2], { 'platform': 'FABRIC', 'identifier': transaction.transactionId, state: 'saved' });
                    break;
                }
                case 'element': {
                    await RegisterProcessElementTraceReference(key_information[2], { 'platform': 'FABRIC', 'identifier': transaction.transactionId, state: 'saved' });
                    break;
                }
                default: throw new Error(`Invalid trace type found for key: ${data['key']}`);
            }
            console.log(`[FABRIC] DLT reference added to trace: ${key_information[2]} (type: ${key_information[1]})`);
        } else if (key_information[0] === 'data') {
            await RegisterRecord(key_information[1], `FABRIC:${transaction.transactionId}`);
            console.log(`[FABRIC] Reference updated: ${key_information[1]}`);
        } else {
            console.warn(`[FABRIC] WARNING: Unrecognized key type: ${key_information[0]}`);
        }
    } catch (error) {
        console.error('[FABRIC] An error occurred while handling received event');
        console.error(`[FABRIC] ${error}`);
    }
}

export { Initialize as InitializeFabricConnector, Shutdown as ShutdownFabricConnector };