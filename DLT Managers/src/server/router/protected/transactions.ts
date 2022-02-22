import { NextFunction, Request, Response, Router } from 'express';

const router: Router = Router({ mergeParams: true });

router.get('/instances/:instance/transactions/:transaction', (req: Request, res: Response, next: NextFunction): void => {
	
});

router.get('/instances/:instance/transactions/:transaction/raw', (req: Request, res: Response, next: NextFunction): void => {
	
});

router.post('/instances/:instance/transactions', (req: Request, res: Response, next: NextFunction): void => {
	res.status(200).send(req.body);
});

export { router as Routes };