import { ChildProcess, spawn } from 'child_process';
import { ShellString } from 'shelljs';
import config from 'config';

import { Sleep, ExecuteCommand, WriteFile, ReplaceSpacesAndRemoveUppercases, Identifier, GenericObject, DLTInstanceProfile, DEFAULT_ETHEREUM_NETWORK_PROFILE, BASH_COMMAND_AS_SUDO_USER, ETHEREUM_FOLDER_FOR_DEPLOYED_NETWORKS, DEFAULT_ETHEREUM_GENESIS_BLOCK } from 'core';
import { CreateDLTInstanceEntry, IEthereumNetworkModel, GetDLTInstanceEntry } from '@service/database/schemata';
import { InitializeEthereumConnector } from './controller';

export let BACKGROUND_PROCESS: ChildProcess;

async function DeployInstance(identifier: Identifier = config.get('blockchain.ethereum.identifier'), genesis: GenericObject = DEFAULT_ETHEREUM_GENESIS_BLOCK): Promise<void> {
    console.log('Deploying Ethereum network...');

    // TODO: Validate genesis configuration using AJV (see example with HL Fabric)

    const profile: DLTInstanceProfile = DEFAULT_ETHEREUM_NETWORK_PROFILE;
    
    console.log('Creating DLT instance entry...');

    // Creation of the instance in the database
    await CreateDLTInstanceEntry({ network: 'ethereum', identifier, genesis, profile });

    console.log('DLT instance entry created successfully');

    // TODO: Handle update of instance entry
    const instance: IEthereumNetworkModel = await GetDLTInstanceEntry(identifier, 'ethereum') as IEthereumNetworkModel;
    instance.set('state', 'installing');
    await instance.save();

    ExecuteCommand(`${BASH_COMMAND_AS_SUDO_USER} -c 'mkdir -p ${ETHEREUM_FOLDER_FOR_DEPLOYED_NETWORKS}/${ReplaceSpacesAndRemoveUppercases(identifier)}/{data,scripts}'`);
    WriteFile({ 'location': `${ETHEREUM_FOLDER_FOR_DEPLOYED_NETWORKS}/${ReplaceSpacesAndRemoveUppercases(identifier)}`, 'name': 'genesis.json'}, genesis);
    ExecuteCommand(`geth --datadir ${ETHEREUM_FOLDER_FOR_DEPLOYED_NETWORKS}/${ReplaceSpacesAndRemoveUppercases(identifier)}/data init ${ETHEREUM_FOLDER_FOR_DEPLOYED_NETWORKS}/${ReplaceSpacesAndRemoveUppercases(identifier)}/genesis.json`);

    console.log('Starting network...');
    ExecuteCommand(`geth --datadir ${ETHEREUM_FOLDER_FOR_DEPLOYED_NETWORKS}/${ReplaceSpacesAndRemoveUppercases(identifier)}/data --networkid ${genesis['config']['chainId']}`);

    BACKGROUND_PROCESS = spawn('geth', ['--ws', '--ws.api', 'eth,web3,personal,miner,net,txpool', '--http', '--http.api', 'eth,web3,personal,miner,net,txpool', '--allow-insecure-unlock', '--datadir', `${ETHEREUM_FOLDER_FOR_DEPLOYED_NETWORKS}/${ReplaceSpacesAndRemoveUppercases(identifier)}/data`, '--networkid', genesis['config']['chainId'], '--miner.threads', 1, '--nodiscover', '--gcmode', 'archive'], {
        stdio: 'ignore',
        detached: true
    });
    BACKGROUND_PROCESS.unref();
    
    console.log('Creating account...');
    const account_creation_response: ShellString = ExecuteCommand(`geth attach ${ETHEREUM_FOLDER_FOR_DEPLOYED_NETWORKS}/${ReplaceSpacesAndRemoveUppercases(identifier)}/data/geth.ipc --exec "personal.newAccount()"`);
    const account: string = account_creation_response.stdout;
    ExecuteCommand(`geth attach ${ETHEREUM_FOLDER_FOR_DEPLOYED_NETWORKS}/${ReplaceSpacesAndRemoveUppercases(identifier)}/data/geth.ipc --exec "personal.newAccount('password')"`);

    const start_miner_script: string = `personal.unlockAccount("${account}", "password");
    miner.start();`;
    WriteFile({ 'location': `${ETHEREUM_FOLDER_FOR_DEPLOYED_NETWORKS}/${ReplaceSpacesAndRemoveUppercases(identifier)}/scripts`, 'name': 'start-miner.js'}, start_miner_script);
    
    const stop_miner_script: string = `personal.unlockAccount("${account}", "password");
    miner.stop();`;
    WriteFile({ 'location': `${ETHEREUM_FOLDER_FOR_DEPLOYED_NETWORKS}/${ReplaceSpacesAndRemoveUppercases(identifier)}/scripts`, 'name': 'stop-miner.js'}, stop_miner_script);
    
    console.log('Starting miner to earn some ETH (10s)');
    ExecuteCommand(`geth attach ${ETHEREUM_FOLDER_FOR_DEPLOYED_NETWORKS}/${ReplaceSpacesAndRemoveUppercases(identifier)}/data/geth.ipc --exec "loadScript('${ETHEREUM_FOLDER_FOR_DEPLOYED_NETWORKS}/${ReplaceSpacesAndRemoveUppercases(identifier)}/scripts/start-miner.js')"`);
    await Sleep(10000);
    ExecuteCommand(`geth attach ${ETHEREUM_FOLDER_FOR_DEPLOYED_NETWORKS}/${ReplaceSpacesAndRemoveUppercases(identifier)}/data/geth.ipc --exec "loadScript('${ETHEREUM_FOLDER_FOR_DEPLOYED_NETWORKS}/${ReplaceSpacesAndRemoveUppercases(identifier)}/scripts/stop-miner.js')"`);
    console.log('Miner stopped');

    // Set up Truffle configuration
    // TODO: Define specific Truffle environment for each deployed instance
    console.log('Generating Truffle configuration file...');
    const truffle_configuration = `module.exports = {
        networks: {
          development: {
            host: "localhost",
            port: 8545,
            network_id: "*",
            gas: 6721975,
            from: "${account}"
           }
        },
      
        compilers: {
          solc: {
            version: "0.8.9"
          }
        }
      };`;
      WriteFile({ 'location': `${ETHEREUM_FOLDER_FOR_DEPLOYED_NETWORKS}/truffle`, 'name': 'truffle-config.js'}, truffle_configuration);

    // TODO: Handle update of instance entry
    instance.set('state', 'active');
    instance.set('configuration', { 'account': account, 'password': config.get('blockchain.ethereum.password') });
    instance.markModified('configuration');
    await instance.save();

    await InitializeEthereumConnector();

    console.log('Network has been deployed successfully');
}

export { DeployInstance as DeployEthereumInstance };