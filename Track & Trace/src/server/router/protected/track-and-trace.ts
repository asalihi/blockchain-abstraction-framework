import { NextFunction, Request, Response, Router } from 'express';
import { parse, getTime as timestamp } from 'date-fns';

import { BadRequest, Maybe, ProcessState, ProcessStateValues, ProcessEventObject, RegisteredData, RetrieveData } from 'core';

import { IProcessSchema, IProcessModel, CountProcesses, FetchProcesses, GetProcessEntry, IProcessVersionSchema, IProcessVersionModel, CountProcessVersions, FetchProcessVersions, GetProcessVersionEntry, IExecutionInstanceModel, IExecutionInstanceSchema, CountExecutionInstances, FetchExecutionInstances, GetExecutionInstanceEntry, IExecutionInstanceTraceSchema, CountExecutionInstanceTraces, FetchExecutionInstanceTraces, ITrackAndTraceTraceSchema, FetchProcessElementTraces, CountProcessElementTraces, GetExecutionInstanceTraceEntry, IExecutionInstanceTraceModel, IProcessElementTraceModel, GetProcessElementTraceEntry, GetProcessVersionTraceEntry, GetProcessTraceEntry, IProcessTraceModel, IProcessVersionTraceModel } from '@service/database/schemata';
import { RegisterProcess, RegisterProcessVersion, RegisterExecutionInstance, ActivateExecutionInstance, UpdateExecutionInstance, TerminateExecutionInstance, CancelExecutionInstance, DeactivateProcess, DeactivateProcessVersion, GetResources } from '@service/controllers/controller';

const router: Router = Router({ mergeParams: true });

// TODO: Handle errors + verification of supplied parameters (+ use next accordingly)
// TODO URGENT: Standardize responses (success, model, errors?, + in case of instance: validations?)
// TODO: Convert once only models to JSON when fetching associated resources
router.get('/processes', async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
        const parameters: any = req.query;
        const page: number = (parameters['page'] && parameters['page'] > 0) ? (Number.parseInt(parameters['page']) - 1) : 0;
        const size: number = parameters['size'] ? Number.parseInt(parameters['size']) : 10;
        const identifier: Maybe<string> = parameters['identifier'];
        const state: Maybe<ProcessState> = parameters['state'];
        const before: Maybe<string> = parameters['before'];
        const after: Maybe<string> = parameters['after'];
        const sort_field: Maybe<keyof Omit<IProcessModel, 'versions'>> = parameters['sort'];
        const sort_direction: Maybe<'asc' | 'desc'> = parameters['direction'];

        const filters: Object = Object.assign({}, { ...(identifier && { 'process': { '$regex': `^.*${identifier}.*$` } }) }, { ...(state && ProcessStateValues.includes(state) && { 'state': { '$eq': state } }) }, { ...((before || after) && { 'date': { ...(before && { '$lte': timestamp(parse(before, 'dd.MM.YYYY', new Date())) }), ...(after && { '$gte': timestamp(parse(after, 'dd.MM.YYYY', new Date())) }) } }) });

        const number_of_processes: number = await CountProcesses(filters);
        const processes: (IProcessSchema & { '_id'?: string })[] = await FetchProcesses(Object.assign({ 'page': page, 'size': size, 'filters': filters }, { ...((sort_field && sort_direction) && { 'sort_field': sort_field }) }, { ...((sort_field && sort_direction) && { 'sort_direction': sort_direction }) }));

        const response: any = {
            'items': number_of_processes,
            'pages': Math.ceil(number_of_processes / size),
            'current': page,
            'size': processes.length,
            'processes': processes.map((process: IProcessSchema & { '_id'?: string }) => { return Object.assign(process, { 'versions': process['versions'].length }) })
        };

        return res.json(response);
    } catch (error) {
        next(error);
    }
});

router.get('/processes/statistics', async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
        const number_of_processes: number = await CountProcesses();
        return res.json({ total: number_of_processes });
    } catch (error) {
        next(error);
    }
});

