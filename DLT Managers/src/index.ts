require('dotenv-expand')(require('dotenv').config());
import config from 'config';
import mongoose from 'mongoose';
import yn from 'yn';

import { RegisterProcessShutdownListener, Shutdown, HOME_DIRECTORY, VerifyPlatform, RetrieveGatewayJWKS, InitializeLocalJWKS } from 'core';
import { InitializeDatabase } from '@service/database/database';
import { LOCAL_RSA_KEYS } from '@service/constants/constants';
import { InitializeMessageQueue } from '@service/rabbitmq/rabbitmq';
import { SetupRoutines } from '@service/routines/routines';
import { InitializeServer, Server } from '@service/server/server';
import { SetupManagers, ShutdownManagers } from '@service/controllers/initialization';

async function Initialize(): Promise<void> {
	/* TODO IMMEDIATELY: UNCOMMENT THESE LINES + ADD GENERATION OF LOCAL KEYSTORE
	await Promise.all([InitializeDatabase(), InitializeMessageQueue(), InitializeServer(), SetupRoutines()]);*/

	// TODO URGENT: DELETE NEXT LINES

	try {
		VerifyPlatform();
		RegisterShutdownListeners();
		console.log('Initializing database...');
		await InitializeDatabase();
		console.log('Database initialized');
		console.log('Generating local keystore...');
		InitializeLocalJWKS({ keys: LOCAL_RSA_KEYS, location: `${HOME_DIRECTORY}/${config.get('crypto.materials.folder') ?? (config.get('platform') + '/' + config.get('module'))}` });
		console.log('Local keystore generated');
		console.log('Initializing server...');
		await InitializeServer();
		console.log('Server initialized successfully');
		if (yn(config.get('core.secure_mode'), { default: true })) {
			console.log('Retrieving gateway keystore...');
			await RetrieveGatewayJWKS();
			console.log('Keystore of gateway successfully retrieved');
		}
		await SetupManagers();
	} catch (error) {
		// TODO: Log error
		console.error('AN ERROR OCCURRED DURING INITIALIZATION');
		console.error(error);
		return await Shutdown();
	};
}

function RegisterShutdownListeners(): void {
	RegisterProcessShutdownListener('server shutdown', async () => Server.close());
	RegisterProcessShutdownListener('database disconnection', async () => mongoose.disconnect());
	RegisterProcessShutdownListener('managers shutdown', async () => ShutdownManagers());
}

Initialize();