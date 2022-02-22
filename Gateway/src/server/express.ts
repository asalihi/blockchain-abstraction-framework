import express from 'express';
import passport from 'passport';

import '@service/server/configuration/passport';
import session from '@service/server/configuration/web-session';
import cors from '@service/server/configuration/cors';
import { HandleErrors, HandleNotFound } from '@service/server/middlewares/errors';
import { Router } from '@service/server/router';

const server = express();
server.use(express.urlencoded({ extended: true }));
server.use(express.json());
server.use(cors);
server.use(session);
server.use(passport.initialize());
server.use(passport.session());
server.use('/', Router);
server.use('/', HandleNotFound);
server.use('/', HandleErrors);

export { server as ExpressServer };