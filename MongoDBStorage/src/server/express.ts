import express from 'express';

import { Router as CoreRouter, CORS_STRATEGY, HandleNotFound, HandleErrors } from 'core';
import { KeyStore } from '@service/server/router/keystore';
import { Router as LocalRouter } from '@service/server/router/router';

const server: express.Express = express();

const test_router: express.Router = express.Router({ mergeParams: true });

test_router.get('/', async (req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> => {
	res.status(200).json({ 'response': 500 });
});

server.use(express.urlencoded({ extended: true }));
server.use(express.urlencoded({ extended: false }));
server.use(express.json());
server.use(CORS_STRATEGY);
server.use('/.well-known/jwks.json', KeyStore);
server.use('/test', test_router);
server.use('/', CoreRouter);
server.use('/', LocalRouter);
server.use('/', HandleNotFound);
server.use('/', HandleErrors);

export { server as ExpressServer };