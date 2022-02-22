import { Router } from 'express';

import { Routes as PlatformManagerRoutes } from '@service/server/router/protected/platforms';
import { Routes as RecordManagerRoutes } from '@service/server/router/protected/records';
import { Routes as TransactionManagerRoutes } from '@service/server/router/protected/transactions';
import { Routes as ContractManagerRoutes } from '@service/server/router/protected/contracts';

const router: Router = Router({ mergeParams: true });

router.use('/records', RecordManagerRoutes);
router.use('/', PlatformManagerRoutes);
router.use('/', TransactionManagerRoutes);
router.use('/', ContractManagerRoutes);

export { router as Router };