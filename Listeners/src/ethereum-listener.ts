import config from 'config';
import Web3 from 'web3';
import { Contract, EventData } from 'web3-eth-contract';
import { Subscription } from 'web3-core-subscriptions';

import { ReadFile } from './helpers';

const ACCOUNT: string = config.get('ethereum.account.address');
const PASSWORD: string = config.get('ethereum.account.password');
const CONTRACT_ADDRESS: string = config.get('ethereum.contract.address');

let ENDPOINT: Web3;
let CONTRACT: Contract;
let LISTENER: Subscription<EventData>;

async function Initialize(): Promise<void> {
    const provider = new Web3.providers.WebsocketProvider(config.get('ethereum.provider'), {
        reconnect: {
            auto: true,
            delay: 5000,
            maxAttempts: 5,
            onTimeout: false,
        },
    });
    ENDPOINT = new Web3(provider);
    await UnlockAccount(ACCOUNT, PASSWORD);
    SetupContract();
};

async function Shutdown(): Promise<void> {
    try {
        if (LISTENER) await LISTENER.unsubscribe();
    } catch (error) {
        console.error('[ETHEREUM] An error occurred during shutdown');
        console.error(error);
    }
}

async function UnlockAccount(account: string, password: string): Promise<void> {
    await ENDPOINT.eth.personal.unlockAccount(account, password, 0);
}

function SetupContract(): void {
    const deployed_contract: any = JSON.parse(ReadFile(config.get('ethereum.contract.info')).toString());

    CONTRACT = new ENDPOINT.eth.Contract(deployed_contract['abi'], CONTRACT_ADDRESS);
    LISTENER = CONTRACT.events.EntryRegistered();

    LISTENER.on('data', async (event: EventData) => {
        DisplayGenericInformationAboutEvent(event);
    });
}

function DisplayGenericInformationAboutEvent(event: EventData): void {
    console.log(`[ETHEREUM] Event received: ${event['event']}`);
    console.log(`[ETHEREUM] Contract: ${event['address']}`);
    console.log(`[ETHEREUM] Block: ${event['blockNumber']}`);
    console.log(`[ETHEREUM] Transaction: ${event['transactionHash']}`);

    if (event['returnValues']) {
        console.log(`[ETHEREUM] Data: ${JSON.stringify(event['returnValues'])}`);
    }
}

export { Initialize as InitializeEthereumContractListener, Shutdown as ShutdownEthereumContractListener };