import { NextFunction, Request, Response, Router } from 'express';
import { parse, getTime as timestamp } from 'date-fns';

import { Maybe, Identifier, BadRequest, CustodianType, Custodian } from 'core';
import { GetCustodian, CreateCustodian, CountCustodians, FetchCustodians, GetEndpoint } from '@service/controllers/custodians';
import { ICustodianSchema, ICustodianModel } from '@service/database/schemata';

const router: Router = Router({ mergeParams: true });

// TODO: Add other paths (e.g. retrieval of all endpoints and configuration only, update of server specification or configuration, deactivation of a custodian, etc.)

// TODO: Handle errors

router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
        const parameters: any = req.query;
        const page: number = (parameters['page'] && parameters['page'] > 0) ? (Number.parseInt(parameters['page']) - 1) : 0;
        const size: number = parameters['size'] ? Number.parseInt(parameters['size']) : 10;
        const identifier: Maybe<string> = parameters['identifier'];
        const type: Maybe<CustodianType> = parameters['type'];
        const before: Maybe<string> = parameters['before'];
        const after: Maybe<string> = parameters['after'];
        const sort_field: Maybe<keyof Pick<Custodian, 'identifier' | 'type' | 'registration'>> = parameters['sort'];
        const sort_direction: Maybe<'asc' | 'desc'> = parameters['direction'];

        // TODO: Add support for filters based on server specification and configuration

        const filters: Object = Object.assign({}, { ...(identifier && { 'identifier': { '$regex': `^.*${identifier}.*$` } }) }, { ...(type && { 'type': { '$eq':type } }) }, { ...((before || after) && { 'creation': { ...(before && { '$lte': timestamp(parse(before, 'dd.MM.YYYY', new Date())) }), ...(after && { '$gte': timestamp(parse(after, 'dd.MM.YYYY', new Date())) }) } }) });

        const number_of_custodians: number = await CountCustodians(filters);
        let custodians: (ICustodianSchema & { '_id'?: string })[] = await FetchCustodians(Object.assign({ 'page': page, 'size': size, 'filters': filters }, { ...((sort_field && sort_direction) && { 'sort_field': sort_field }) }, { ...((sort_field && sort_direction) && { 'sort_direction': sort_direction }) }));

        const response: any = {
            'items': number_of_custodians,
            'pages': Math.ceil(number_of_custodians / size),
            'current': page,
            'size': custodians.length,
            'custodians': custodians.map(({ _id, ...attributes }) => attributes)
        };

        return res.status(200).json(response);
    } catch (error) {
        return next(error);
    }
});

router.get('/:custodian', async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
        const custodian: ICustodianModel = await GetCustodian(req.params.custodian);
        return res.status(200).send(custodian.toJSON());
	} catch (error) { return next(error) };
});

router.get('/:custodian/endpoint', async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
        const parameters: any = req.query;
        const custodian: Identifier = req.params.custodian;
        const description: Maybe<string> = parameters['description'];
        return res.status(200).send(GetEndpoint(custodian, description));
    } catch (error) { return next(error) };
});

router.post('/', async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
	try {
        const parameters: any = req.body;
        // TODO: Validate submitted parameters
		if (!parameters.type || !parameters.server) throw new BadRequest();

        const identifier: Identifier = await CreateCustodian(parameters);
		return res.status(200).send(identifier);
	} catch (error) { return next(error) };
});

// TODO: Add PUT support (see: https://stackoverflow.com/a/630475)

export { router as CustodianManagerRoutes };