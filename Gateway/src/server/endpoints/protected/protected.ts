import { AxiosResponse } from 'axios';
import { Router, Request, Response, NextFunction } from 'express';

import { IUserModel, GetUserEntry, CreateUserEntry, RemoveUserEntry } from '@service/database/schemata';
import { GetEndpoint, RetrieveCaller, RemoveConfidentialProperties } from '@service/server/helpers';
import { UserRole } from '@service/utils/types';
import { UserNotFound, BadRequest, PermissionDenied, UserManipulationError, ElementNotFoundInCollection } from '@service/utils/errors';

let router: Router = Router({ mergeParams: true });

router.get('/users/:username', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
	try {
		const user: IUserModel = await GetUserEntry(req.params.username);
		res.send(RemoveConfidentialProperties(user));
	} catch (error) {
		if (error instanceof ElementNotFoundInCollection) throw new UserNotFound(req.params.username);
		else throw new UserManipulationError('retrieval', req.params.username);
	}
});

router.post('/users', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
	try {
		const parameters: any = req.body;
		if (!parameters.username || !parameters.password) throw new BadRequest();

		const caller: IUserModel = await RetrieveCaller(req, GetEndpoint(req.params.endpoint));
		if (![UserRole.ADMIN, UserRole.SUPERUSER].includes(caller.role)) throw new PermissionDenied(caller.role, [UserRole.ADMIN, UserRole.SUPERUSER]);

		try {
			const role: UserRole = parameters.role || UserRole.USER;
			const user: IUserModel = await CreateUserEntry({ data: { username: parameters.username, password: parameters.password, role: role } });
			res.status(200).send(RemoveConfidentialProperties(user));
		} catch {
			throw new UserManipulationError('creation', parameters.username);
		}
	} catch (error) { return next(error) };
});

router.delete('/users/:username', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
	try {
		const parameters: any = req.body;
		if (!parameters.username) throw new BadRequest();

		const caller: IUserModel = await RetrieveCaller(req, GetEndpoint(req.params.endpoint));
		if (![UserRole.ADMIN, UserRole.SUPERUSER].includes(caller.role)) throw new PermissionDenied(caller.role, [UserRole.ADMIN, UserRole.SUPERUSER]);

		try {
			const user: IUserModel = await RemoveUserEntry(parameters.username);
			res.status(200).send(RemoveConfidentialProperties(user));
		} catch (error) {
			if (error instanceof ElementNotFoundInCollection) throw new UserNotFound(parameters.username);
			else throw new UserManipulationError('deletion', parameters.username);
		}
	} catch (error) { return next(error) };
});

export { router as ProtectedEndpoints };