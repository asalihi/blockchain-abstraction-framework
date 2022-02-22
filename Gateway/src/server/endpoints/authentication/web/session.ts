import { Router, Request, Response, NextFunction } from 'express';

import { RemoveConfidentialProperties } from '@service/server/helpers';
import { IUserModel } from '@service/database/schemata';

let router: Router = Router({ mergeParams: true });

router.get('/', (req: Request, res: Response, next: NextFunction): void => {
	res.status(200).send(RemoveConfidentialProperties(req.user as IUserModel));
});

export { router as WebSession };