router.post('/processes', async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    const parameters: any = req.body;

    if (parameters['process']) {
        try {
            return res.json(await RegisterProcess(parameters));
        } catch (error) {
            next(error);
        }
    }
    else next(new BadRequest('missing process information'));
});

router.get('/processes/:process', async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    const parameters: any = req.params;
    const identifier: string = parameters['process'];

    try {
        const process: IProcessModel = await GetProcessEntry(identifier);
        const resources: { [key: string]: any } = await GetResources(process.toJSON());
        return res.json(Object.assign({}, process.toJSON(), { resources }));
    } catch {
        next(new Error('Process not found')); // TODO: Throw original error
    }
});

router.post('/processes/:process/state', async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    const identifier: string = req.params['process'];
    const operation: Maybe<'deactivation'> = req.body['operation'];
    const data: Maybe<string> = req.body['data'];

    if (identifier && operation && ['deactivation'].includes(operation)) {
        try {
            if (operation === 'deactivation') return res.json(await DeactivateProcess({ process_identifier: identifier, ...(data && { data: JSON.parse(data) }) })); // TODO: Check data before parsing
        } catch (error) {
            next(error);
        }
    }
    else next(new BadRequest('Missing process identifier or unsupported operation'));
});

router.get('/processes/:process/versions', async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
    const process: string = req.params['process'];
    const parameters: any = req.query;
    const page: number = (parameters['page'] && parameters['page'] > 0) ? (Number.parseInt(parameters['page']) - 1) : 0;
    const size: number = parameters['size'] ? Number.parseInt(parameters['size']) : 10;
    const version: Maybe<string> = parameters['identifier'];
    const state: Maybe<ProcessState> = parameters['state'];
    const before: Maybe<string> = parameters['before'];
    const after: Maybe<string> = parameters['after'];
    const sort_field: Maybe<keyof Omit<IProcessVersionModel, 'file' | 'signature' | 'instances'>> = parameters['sort'];
    const sort_direction: Maybe<'asc' | 'desc'> = parameters['direction'];

    const filters: Object = Object.assign({}, { 'process': process }, { ...(version && { 'version': { '$regex': `^.*${version}.*$` } }) }, { ...(state && ProcessStateValues.includes(state) && { 'state': { '$eq': state } }) }, { ...((before || after) && { 'date': { ...(before && { '$lte': timestamp(parse(before, 'dd.MM.YYYY', new Date())) }), ...(after && { '$gte': timestamp(parse(after, 'dd.MM.YYYY', new Date())) }) } }) });

    const number_of_versions: number = await CountProcessVersions(filters);
    const versions: (IProcessVersionSchema & { '_id'?: string })[] = await FetchProcessVersions(Object.assign({ 'page': page, 'size': size, 'filters': filters }, { ...((sort_field && sort_direction) && { 'sort_field': sort_field }) }, { ...((sort_field && sort_direction) && { 'sort_direction': sort_direction }) }));

    const response: any = {
        'items': number_of_versions,
        'pages': Math.ceil(number_of_versions / size),
        'current': page,
        'size': versions.length,
        'versions': await Promise.all(versions.map(async (version: IProcessVersionSchema & { '_id'?: string }) => {
            const resources: { [key: string]: any } = await GetResources(version);
            return Object.assign({}, version, { 'instances': version['instances'].length, resources });
        }))
    };

    return res.json(response);
});

router.post('/processes/:process/versions', async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    const process: string = req.params['process'];
    const parameters: any = req.body;

    if (process && parameters && ['identifier', 'file'].every((key: string) => key in parameters)) {
        try {
            return res.json(await RegisterProcessVersion({ 'process': process, 'version': parameters['identifier'], 'file': parameters['file'], ...(parameters['data'] && { data: parameters['data'] }), ...(parameters['options'] && { options: parameters['options'] }) }));
        } catch (error) {
            next(error);
        }
    }
    else next(new BadRequest('missing version information'));
});

