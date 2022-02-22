import { NextFunction, Request, Response, Router } from 'express';

import { BadRequest } from 'core';
import { DeployInstance } from '@service/controllers/platforms';

const router: Router = Router({ mergeParams: true });

router.get('/instances/:instance', (req: Request, res: Response, next: NextFunction): void => {
	
});

router.post('/instances', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
	const parameters: any = req.body;

    console.log('ENDPOINT: Deployment of an instance');

    if (parameters['identifier'] && parameters['network']) {
        try {
            console.log('Parameters OK, trying to deploy the instance...');
			await DeployInstance(parameters['identifier'], parameters['network']);
            res.status(200);
        } catch (error) {
            next(error);
        }
    }
    else next(new BadRequest('missing instance information'));
});

export { router as Routes };