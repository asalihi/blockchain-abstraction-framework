import { Request, Response, NextFunction } from 'express';
import { authenticate } from 'passport';

import { IUserSchema } from '@service/database/schemata';
import { RemoveConfidentialProperties } from '@service/server/helpers';
import { AuthenticationFailed, LogoutFailed } from '@service/utils/errors';

export function AuthenticateWebUser(req: Request, res: Response, next: NextFunction): void {
	authenticate('http', (error: any, user: IUserSchema) => {
		if (error) {
			return next(new AuthenticationFailed());
		}
		else {
			req.login(user, (error: any): void => {
				if (error) return next(new AuthenticationFailed());
				else res.status(200).send(RemoveConfidentialProperties(user));
			});
		}
	})(req, res, next);
}

export function CheckIfWebUserIsAuthenticated(req: Request, res: Response, next: NextFunction): void {
	if (req.isAuthenticated()) return next();
	else return next(new AuthenticationFailed());
}

export function ClearWebSession(req: Request, res: Response, next: NextFunction): void {
	req.logout();
	req.session?.destroy((error: any) => {
		if (error) return next(new LogoutFailed());
		res.clearCookie('connect.sid');
		res.sendStatus(204);
	});
}