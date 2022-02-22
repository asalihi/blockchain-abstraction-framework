import config from 'config';
import { Server } from 'http';

import { ExpressServer } from '@service/server/express';

const SERVER_ENDPOINT: string = `${config.get('server.protocol')}://${config.get('server.host')}:${config.get('server.port')}`;

const server: Server = new Server(ExpressServer);

export { SERVER_ENDPOINT, server as Server };