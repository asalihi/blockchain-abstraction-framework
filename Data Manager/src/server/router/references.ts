import { NextFunction, Request, Response, Router } from 'express';
import { parse, getTime as timestamp } from 'date-fns';

import { Maybe, Identifier, StoredReference, BadRequest } from 'core';
import { RetrieveData } from '@service/controllers/custodians';
import { RegisterReference, GetReference, FetchReferences, CountReferences, RegisterRecord } from '@service/controllers/references';
import { IReferenceModel, IReferenceSchema } from '@service/database/schemata';
import { RegisteredData } from 'core';
import { LeanDocument } from 'mongoose';

const router: Router = Router({ mergeParams: true });

// TODO: Handle errors

router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
        const parameters: any = req.query;
        const page: number = (parameters['page'] && parameters['page'] > 0) ? (Number.parseInt(parameters['page']) - 1) : 0;
        const size: number = parameters['size'] ? Number.parseInt(parameters['size']) : 10;
        const identifier: Maybe<Identifier> = parameters['identifier'];
        const repository: Maybe<Identifier> = parameters['repository'];
        const before: Maybe<string> = parameters['before'];
        const after: Maybe<string> = parameters['after'];
        const sort_field: Maybe<keyof Pick<StoredReference, 'identifier' | 'creation' | 'repository'>> = parameters['sort'];
        const sort_direction: Maybe<'asc' | 'desc'> = parameters['direction'];

        const filters: Object = Object.assign({}, { ...(identifier && { 'identifier': { '$regex': `^.*${identifier}.*$` } }) }, { ...(repository && { 'repository': { '$regex': `^.*${repository}.*$` } }) }, { ...((before || after) && { 'creation': { ...(before && { '$lte': timestamp(parse(before, 'dd.MM.YYYY', new Date())) }), ...(after && { '$gte': timestamp(parse(after, 'dd.MM.YYYY', new Date())) }) } }) });

        const number_of_references: number = await CountReferences(filters);
        let references: (IReferenceSchema & { '_id'?: string })[] = await FetchReferences(Object.assign({ 'page': page, 'size': size, 'filters': filters }, { ...((sort_field && sort_direction) && { 'sort_field': sort_field }) }, { ...((sort_field && sort_direction) && { 'sort_direction': sort_direction }) }));

        const response: any = {
            'items': number_of_references,
            'pages': Math.ceil(number_of_references / size),
            'current': page,
            'size': references.length,
            'references': references.map(({ _id, ...attributes }) => attributes)
        };

        return res.status(200).json(response);
    } catch (error) {
        return next(error);
    }
});

router.get('/:reference', async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
	try {
        const reference: IReferenceModel = await GetReference(req.params.reference);
		return res.status(200).send(reference.toJSON());
	} catch (error) { return next(error) };
});

router.post('/', async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
	try {
        const parameters: any = req.body;
        // TODO: Validate submitted parameters
		if (!parameters.data || !parameters.repository) throw new BadRequest();

        const reference: LeanDocument<IReferenceModel> = await RegisterReference(parameters as Pick<StoredReference, 'repository'> & { 'identifier'?: Identifier, 'data': { [key: string]: any } });
		return res.status(200).send(reference);
	} catch (error) { return next(error) };
});

router.get('/:reference/data', async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
        const data: RegisteredData = await RetrieveData(req.params.reference);
        return res.status(200).send(data);
    } catch (error) { return next(error) };
});

router.post('/:reference/record', async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
        const reference: string = req.params.reference;
        const parameters: any = req.body;
        // TODO: Validate submitted parameters
        if (!parameters.record) throw new BadRequest();
        const record: Identifier = await RegisterRecord(reference, req.body.record);
        return res.status(200).send({ reference, record });
    } catch (error) { return next(error) };
});

// TODO: Add PUT support (see: https://stackoverflow.com/a/630475)

export { router as ReferenceManagerRoutes };