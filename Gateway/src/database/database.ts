import config from 'config';
import mongoose from 'mongoose';

import { Initialize as InitializeSchemata } from '@service/database/schemata';

mongoose.set('debug', config.has('core.debug') ? config.get('core.debug') : false);

export const DATABASE_CONNECTION_STRING: string = `mongodb://${config.get('database.user')}:${config.get('database.password')}@${config.get('database.host')}:${config.get('database.port')}/${config.get('database.name')}?replicaSet=rs`;

async function Connect(): Promise<void> {
    await mongoose.connect(DATABASE_CONNECTION_STRING).catch(() => Connect());
    mongoose.connection.on('open', () => console.log('Connection to database established'));
    mongoose.connection.on('disconnected', () => console.log('Disconnected from database'));
    mongoose.connection.on('error', () => {
        console.log('Error occurred during connection to database');
    });
}

export async function Initialize(): Promise<void> {
    await Connect();
    await InitializeSchemata();
}