import { NextFunction, Request, Response, Router } from 'express';

import { HTTPMethod, ExecuteHTTPRequest } from 'core';

const router: Router = Router({ mergeParams: true });

// TODO URGENT: DELETE
router.post('/test', (req: Request, res: Response, next: NextFunction): void => {
	res.status(200).send(req.body);
});

// TODO URGENT: DELETE
router.get('/test', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
	const response = await ExecuteHTTPRequest('http://localhost:3000/internal/mongodb-storage/test', HTTPMethod.GET);
	res.status(response.status).send(response.data);
});

export { router as MainRoutes };