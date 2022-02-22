import { Router, Request, Response, NextFunction } from 'express';

import { ExtractUsernameFromTokenPayload, VerifySessionExpiration, UpdateAPISession } from '@service/server/middlewares/api-authentication';
import { GenerateNewPairOfTokens } from '@service/server/helpers';

let router: Router = Router({ mergeParams: true });

router.post('/renew', ExtractUsernameFromTokenPayload, VerifySessionExpiration, UpdateAPISession, (req: Request, res: Response, next: NextFunction): void => {
	try {
		res.status(200).send(GenerateNewPairOfTokens(res.locals.username, res.locals.session.identifier, res.locals.last_used_token.encoded, res.locals.session.last_used_token.salt));
	} catch (error) {
		return next(error);
	}
});

export { router as APISession };