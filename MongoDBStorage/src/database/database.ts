import { Connection } from 'mongoose';

import { DATABASE_CONNECTION_STRING, ConnectToMongoDB } from 'core';
import { InitializeModels } from './schemata';

export let DATABASE_CONNECTION: Connection;

export async function InitializeDatabase(): Promise<void> {
    DATABASE_CONNECTION = await ConnectToMongoDB(DATABASE_CONNECTION_STRING);
    await InitializeModels(DATABASE_CONNECTION);
}