router.get('/processes/:process/versions/:version', async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    const process_identifier: string = req.params['process'];
    const version_identifier: string = req.params['version'];

    try {
        const version: IProcessVersionModel = await GetProcessVersionEntry(process_identifier, version_identifier);
        const resources: { [key: string]: any } = await GetResources(version.toJSON());
        return res.json(Object.assign({}, version.toJSON(), { resources }));
    } catch {
        next(new Error('Version not found'));
    }
});

router.get('/processes/:process/versions/:version/tasks', async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    const process_identifier: string = req.params['process'];
    const version_identifier: string = req.params['version'];

    try {
        const process_version: IProcessVersionModel = await GetProcessVersionEntry(process_identifier, version_identifier);
        const process_version_model: RegisteredData = await RetrieveData(process_version.get('resources.file'));
        return res.json(Object.keys(process_version_model['data']['tree']['tasks']));
    } catch {
        // TODO: Handle error
        next(new Error('Version not found'));
    }
});

router.get('/processes/:process/versions/:version/events', async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    const process_identifier: string = req.params['process'];
    const version_identifier: string = req.params['version'];

    try {
        const process_version: IProcessVersionModel = await GetProcessVersionEntry(process_identifier, version_identifier);
        const process_version_model: RegisteredData = await RetrieveData(process_version.get('resources.file'));
        return res.json((Object.values(process_version_model['data']['tree']['events']) as ProcessEventObject[]).map((event: ProcessEventObject) => ({ 'identifier': event['identifier'], 'type': event['type'] })));
    } catch {
        // TODO: Handle error
        next(new Error('Version not found'));
    }
});

router.post('/processes/:process/versions/:version/state', async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    const process_identifier: string = req.params['process'];
    const version_identifier: string = req.params['version'];
    const operation: Maybe<'deactivation'> = req.body['operation'];

    if (process_identifier && version_identifier && operation && ['deactivation'].includes(operation)) {
        try {
            if (operation === 'deactivation') return res.json(await DeactivateProcessVersion({ process_identifier, version_identifier }));
        } catch (error) {
            next(error);
        }
    }
    else next(new BadRequest('missing process version identifier or unsupported operation'));
});

router.get('/processes/:process/versions/:version/instances', async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
    const process: string = req.params['process'];
    const version: string = req.params['version'];
    const parameters: any = req.query;
    const page: number = (parameters['page'] && parameters['page'] > 0) ? (Number.parseInt(parameters['page']) - 1) : 0;
    const size: number = parameters['size'] ? Number.parseInt(parameters['size']) : 10;
    const instance: Maybe<string> = parameters['identifier'];
    const before: Maybe<string> = parameters['before'];
    const after: Maybe<string> = parameters['after'];
    const sort_field: Maybe<keyof Omit<IExecutionInstanceModel, 'signature' | 'level'>> = parameters['sort'];
    const sort_direction: Maybe<'asc' | 'desc'> = parameters['direction'];

    const filters: Object = Object.assign({}, { 'process': process, 'version': version }, { ...(instance && { 'instance': { '$regex': `^.*${instance}.*$` } }) }, { ...((before || after) && { 'date': { ...(before && { '$lte': timestamp(parse(before, 'dd.MM.YYYY', new Date())) }), ...(after && { '$gte': timestamp(parse(after, 'dd.MM.YYYY', new Date())) }) } }) });

    const number_of_instances: number = await CountExecutionInstances(filters);
    const instances: (IExecutionInstanceSchema & { '_id'?: string })[] = await FetchExecutionInstances(Object.assign({ 'page': page, 'size': size, 'filters': filters }, { ...((sort_field && sort_direction) && { 'sort_field': sort_field }) }, { ...((sort_field && sort_direction) && { 'sort_direction': sort_direction }) }));

    const response: any = {
        'items': number_of_instances,
        'pages': Math.ceil(number_of_instances / size),
        'current': page,
        'size': instances.length,
        'instances': await Promise.all(instances.map(async (instance: IExecutionInstanceSchema & { '_id'?: string }) => {
            const resources: { [key: string]: any } = await GetResources(instance);
            return Object.assign({}, instance, { resources });
        }))
    };

    return res.json(response);
});

