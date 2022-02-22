import { isEmpty } from 'lodash';

import { ExecuteCommand } from 'core';
import { SetupFabricManager, SetupEthereumManager, ShutdownEthereumConnector, ShutdownFabricConnector } from '@service/controllers/connectors/connectors';

export async function SetupManagers(): Promise<void> {
	console.log('Setting up managers...');
	UpdateListOfAvailablePackages();
    InstallToolsIfMissing(['curl']);
    SetExecutionPermissions(`./dist/scripts`);
    InstallDockerIfMissing();
    InstallDockerComposeIfMissing();
	await SetupEthereumManager();
    SetupFabricManager();
	console.log('Managers set up successfully');
}

export async function ShutdownManagers(): Promise<void> {
	await ShutdownEthereumConnector();
	ShutdownFabricConnector();
}

export function UpdateListOfAvailablePackages(): void {
	console.log('Updating list of available packages on running machine...');
	ExecuteCommand('apt-get update -y');
}

export function InstallToolsIfMissing(tools: string[]): void {
	for(const tool of tools) {
		if (isEmpty(ExecuteCommand(`bash -c 'which ${tool}'`))) {
			console.log(`WARNING: ${tool} is not installed`);
			InstallTool(tool);
		}
	}
}

export function InstallTool(tool: string): void {
	console.log(`Installing ${tool}...`);
	ExecuteCommand(`apt-get install ${tool} -y`);
	console.log(`${tool} installed successfully`);
}

export function SetExecutionPermissions(folder: string): void {
    ExecuteCommand(`find ${folder} -type f -name "*.*" -exec chmod '+x' {} \\;`);
}

export function InstallDockerIfMissing(): void {
    if (isEmpty(ExecuteCommand(`bash -c 'which docker'`))) {
		console.log('WARNING: docker is not installed');
		console.log('Installing docker...');
        ExecuteCommand('./dist/scripts/docker-install.sh');
        ExecuteCommand('systemctl start docker');
        ExecuteCommand('systemctl enable docker');
        ExecuteCommand('groupadd docker');
        ExecuteCommand('usermod -aG docker ${SUDO_USER:-$(whoami)}');
        ExecuteCommand('newgrp docker');
		console.log('docker installed successfully');
    }
}

export function InstallDockerComposeIfMissing(): void {
	if (isEmpty(ExecuteCommand(`bash -c 'which docker-compose'`))) {
		console.log('WARNING: docker-compose is not installed');
		console.log('Installing docker-compose...');
        ExecuteCommand('./dist/scripts/docker-compose-install.sh');
		console.log('docker-compose installed successfully');
	}
}