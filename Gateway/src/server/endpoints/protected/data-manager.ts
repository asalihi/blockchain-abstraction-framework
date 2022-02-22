import { AxiosResponse } from 'axios';
import { Router, Request, Response, NextFunction } from 'express';

import { IModuleModel, GetModuleEntry } from '@service/database/schemata';
import { ExecuteHTTPRequest } from '@service/utils/helpers';
import { HTTPMethod } from '@service/utils/types';

const router: Router = Router({ mergeParams: true });

router.all('/*', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
	try {
		const data_manager_module: IModuleModel = await GetModuleEntry('data-manager');
		const response: AxiosResponse = await ExecuteHTTPRequest(`${data_manager_module.get('server')}${req.url}`, req.method as HTTPMethod, { parameters: req.body });
		res.status(response.status).send(response.data);
	} catch (error) {
		next(error);
	}
});

export { router as DataManagerEndpoints };