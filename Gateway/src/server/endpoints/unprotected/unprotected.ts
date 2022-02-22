import { Router, Request, Response, NextFunction } from 'express';

import { IUserModel, CreateUserEntry, CountUsers } from '@service/database/schemata';
import { RemoveConfidentialProperties } from '@service/server/helpers';
import { UserRole } from '@service/utils/types';
import { BadRequest, InitializationError, UnauthorizedInitialization, UserManipulationError } from '@service/utils/errors';

let router: Router = Router({ mergeParams: true });

router.get('/statistics', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
	const superusers: number = await CountUsers({ role: { $eq: UserRole.SUPERUSER }});

	res.json({ superusers });
});

router.post('/initialize', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
	try {
		let superusers: number;

		try {
			superusers = await CountUsers({ role: { $eq: UserRole.SUPERUSER }});
		} catch {
			throw new InitializationError();
		}

		if (superusers > 0) throw new UnauthorizedInitialization();

		// TODO: Handle better the validation of parameters
		const parameters: any = req.body;
		if (!parameters.username || !parameters.password) throw new BadRequest();

		try {
			const superuser: IUserModel = await CreateUserEntry({ data: { username: parameters.username, password: parameters.password, role: UserRole.SUPERUSER } });
			res.status(200).send(RemoveConfidentialProperties(superuser));
		} catch {
			throw new UserManipulationError('creation', parameters.username);
		}
	} catch (error) {
		return next(error);
	}
});

export { router as UnprotectedEndpoints };