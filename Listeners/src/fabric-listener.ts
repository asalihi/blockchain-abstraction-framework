import { execSync as exec } from 'child_process';
import config from 'config';
import { BlockEvent, Contract, ContractEvent, ContractListener, Gateway, Network, Transaction, TransactionEvent, Wallet, Wallets, X509Identity } from 'fabric-network';

import { ReadFile } from './helpers';

let WALLET: Wallet;
let GATEWAY: Gateway;
let CONTRACT: Contract;
let LISTENER: ContractListener;

const connection_profile_buffer: Buffer = ReadFile(config.get('fabric.profile'));
const connection_profile: Record<string, unknown> = JSON.parse(connection_profile_buffer.toString());

async function Initialize(): Promise<void> {
    WALLET = await SetupWallet();
    GATEWAY = await SetupGateway(WALLET);
    await SetupContract(GATEWAY);
    setInterval(function() {
        console.log('Listening for smart contract events...');
    }, 1000 * 60 * 60);
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
    const wallet: Wallet = await Wallets.newFileSystemWallet(config.get('fabric.wallets'));
    return wallet;
}

async function SetupContract(gateway: Gateway): Promise<void> {
    const network: Network = await gateway.getNetwork(config.get('fabric.channel'));
    CONTRACT = network.getContract(config.get('fabric.contract'));
    await SetupListener();
}

export async function SetupListener(): Promise<void> {
    const listener: (event: ContractEvent) => Promise<void> = async (event: ContractEvent): Promise<void> => {
        DisplayGenericInformationAboutEvent(event);
    };

    LISTENER = await CONTRACT.addContractListener(listener);
}

async function SetupGateway(wallet: Wallet): Promise<Gateway> {
    const gateway: Gateway = new Gateway();

    await gateway.connect(connection_profile, {
        wallet: wallet,
        identity: config.get('fabric.identity'),
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

export { Initialize as InitializeFabricContractListener, Shutdown as ShutdownFabricContractListener };