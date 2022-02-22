import { NextFunction, Request, Response, Router } from 'express';

import { Maybe, Identifier, RegisteredData, BadRequest } from 'core';
import { RegisterData, RetrieveData, CountDataEntries, FetchDataEntries } from '@service/controllers/data';
import { IDataSchema, IDataModel } from '@service/database/schemata';

const router: Router = Router({ mergeParams: true });

router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
        const parameters: any = req.query;
        const page: number = (parameters['page'] && parameters['page'] > 0) ? (Number.parseInt(parameters['page']) - 1) : 0;
        const size: number = parameters['size'] ? Number.parseInt(parameters['size']) : 10;
        const identifier: Maybe<Identifier> = parameters['identifier'];
        const signed: Maybe<boolean> = parameters['signature'];
        const encrypted: Maybe<boolean> = parameters['encryption'];

        const filters: Object = Object.assign({}, { ...(identifier && { 'identifier': { '$regex': `^.*${identifier}.*$` } }) }, { ...((typeof signed !== 'undefined') && (signed !== null) && { 'signature': { '$ne': null } }) }, { ...((typeof encrypted !== 'undefined') && (encrypted !== null) && { 'encryption': { '$ne': null } }) });

        const number_of_data_entries: number = await CountDataEntries(filters);
        let data_entries: (IDataSchema & { '_id'?: string })[] = await FetchDataEntries({ 'page': page, 'size': size, 'filters': filters });

        const response: any = {
            'items': number_of_data_entries,
            'pages': Math.ceil(number_of_data_entries / size),
            'current': page,
            'size': data_entries.length,
            'entries': data_entries.map(({ _id, ...attributes }) => attributes)
        };

        return res.status(200).json(response);
    } catch (error) {
        return next(error);
    }
});

router.get('/:identifier', async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
        const data: IDataModel = await RetrieveData(req.params.identifier);
        return res.status(200).send(data.toJSON());
    } catch (error) { return next(error) };
});

router.post('/', async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
        const parameters: any = req.body;
        // TODO: Validate submitted parameters
        if (!parameters.data) throw new BadRequest();

        const registered_data: IDataModel = await RegisterData(parameters.data as Omit<RegisteredData, 'identifier' | 'metadata'>);
        return res.status(200).send(registered_data.toJSON());
    } catch (error) { return next(error) };
});

// TODO: Add PUT support (see: https://stackoverflow.com/a/630475)

export { router as DataManagerRoutes };