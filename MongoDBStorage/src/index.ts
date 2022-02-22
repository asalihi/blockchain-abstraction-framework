require('dotenv-expand')(require('dotenv').config());

import config from 'config';
import mongoose from 'mongoose';
import { homedir } from 'os';
import yn from 'yn';

import { InitializeLocalJWKS, RetrieveGatewayJWKS } from 'core';
import { LOCAL_RSA_KEYS } from '@service/constants/constants';
import { InitializeDatabase } from '@service/database/database';
import { InitializeMessageQueue } from '@service/rabbitmq/rabbitmq';
import { SetupRoutines } from '@service/routines/routines';
import { InitializeServer, Server } from '@service/server/server';

async function Initialize(): Promise<void> {
	// TODO URGENT: Replace existing Promise.all with commented line
	// await Promise.all([InitializeDatabase(), InitializeMessageQueue(), InitializeServer(), SetupRoutines()]);
	try {
		await Promise.all([InitializeDatabase(), InitializeServer()]);

		await InitializeLocalJWKS({ keys: LOCAL_RSA_KEYS, location: `${homedir()}/${config.get('crypto.materials.folder') ?? config.get('platform') + '/' + config.get('module')}` });

		if (yn(config.get('core.secure_mode'), { default: true })) await RetrieveGatewayJWKS();
	} catch (error) {
		// Log error
		console.error('AN ERROR OCCURRED DURING INITIALIZATION');
		console.error(error);
		process.exit(1);
	}
}

process.on('exit', () => {
	Server.close();
	mongoose.disconnect();
});

process.on('SIGINT', () => {
	Server.close();
	mongoose.disconnect();
});

Initialize();