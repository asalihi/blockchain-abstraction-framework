import { Router, Request, Response, NextFunction } from 'express';

import { GetModule, CountModules, FetchModules, RegisterModule } from '@service/controller/modules';
import { IModuleSchema, IModuleModel } from '@service/database/schemata';
import { Maybe, Module } from '@service/utils/types';
import { BadRequest } from '@service/utils/errors';

const router: Router = Router({ mergeParams: true });

router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
        const parameters: any = req.query;
        const page: number = (parameters['page'] && parameters['page'] > 0) ? (Number.parseInt(parameters['page']) - 1) : 0;
        const size: number = parameters['size'] ? Number.parseInt(parameters['size']) : 10;
        const identifier: Maybe<string> = parameters['identifier'];
        const name: Maybe<string> = parameters['name'];
        const description: Maybe<string> = parameters['description'];
        const server: Maybe<string> = parameters['server'];
        const sort_field: Maybe<keyof Pick<Module, 'identifier' | 'name' | 'description' | 'server'>> = parameters['sort'];
        const sort_direction: Maybe<'asc' | 'desc'> = parameters['direction'];

        const filters: Object = Object.assign({}, { ...(identifier && { 'identifier': { '$regex': `^.*${identifier}.*$` } }) }, { ...(name && { 'name': { '$regex': `^.*${name}.*$` } }) }, { ...(description && { 'description': { '$regex': `^.*${description}.*$` } }) }, { ...(server && { 'server': { '$regex': `^.*${server}.*$` } }) });

        const number_of_modules: number = await CountModules(filters);
        let modules: (IModuleSchema & { '_id'?: string })[] = await FetchModules(Object.assign({ 'page': page, 'size': size, 'filters': filters }, { ...((sort_field && sort_direction) && { 'sort_field': sort_field }) }, { ...((sort_field && sort_direction) && { 'sort_direction': sort_direction }) }));

        const response: any = {
            'items': number_of_modules,
            'pages': Math.ceil(number_of_modules / size),
            'current': page,
            'size': modules.length,
            'modules': modules.map(({ _id, ...attributes }) => attributes)
        };

        return res.status(200).json(response);
    } catch (error) {
        return next(error);
    }
});

router.get('/:module', async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
        const module: IModuleModel = await GetModule(req.params.custodian);
        return res.status(200).send(module.toJSON());
    } catch (error) { return next(error) };
});

router.post('/', async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
        const parameters: any = req.body;
        // TODO: Validate submitted parameters
        if (!parameters.identifier || !parameters.name || !parameters.server) throw new BadRequest();

        const module: IModuleModel = await RegisterModule(parameters);
        return res.status(200).send(module.toJSON());
    } catch (error) { return next(error) };
});

// TODO: Add PUT support (see: https://stackoverflow.com/a/630475)

export { router as ModuleManagerEndpoints };