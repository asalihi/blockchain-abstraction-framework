import { Router } from 'express';

import { AuthenticateAPIUser } from '@service/server/middlewares/api-authentication';

let router: Router = Router({ mergeParams: true });

router.post('/authenticate', AuthenticateAPIUser);

export { router as APIAuthentication };