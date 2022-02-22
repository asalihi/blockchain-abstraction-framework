import { Router } from 'express';

import { UnprotectedRoutes } from '@service/server/router/unprotected/routes';

const router: Router = Router({ mergeParams: true });

router.use('/', UnprotectedRoutes);

export { router as Router };