import { Router } from 'express';

import { CustodianManagerRoutes } from '@service/server/router/custodians';
import { ReferenceManagerRoutes } from '@service/server/router/references';
import { RepositoryManagerRoutes } from '@service/server/router/repositories';
import { MainRoutes } from '@service/server/router/routes';

const router: Router = Router({ mergeParams: true });

router.use('/custodians', CustodianManagerRoutes);
router.use('/references', ReferenceManagerRoutes);
router.use('/repositories', RepositoryManagerRoutes);
router.use('/', MainRoutes);

export { router as Router };