router.post('/processes/:process/versions/:version/instances', async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    const process: string = req.params['process'];
    const version: string = req.params['version'];
    const parameters: any = req.body;

    if (process && version && parameters['instance']) {
        try {
            return res.json(await RegisterExecutionInstance({ 'process': process, 'version': version, 'instance': parameters['instance'], ...(parameters['data'] && { data: parameters['data'] }), ...(parameters['options'] && { options: parameters['options'] }) }));
        } catch (error) {
            next(error);
        }
    }
    else next(new BadRequest('missing instance information'));
});

router.get('/processes/:process/versions/:version/instances/:instance', async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    const instance_identifier: string = req.params['instance'];

    try {
        const instance: IExecutionInstanceModel = await GetExecutionInstanceEntry(instance_identifier);
        const resources: { [key: string]: any } = await GetResources(instance.toJSON());
        return res.json(Object.assign({}, instance.toJSON(), { resources }));
    } catch {
        next(new Error('Instance not found'));
    }
});

// TODO URGENT: Refactor in several distinct endpoints
router.post('/processes/:process/versions/:version/instances/:instance/state', async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    const instance: string = req.params['instance'];
    const parameters: any = req.body;
    const operation: Maybe<'activation' | 'update' | 'deactivation' | 'cancelation'> = parameters['operation'];

    if (instance && operation && ['activation', 'update', 'deactivation', 'cancelation'].includes(operation)) {
        try {
            if (operation === 'activation') return res.json(await ActivateExecutionInstance({ instance, ...(parameters['data'] && { 'data': parameters['data'] }) }));
            else if (operation === 'update') return res.json(await UpdateExecutionInstance({ instance, task: parameters['task'], ...(parameters['data'] && { 'data': parameters['data'] }), ...(parameters['options'] && { 'options': parameters['options'] }) }));
            else if (operation === 'deactivation') return res.json(await TerminateExecutionInstance({ instance, end: parameters['end'], ...(parameters['data'] && { 'data': parameters['data'] }) }));
            else if (operation === 'cancelation') return res.json(await CancelExecutionInstance({ instance, ...(parameters['data'] && { 'data': parameters['data'] }) }));
        } catch (error) {
            next(error);
        }
    }
    else next(new BadRequest('missing instance or supported operation'));
});

router.get('/instances', async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
    const parameters: any = req.query;
    const page: number = (parameters['page'] && parameters['page'] > 0) ? (Number.parseInt(parameters['page']) - 1) : 0;
    const size: number = parameters['size'] ? Number.parseInt(parameters['size']) : 10;
    const instance: Maybe<string> = parameters['identifier'];
    const before: Maybe<string> = parameters['before'];
    const after: Maybe<string> = parameters['after'];
    const sort_field: Maybe<keyof Omit<IExecutionInstanceModel, 'signature' | 'level'>> = parameters['sort'];
    const sort_direction: Maybe<'asc' | 'desc'> = parameters['direction'];

    const filters: Object = Object.assign({}, { ...(instance && { 'instance': { '$regex': `^.*${instance}.*$` } }) }, { ...((before || after) && { 'date': { ...(before && { '$lte': timestamp(parse(before, 'dd.MM.YYYY', new Date())) }), ...(after && { '$gte': timestamp(parse(after, 'dd.MM.YYYY', new Date())) }) } }) });

    const number_of_instances: number = await CountExecutionInstances(filters);
    const instances: (IExecutionInstanceSchema & { '_id'?: string })[] = await FetchExecutionInstances(Object.assign({ 'page': page, 'size': size, 'filters': filters }, { ...((sort_field && sort_direction) && { 'sort_field': sort_field }) }, { ...((sort_field && sort_direction) && { 'sort_direction': sort_direction }) }));

    const response: any = {
        'items': number_of_instances,
        'pages': Math.ceil(number_of_instances / size),
        'current': page,
        'size': instances.length,
        'instances': instances
    };

    return res.json(response);
});

