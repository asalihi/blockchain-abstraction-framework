import express from 'express';

import { Router as CoreRouter, CORS_STRATEGY, HandleNotFound, HandleErrors } from 'core';
import { KeyStore } from '@service/server/router/keystore';
import { Router as LocalUnprotectedRouter } from '@service/server/router/unprotected/router';
import { Router as LocalProtectedRouter } from '@service/server/router/protected/router';

const server: express.Express = express();

server.use(express.urlencoded({ extended: true }));
server.use(express.urlencoded({ extended: false }));
server.use(express.json());
server.use(CORS_STRATEGY);
server.use('/.well-known/jwks.json', KeyStore);
server.use('/', LocalUnprotectedRouter);
//server.use('/', CoreRouter);
server.use('/', LocalProtectedRouter);
server.use('/', HandleNotFound);
server.use('/', HandleErrors);

export { server as ExpressServer };