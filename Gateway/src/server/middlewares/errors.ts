import { NextFunction, Request, Response } from 'express';

import { BadRequest, InternalServerError, NotFoundError, ServerError } from '@service/utils/errors';

export function HandleNotFound(req: Request, res: Response, next: NextFunction): void {
	res.status(404).json((new NotFoundError(req.originalUrl)).json());
};

export function HandleErrors(error: Error, req: Request, res: Response, next: NextFunction): void {
	if (error instanceof ServerError) res.status(error.status).json(error.json());
	else if (error instanceof SyntaxError) res.status(400).json(new BadRequest().json());
	else res.status(500).json(new InternalServerError().json());
};