import { NextFunction, Request, Response, Router } from 'express';

const router: Router = Router({ mergeParams: true });

// TODO URGENT: DELETE
router.get('/test', (req: Request, res: Response, next: NextFunction): void => {
	res.status(200).send('OK');
});

router.post('/test', (req: Request, res: Response, next: NextFunction): void => {
	res.status(200).send(req.body);
});

export { router as UnprotectedRoutes };