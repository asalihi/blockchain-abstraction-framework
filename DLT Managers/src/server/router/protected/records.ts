import { NextFunction, Request, Response, Router } from 'express';

const router: Router = Router({ mergeParams: true });

router.get('/:record', (req: Request, res: Response, next: NextFunction): void => {
	
});

router.post('/', (req: Request, res: Response, next: NextFunction): void => {
	res.status(200).send(req.body);
});

export { router as Routes };