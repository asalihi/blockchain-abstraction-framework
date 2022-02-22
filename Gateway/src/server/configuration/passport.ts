import passport from 'passport';
import { BasicStrategy } from 'passport-http';

import { IUserModel } from '@service/database/schemata';
import { GetUserEntry } from '@service/database/schemata';

passport.use('http', new BasicStrategy(async (username: string, password: string, done: (error: any, user?: any) => void) => {
	try {
		const user: IUserModel = await GetUserEntry(username);
		if (user.verify_password(password)) {
			done(null, user);
		} else {
			done(null, false);
		}
	} catch (error) {
		done(error, false);
	}
}));

passport.serializeUser((user: Express.User, done: (error: any, user?: any) => void) => {
	done(null, (user as IUserModel).username);
});

passport.deserializeUser(async (username: string, done: (error: any, user?: any) => void) => {
	try {
		const user: IUserModel = await GetUserEntry(username);
		done(null, user);
	} catch (error) {
		done(error, false);
	}
});