router.get('/instances/statistics', async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
        const number_of_instances: number = await CountExecutionInstances();
        const number_of_running_instances: number = await CountExecutionInstances({ 'state': { '$eq': 'running' } });
        return res.json({ total: number_of_instances, running: number_of_running_instances });
    } catch (error) {
        next(error);
    }
});

router.get('/processes/:process/versions/:version/instances/:instance/traces', async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
    const instance: string = req.params['instance'];

    const traces: (IExecutionInstanceTraceSchema & { '_id'?: string })[] = await FetchExecutionInstanceTraces({ 'filters': { 'instance': instance } });

    return res.json(traces);
});

router.get('/processes/:process/versions/:version/instances/:instance/updates', async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
    const instance: string = req.params['instance'];
    const parameters: any = req.query;
    const page: number = (parameters['page'] && parameters['page'] > 0) ? (Number.parseInt(parameters['page']) - 1) : 0;
    const size: number = parameters['size'] ? Number.parseInt(parameters['size']) : 10;
    const identifier: Maybe<string> = parameters['identifier'];
    const before: Maybe<string> = parameters['before'];
    const after: Maybe<string> = parameters['after'];
    const sort_field: Maybe<keyof Pick<IExecutionInstanceTraceSchema, 'identifier' | 'timestamp'>> = parameters['sort'];
    const sort_direction: Maybe<'asc' | 'desc'> = parameters['direction'];

    const filters: Object = Object.assign({}, { 'instance': instance }, { ...(identifier && { 'identifier': { '$regex': `^.*${identifier}.*$` } }) }, { ...((before || after) && { 'date': { ...(before && { '$lte': timestamp(parse(before, 'dd.MM.YYYY', new Date())) }), ...(after && { '$gte': timestamp(parse(after, 'dd.MM.YYYY', new Date())) }) } }) });

    const number_of_traces: number = await CountProcessElementTraces(filters);
    const traces: (ITrackAndTraceTraceSchema & { '_id'?: string })[] = await FetchProcessElementTraces(Object.assign({ 'page': page, 'size': size, 'filters': filters }, { ...((sort_field && sort_direction) && { 'sort_field': sort_field }) }, { ...((sort_field && sort_direction) && { 'sort_direction': sort_direction }) }));

    const response: any = {
        'items': number_of_traces,
        'pages': Math.ceil(number_of_traces / size),
        'current': page,
        'size': traces.length,
        'traces': traces
    };

    return res.json(response);
});

router.get('/processes/traces/:trace', async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
    const trace: string = req.params['trace'];

    const trace_entry: IProcessTraceModel = await GetProcessTraceEntry(trace);

    const resources: { [key: string]: any } = await GetResources(trace_entry.toJSON());
    return res.json(Object.assign({}, trace_entry.toJSON(), { resources }));
});

router.get('/versions/traces/:trace', async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
    const trace: string = req.params['trace'];

    const trace_entry: IProcessVersionTraceModel = await GetProcessVersionTraceEntry(trace);

    const resources: { [key: string]: any } = await GetResources(trace_entry.toJSON());
    return res.json(Object.assign({}, trace_entry.toJSON(), { resources }));
});

router.get('/instances/traces/:trace', async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
    const trace: string = req.params['trace'];

    const trace_entry: IExecutionInstanceTraceModel = await GetExecutionInstanceTraceEntry(trace);

    const resources: { [key: string]: any } = await GetResources(trace_entry.toJSON());
    return res.json(Object.assign({}, trace_entry.toJSON(), { resources }));
});

router.get('/instances/updates/:update', async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
    const update: string = req.params['update'];

    const update_entry: IProcessElementTraceModel = await GetProcessElementTraceEntry(update);

    const resources: { [key: string]: any } = await GetResources(update_entry.toJSON());
    return res.json(Object.assign({}, update_entry.toJSON(), { resources }));
});


export { router as Routes };