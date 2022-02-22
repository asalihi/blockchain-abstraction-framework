import { isEmpty as empty } from 'lodash';
import Web3 from 'web3';
import { Contract, EventData } from 'web3-eth-contract';
import { Subscription } from 'web3-core-subscriptions';
import config from 'config';

import { HOME_DIRECTORY, ExecuteCommand, ReadFile, RegisterRecord } from 'core';
import { RegisterProcessTraceReference, RegisterProcessVersionTraceReference, RegisterExecutionInstanceTraceReference, RegisterProcessElementTraceReference } from '@service/database/schemata';


const ACCOUNT: string = config.get('blockchain.ethereum.account.address');
const PASSWORD: string = config.get('blockchain.ethereum.account.password');
const CONTRACT_ADDRESS: string = config.get('blockchain.ethereum.contract.address');

let ENDPOINT: Web3;
let CONTRACT: Contract;
let LISTENER: Subscription<EventData>;

async function Initialize(): Promise<void> {
    const provider = new Web3.providers.WebsocketProvider(config.get('blockchain.ethereum.provider'), {
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
        ExecuteCommand(`geth attach ${ config.get('blockchain.ethereum.ipc') } --exec "loadScript('${ HOME_DIRECTORY }/Ethereum/scripts/stop-miner.js')"`);
    } catch (error) {
        console.error('[ETHEREUM] An error occurred during shutdown');
        console.error(error);
    }
}

async function UnlockAccount(account: string, password: string): Promise<void> {
    await ENDPOINT.eth.personal.unlockAccount(account, password, 0);
}

function SetupContract(): void {
    const deployed_contract: any = JSON.parse(ReadFile(config.get('blockchain.ethereum.contract.info')).toString());

    CONTRACT = new ENDPOINT.eth.Contract(deployed_contract['abi'], CONTRACT_ADDRESS);
    LISTENER = CONTRACT.events.EntryRegistered();

    LISTENER.on('data', async (event: EventData) => {
        // TODO: Uncomment (if needed)
        // DisplayGenericInformationAboutEvent(event);
        await ProcessEventRelatedToRegisteredEntry(event);
    });
}

export async function RegisterEntry(type: 'data' | 'trace', key: string, value: string): Promise<void> {
    try {
        console.log('[ETHEREUM] Starting miner...');
        ExecuteCommand(`geth attach ${ config.get('blockchain.ethereum.ipc') } --exec "loadScript('/home/vm/Ethereum/scripts/start-miner.js')"`);
        console.log('[ETHEREUM] Registering entry...');
        CONTRACT.methods.set(`${type}:${key}`, value).send({ from: ACCOUNT }).then(() => {
            console.log('[ETHEREUM] Entry registered');
            console.log('[ETHEREUM Stopping miner...');
            ExecuteCommand(`geth attach ${ config.get('blockchain.ethereum.ipc') } --exec "loadScript('/home/vm/Ethereum/scripts/stop-miner.js')"`);
            console.log('[ETHEREUM] Miner stopped');
        }).catch((error: Error) => {
            console.error('[ETHEREUM] An error occurred while registering entry');
            console.error(`[ETHEREUM] ${error}`);
            console.log('[ETHEREUM Stopping miner...');
            ExecuteCommand(`geth attach ${ config.get('blockchain.ethereum.ipc') } --exec "loadScript('/home/vm/Ethereum/scripts/stop-miner.js')"`);
            console.log('[ETHEREUM] Miner stopped');
        });
    } catch (error) {
        console.error('[ETHEREUM] An error occurred while registering entry');
        console.error(`[ETHEREUM] ${error}`);
        console.log('[ETHEREUM] Stopping miner...');
        ExecuteCommand(`geth attach ${ config.get('blockchain.ethereum.ipc') } --exec "loadScript('/home/vm/Ethereum/scripts/stop-miner.js')"`);
        console.log('[ETHEREUM] Miner stopped');
    }
}

export async function RetrieveEntry(type: 'data' | 'trace', key: string): Promise<{ key: string, value: string } | undefined> {
    try {
        const response: string = await CONTRACT.methods.get(`${type}:${key}`).call();
        return { key, value: response };
    } catch (error) {
        console.error('[ETHEREUM] An error occurred while retrieving entry');
        console.error(`[ETHEREUM] ${error}`);
    }
}

function DisplayGenericInformationAboutEvent(event: EventData): void {
    console.log(`[ETHEREUM] Event received: ${event['event']}`);
    console.log(`[ETHEREUM] Contract: ${event['address']}`);
    console.log(`[ETHEREUM] Block: ${event['blockNumber']}`);
    console.log(`[ETHEREUM] Transaction: ${event['transactionHash']}`);

    if (!empty(event['returnValues'])) {
        console.log(`[ETHEREUM] Data: ${JSON.stringify(event['returnValues'])}`);
    }
}

async function ProcessEventRelatedToRegisteredEntry(event: EventData): Promise<void> {
    try {
        const { key } = event['returnValues'];
        const key_information: string[] = key.split(':');

        if (key_information[0] === 'data') {
            await RegisterRecord(key_information[1], `ETHEREUM:${event['transactionHash']}`);
            console.log(`[ETHEREUM] Reference updated: ${key_information[1]}`);
        } else if (key_information[0] === 'trace') {
            switch (key_information[1]) {
                case 'process': {
                    await RegisterProcessTraceReference(key_information[2], { 'platform': 'ETHEREUM', 'identifier': event['transactionHash'], state: 'saved' });
                    break;
                }
                case 'version': {
                    await RegisterProcessVersionTraceReference(key_information[2], { 'platform': 'ETHEREUM', 'identifier': event['transactionHash'], state: 'saved' });
                    break;
                }
                case 'instance': {
                    await RegisterExecutionInstanceTraceReference(key_information[2], { 'platform': 'ETHEREUM', 'identifier': event['transactionHash'], state: 'saved' });
                    break;
                }
                case 'element': {
                    await RegisterProcessElementTraceReference(key_information[2], { 'platform': 'ETHEREUM', 'identifier': event['transactionHash'], state: 'saved' });
                    break;
                }
                default: throw new Error(`Invalid trace type found for key: ${key}`);
            }
            console.log(`[ETHEREUM] DLT reference added to trace: ${key_information[2]} (type: ${key_information[1]})`);
        } else {
            console.warn(`[ETHEREUM] WARNING: Unrecognized key type: ${key_information[0]}`);
        }
    } catch (error) {
        console.error('[ETHEREUM] An error occurred while handling received event');
        console.error(`[ETHEREUM] ${error}`);
    }
}

export { Initialize as InitializeEthereumConnector, Shutdown as ShutdownEthereumConnector };