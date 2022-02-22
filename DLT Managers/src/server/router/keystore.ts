import { Router, Request, Response, NextFunction } from 'express';

import { LOCAL_KEY_STORE, InternalServerError } from 'core';

let router: Router = Router({ mergeParams: true });

router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
	try {
		res.status(200).json(LOCAL_KEY_STORE.json());
	} catch {
		next(new InternalServerError());
	}
});

export { router as KeyStore };