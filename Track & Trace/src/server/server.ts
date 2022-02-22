import config from 'config';
import { Server } from 'http';

import { SERVER_ENDPOINT } from 'core';
import { ExpressServer } from '@service/server/express';

const server: Server = new Server(ExpressServer);

export async function InitializeServer(): Promise<void> {
    server.listen(config.get('server.port'), () => { console.log(`Server started: ${SERVER_ENDPOINT}`) });
}

export { server as Server };