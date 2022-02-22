import { NextFunction, Request, Response } from 'express';

export function DisableCache(req: Request, res: Response, next: NextFunction): void {
	res.set({
		'Surrogate-Control': 'no-store',
		'Cache-Control': 'no-store, no-cache, must-revalidate, private, proxy-revalidate',
		'Pragma': 'no-cache',
		'Expires': '0'
	});
	return next();
}