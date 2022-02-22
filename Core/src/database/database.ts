import config from 'config';
import { connect, connection, Connection, set } from 'mongoose';

import { InitializeModels } from '@core/database/schemata';

set('debug', config.has('core.debug') ? config.get('core.debug') : false);

const DATABASE_CONNECTION_STRING: string = `mongodb://${config.get('database.user')}:${config.get('database.password')}@${config.get('database.host')}:${config.get('database.port')}/${config.get('database.name')}?replicaSet=rs`;

async function Connect(connection_string?: string): Promise<Connection> {
    connection.on('open', () => console.log('Connection to database established'));
    connection.on('disconnected', () => console.log('Disconnected from database'));
    connection.on('error', () => {
        console.log('Error occurred during connection to database');
    });
    await connect(connection_string ?? DATABASE_CONNECTION_STRING).catch(() => Connect(connection_string));
    await InitializeModels();
    return connection;
}

export * from '@core/database/schemata';
export { DATABASE_CONNECTION_STRING, Connect as ConnectToMongoDB };