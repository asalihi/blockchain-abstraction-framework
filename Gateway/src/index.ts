require('dotenv-expand')(require('dotenv').config());
import config from 'config';
import mongoose from 'mongoose';
import { homedir } from 'os';

import { LOCAL_RSA_KEYS, CRYPTO_MATERIALS_FOLDER } from '@service/utils/constants';
import { RegisterModules } from '@service/controller/modules';
import { InitializeLocalJWKS, RetrieveExternalJWKS } from '@service/crypto/jwks';
import { Initialize as InitializeDatabase } from '@service/database/database';
import { SERVER_ENDPOINT, Server } from '@service/server/server';
// TODO URGENT: Uncomment
// import { StartRoutines } from '@service/utils/routines';

async function Initialize(): Promise<void> {
	// TODO URGENT: Uncomment
	// StartRoutines();
	// TODO: Use Promise.all when possible (note that order is important for some parts)
	try {
		await InitializeDatabase();
		await RegisterModules();
		await InitializeLocalJWKS({ keys: LOCAL_RSA_KEYS, location: CRYPTO_MATERIALS_FOLDER });
		await RetrieveExternalJWKS();
		// TODO: move logic in dedicated file
		Server.listen(config.get('server.port'), () => { console.log(`Server started: ${SERVER_ENDPOINT}`) });
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
	process.exit(0);
});

process.on('SIGINT', () => {
	Server.close();
	mongoose.disconnect();
	process.exit(0);
});

Initialize();