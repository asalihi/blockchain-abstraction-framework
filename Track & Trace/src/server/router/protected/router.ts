import { Router } from 'express';

import { Routes as TrackAndTraceRoutes } from '@service/server/router/protected/track-and-trace';

const router: Router = Router({ mergeParams: true });

router.use('/', TrackAndTraceRoutes);

export { router as Router };