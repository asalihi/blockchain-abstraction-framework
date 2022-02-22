import config from 'config';
import session from 'express-session';
import MongoStore from 'connect-mongo';

import { DATABASE_CONNECTION_STRING } from '@service/database/database';

export default session({ secret: config.get('server.secret'), store: MongoStore.create({ mongoUrl: DATABASE_CONNECTION_STRING, collectionName: 'web-sessions' }), resave: false, saveUninitialized: false, cookie: { httpOnly: true, maxAge: Number(config.get('server.cookie.max_age')) } });