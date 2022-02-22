import { NextFunction, Request, Response, Router } from 'express';
import { parse, getTime as timestamp } from 'date-fns';

import { Maybe, Identifier, RepositoryState, Repository, StoredReference, BadRequest } from 'core';
import { GetReference } from '@service/controllers/references';
import { RegisterRepository, GetRepository, FetchRepositories, CountRepositories, AddEntryToRepository } from '@service/controllers/repositories';
import { IRepositorySchema, IRepositoryModel, IReferenceModel } from '@service/database/schemata';
import { LeanDocument } from 'mongoose';

const router: Router = Router({ mergeParams: true });

// TODO: Handle errors

router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
        const parameters: any = req.query;
        const page: number = (parameters['page'] && parameters['page'] > 0) ? (Number.parseInt(parameters['page']) - 1) : 0;
        const size: number = parameters['size'] ? Number.parseInt(parameters['size']) : 10;
        const identifier: Maybe<string> = parameters['identifier'];
        const name: Maybe<string> = parameters['name'];
        const description: Maybe<string> = parameters['description'];
        const custodian: Maybe<string> = parameters['custodian'];
        const state: Maybe<RepositoryState> = parameters['state'];
        const before: Maybe<string> = parameters['before'];
        const after: Maybe<string> = parameters['after'];
        const sort_field: Maybe<keyof Pick<Repository, 'identifier' | 'name' | 'description' | 'custodian' | 'state' | 'creation'>> = parameters['sort'];
        const sort_direction: Maybe<'asc' | 'desc'> = parameters['direction'];

        const filters: Object = Object.assign({}, { ...(identifier && { 'identifier': { '$regex': `^.*${identifier}.*$` } }) }, { ...(name && { 'name': { '$regex': `^.*${name}.*$` } }) }, { ...(description && { 'description': { '$regex': `^.*${description}.*$` } }) }, { ...(custodian && { 'custodian': { '$regex': `^.*${custodian}.*$` } }) }, { ...(state && { 'state': { '$eq': state } }) }, { ...((before || after) && { 'creation': { ...(before && { '$lte': timestamp(parse(before, 'dd.MM.YYYY', new Date())) }), ...(after && { '$gte': timestamp(parse(after, 'dd.MM.YYYY', new Date())) }) } }) });

        const number_of_repositories: number = await CountRepositories(filters);
        let repositories: (IRepositorySchema & { '_id'?: string })[] = await FetchRepositories(Object.assign({ 'page': page, 'size': size, 'filters': filters }, { ...((sort_field && sort_direction) && { 'sort_field': sort_field }) }, { ...((sort_field && sort_direction) && { 'sort_direction': sort_direction }) }));

        const response: any = {
            'items': number_of_repositories,
            'pages': Math.ceil(number_of_repositories / size),
            'current': page,
            'size': repositories.length,
            'repositories': repositories.map(({ _id, ...attributes }) => attributes)
        };

        return res.status(200).json(response);
    } catch (error) {
        return next(error);
    }
});

router.get('/:repository', async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
	try {
        const repository: IRepositoryModel = await GetRepository(req.params.repository);
        const { _id, ...attributes } = repository.toJSON();
        return res.status(200).send(attributes);
	} catch (error) { return next(error) };
});

router.post('/', async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
	try {
        const parameters: any = req.body;
        // TODO: Validate submitted parameters
		if (!parameters.name || !parameters.custodian) throw new BadRequest();

        const identifier: Identifier = await RegisterRepository(parameters as Omit<Repository, 'identifier' | 'creation' | 'state' | 'entries'> & { 'identifier'?: string });
        return res.status(200).send({ identifier });
	} catch (error) { return next(error) };
});

router.get('/:repository/entries', async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
        const repository: IRepositoryModel = await GetRepository(req.params.repository);

        const parameters: any = req.query;
        const page: number = (parameters['page'] && parameters['page'] > 0) ? (Number.parseInt(parameters['page']) - 1) : 0;
        const size: number = parameters['size'] ? Number.parseInt(parameters['size']) : 10;

        const number_of_entries: number = repository.get('entries').length;
        const entries: Identifier[] = repository.get('entries').slice((page - 1) * size, page * size);

        const response: any = {
            'items': number_of_entries,
            'pages': Math.ceil(number_of_entries / size),
            'current': page,
            'size': entries.length,
            'entries': (await Promise.all(entries.map(async (identifier: Identifier) => (await GetReference(identifier)).toJSON()))).map(({ _id, ...attributes }) => attributes)
        };

        return res.status(200).json(response);
    } catch (error) { return next(error) };
});

router.get('/:repository/entries/:entry', async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
        const reference: IReferenceModel = await GetReference(req.params.entry);
        const { _id, ...attributes } = reference.toJSON();
        return res.status(200).send(attributes);
    } catch (error) { return next(error) };
});

router.post('/:repository/entries', async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
        const parameters: any = req.body;

        // TODO: Validate submitted parameters
        if (!parameters.data) throw new BadRequest();

        // TODO: Create a type for parameters
        const reference: LeanDocument<IReferenceModel> = await AddEntryToRepository(req.params.repository, parameters as { 'identifier'?: Identifier, 'data': { [key: string]: any } });
        return res.status(200).send(reference);
    } catch (error) { return next(error) };
});

// TODO: Add PUT support (see: https://stackoverflow.com/a/630475)

export { router as RepositoryManagerRoutes };