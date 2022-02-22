import { Router } from 'express';

import { DataManagerRoutes } from '@service/server/router/data';
import { MainRoutes} from '@service/server/router/routes';

const router: Router = Router({ mergeParams: true });

router.use('/data', DataManagerRoutes);
router.use('/', MainRoutes);

export { router as Router };