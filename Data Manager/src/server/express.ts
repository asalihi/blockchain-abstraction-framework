import express from 'express';

import { Router as CoreRouter, CORS_STRATEGY, HandleNotFound, HandleErrors } from 'core';
import { KeyStore } from '@service/server/router/keystore';
import { Router as LocalRouter } from '@service/server/router/router';

const server: express.Express = express();

server.use(express.urlencoded({ extended: true }));
server.use(express.urlencoded({ extended: false }));
server.use(express.json());
server.use(CORS_STRATEGY);
server.use('/.well-known/jwks.json', KeyStore);
server.use('/', CoreRouter);
server.use('/', LocalRouter);
server.use('/', HandleNotFound);
server.use('/', HandleErrors);

export { server as ExpressServer };