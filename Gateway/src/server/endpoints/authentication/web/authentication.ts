import { Router } from 'express';

import { AuthenticateWebUser, ClearWebSession } from '@service/server/middlewares/web-authentication';

let router: Router = Router({ mergeParams: true });

router.post('/authenticate', AuthenticateWebUser);

router.post('/logout', ClearWebSession);

export { router as WebAuthentication };