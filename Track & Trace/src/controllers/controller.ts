import { has, isEmpty as empty, isObject as object, omit } from 'lodash';
import { ClientSession, Document, LeanDocument } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { flatMap as flat_map, pickBy as pick_by, get } from 'lodash';
import { SendMailOptions, getTestMessageUrl, SentMessageInfo } from 'nodemailer';

import { DATABASE_CONNECTION as connection } from '@service/database/database';
import {  Maybe, Nullable, Identifier, Message, IProcessWithVersions, IProcessVersionParameters, Process, ProcessBranch, TreeOfProcessInstances, KeyControlViolation, KeyControlViolationResults, ProcessGatewayClass, ProcessDivergentGatewayClass, ProcessConvergentGatewayClass, ProcessEventClass, ProcessElementClass, ProcessExecutableElementClass, ProcessKeyControlClass, ProcessCompensatingControlClass, ProcessConnectionClass, ProcessLevel, ProcessExecutableElementTrace, ProcessEndEventTrace, ProcessVersionOptions, ExecutionInstanceOptions, ProcessTaskOptions, ProcessExecutionBranch, RegisteredData, RetrieveData, TreeOfProcessObjects, ProcessExecution, ListOfVerifiedExecutionConditions, PossibleOrConfirmedKeyControlViolationValues, PossibleAndConfirmedKeyControlViolationResults } from 'core';
import { ConvertProcess, SanitizeProcess, CreateDependancyTree, ConvertTreeOfInstances } from './converter';
import { IProcessModel, GetProcessEntry, CreateProcessEntry, RegisterProcessResource, IProcessVersionModel, CreateProcessVersionEntry, RegisterProcessVersionResource, IExecutionInstanceSchema, IExecutionInstanceModel, CreateExecutionInstanceEntry, RegisterExecutionInstanceResource, IProcessVersionSchema, IProcessSchema, DeactivateProcessEntry, DeactivateProcessVersionEntry, ActivateExecutionInstanceEntry, TerminateExecutionInstanceEntry, UpdateExecutionInstanceEntry, CancelExecutionInstanceEntry, GetExecutionInstanceEntry, FetchExecutionInstanceTraces, GetProcessVersionEntry, CreateProcessElementTraceEntry, IProcessElementTraceModel, RegisterProcessElementTraceResource } from '@service/database/schemata';
import { ValidateConditions } from './verifier';
import { TRANSPORTER } from '@service/controllers/nodemailer';


export async function HandleReceivedMessage(message: Message): Promise<void> {
    // TODO URGENT: Define logic
}

export async function GetResources(schema: LeanDocument<Document>, path: string = 'resources', resources?: string[]): Promise<{ [key: string]: any }> {
    const fetched_resources: { [key: string]: any } = {};

    for (const resource of (!empty(resources) ? [...new Set(resources)] : Object.keys(omit(empty(path) ? schema : get(schema, path), '_id')))) {
        const path_to_resource: string = empty(path) ? resource : `${path}.${resource}`;
        if (get(schema, path_to_resource)) {
            if (object(get(schema, path_to_resource)) && !empty(get(schema, path_to_resource))) {
                fetched_resources[resource] = await GetResources(schema, path_to_resource);
            } else {
                const data: RegisteredData = await RetrieveData(get(schema, path_to_resource));
                fetched_resources[resource] = data['data'];
            }
        }
    }

    return fetched_resources;
}

export async function RegisterProcess(parameters: IProcessWithVersions): Promise<IProcessSchema> {
    let success: boolean = false;
    let process_entry: IProcessModel;

    const process_identifier: Identifier = parameters['process'];
    await connection.transaction(async function executor(session: ClientSession): Promise<void> {
        process_entry = await CreateProcessEntry({ 'identifier': process_identifier, ...(parameters['data'] && { 'data': parameters['data'] }), ...(parameters['options'] && { 'options': parameters['options'] }) }, session);
        await Promise.all(parameters['versions'].map(async (version: IProcessVersionParameters) => RegisterProcessVersion({ process: process_identifier, version: version['identifier'], file: version['file'], ...(version['data'] && { 'data': version['data'] }), ...(version['options'] && { 'options': version['options'] }) }, session)));
        success = true;
    }).catch((error) => { /* TODO: Log error from transaction */ success = false });

    if (success) {
        if (parameters['options'] && !empty(parameters['options'])) {
            RegisterProcessResource(process_identifier, 'track-and-trace-options', 'options', { 'process': process_identifier, 'options': parameters['options'] });
        }
        if (parameters['data'] && !empty(parameters['data'])) {
            RegisterProcessResource(process_identifier, 'track-and-trace-data', 'data', parameters['data'],'resources.data.creation');
        }

        for(const version of parameters['versions']) {
            if(version['options'] && !empty(version['options'])) {
                RegisterProcessVersionResource(process_identifier, version['identifier'], 'track-and-trace-options', 'options', { 'process': process_identifier, version: version['identifier'], 'options': version['options'] });
            }
            if (version['data'] && !empty(version['data'])) {
                RegisterProcessVersionResource(process_identifier, version['identifier'], 'track-and-trace-data', 'data', version['data'],'resources.data.creation');
            }
        }

        return process_entry!.toJSON();
    } else {
        // TODO: Handle error
        throw new Error('An error occurred during creation of process');
    }
}

export async function DeactivateProcess(parameters: { process_identifier: Identifier, data?: Object }): Promise<IProcessSchema> {
    try {
        const process_entry: IProcessModel = await DeactivateProcessEntry(parameters);
        if (parameters['data'] && !empty(parameters['data'])) {
            RegisterProcessResource(parameters['process_identifier'], 'track-and-trace-data', 'data', parameters['data'],'resources.data.deactivation');
        }
        return process_entry.toJSON();
    } catch {
        // TODO: Handle error
        throw new Error('An error occurred during deactivation of process');
    }
}

export async function RegisterProcessVersion(parameters: { 'process': string, 'version': string, 'file': string, data?: Object, options?: ProcessVersionOptions }, session?: ClientSession): Promise<IProcessVersionSchema> {
    let success: boolean = false;
    let process_version_entry: IProcessVersionModel;

    try {
        const process_entry: IProcessModel = await GetProcessEntry(parameters['process'], session);
        if (process_entry.get('state') === 'active') {
            const converted_process: Process = await ConvertProcess(parameters['file']);
            const sanitized_process: Process = SanitizeProcess(converted_process, parameters['options'] ?? {});
            const tree_of_instances: TreeOfProcessInstances = CreateDependancyTree(sanitized_process, parameters['options'] ?? {});
            if(!parameters['version']) parameters['version'] = uuidv4();
            process_version_entry = await CreateProcessVersionEntry({ 'process': parameters['process'], 'version': parameters['version'], 'file': parameters['file'], 'tree': ConvertTreeOfInstances(tree_of_instances), ...(parameters['data'] && { 'data': parameters['data'] }), ...(parameters['options'] && { 'options': parameters['options'] }) }, session);
            success = true;
        } else {
            success = false;
            // TODO: Handle error
            throw new Error('Process is not active');
        }
    } catch(error) {
        // TODO: Log error
        success = false;
    }

    if (success) {
        if(parameters['options'] && !empty(parameters['options'])) {
            RegisterProcessVersionResource(parameters['process'], parameters['version']!, 'track-and-trace-options', 'options', { 'process': parameters['process'], version: parameters['version'], 'options': parameters['options'] });
        }
        if (parameters['data'] && !empty(parameters['data'])) {
            RegisterProcessVersionResource(parameters['process'], parameters['version']!, 'track-and-trace-data', 'data', parameters['data'],'resources.data.creation');
        }
        return process_version_entry!.toJSON();
    }
    // TODO: Handle error
    else throw new Error('An error occurred during creation of process version');
}

export async function DeactivateProcessVersion(parameters: { 'process_identifier': Identifier, 'version_identifier': Identifier, data?: any }, session?: ClientSession): Promise<IProcessVersionSchema> {
    try {
        const process_version_entry: IProcessVersionModel = await DeactivateProcessVersionEntry(parameters, session);
        if (parameters['data'] && !empty(parameters['data'])) {
            RegisterProcessVersionResource(parameters['process_identifier'], parameters['version_identifier'], 'track-and-trace-data', 'data', parameters['data'],'resources.data.deactivation');
        }
        return process_version_entry.toJSON();
    } catch {
        // TODO: Handle error
        throw new Error('An error occurred during deactivation of process version');
    }
}

export async function RegisterExecutionInstance(parameters: { 'process': Identifier, 'version': Identifier, 'instance': Identifier, data?: Object, options?: ExecutionInstanceOptions }): Promise<IExecutionInstanceSchema> {
    try {
        const execution_instance_entry: IExecutionInstanceModel = await CreateExecutionInstanceEntry(parameters);

        if (parameters['options'] && !empty(parameters['options'])) {
            RegisterExecutionInstanceResource(parameters['instance'], 'track-and-trace-options', 'options', { 'process': parameters['process'], 'version': parameters['version'], 'instance': parameters['instance'], 'options': parameters['options'] });
        }

        if (parameters['data'] && !empty(parameters['data'])) {
            RegisterExecutionInstanceResource(parameters['instance'], 'track-and-trace-data', 'data', parameters['data'],'resources.data.creation');
        }

        return execution_instance_entry.toJSON();
    } catch {
        // TODO: Handle error
        throw new Error('An error occurred during creation of execution instance');
    }
}

// TODO URGENT: Set appropriate type for return
export async function ActivateExecutionInstance(parameters: { instance: Identifier, data?: Object }): Promise<{ 'success': boolean, 'instance'?: LeanDocument<IExecutionInstanceModel>, 'errors'?: string[], 'validation'?: { [key: string]: any } }> {
    try {
        const activation_results = await ActivateExecutionInstanceEntry(parameters);

        if(activation_results['success']) {
            if (parameters['data'] && !empty(parameters['data'])) {
                RegisterExecutionInstanceResource(parameters['instance'], 'track-and-trace-data', 'data', parameters['data'],'resources.data.start');
            }
        }

        return activation_results;
    } catch {
        // TODO: Handle error
        throw new Error('An error occurred during activation of execution instance');
    }
}

// TODO URGENT: Set appropriate type as return
export async function UpdateExecutionInstance(parameters: { instance: Identifier, task: Identifier, data?: Object, options?: ProcessTaskOptions }): Promise<{ 'success': boolean, 'instance'?: LeanDocument<IExecutionInstanceModel>, 'trace'?: Identifier, 'errors'?: string[], 'validation'?: { [key: string]: any } }> {
    try {
        const execution_instance_entry: IExecutionInstanceModel = await GetExecutionInstanceEntry(parameters['instance']);

        if (execution_instance_entry.get('state') !== 'running') throw new Error('Instance is not running');

        const task_is_valid_candidate: boolean = await VerifyIfTaskIsAValidCandidateForRegistration(execution_instance_entry, parameters['task'], parameters['options']);

        const verified_conditions: ListOfVerifiedExecutionConditions = await ValidateConditions(parameters['instance'], parameters['task'], parameters['data'], parameters['options']?.['conditions']);

        if (task_is_valid_candidate) {
            const results = await UpdateExecutionInstanceEntry(Object.assign(parameters, { 'conditions': verified_conditions }));

            if(results['success'] === false) {
                console.log('Update could not be registered');

                const message: SendMailOptions = {
                    from: 'Track and Trace <track-and-trace@company.com>',
                    to: 'Finance department <finance@company.com>',
                    subject: `Violation detected for instance: ${results['instance']!['instance']}`,
                    html: `An update of instance <b>${results['instance']!['instance']}</b> (process: ${results['instance']!['process']}, version: ${results['instance']!['version']}) was requested but Track & Trace detected a violation during validation. Please find the results below:<br/><br/>Errors: ${JSON.stringify(results['errors'])}${ results['validation'] ? '<br/>' + JSON.stringify(results['validation']) : ''}`
                };
            
                const response: SentMessageInfo = await TRANSPORTER.sendMail(message);
                console.log(`Mail sent: ${ response.messageId }`);
                console.log(`URL: ${ getTestMessageUrl(response )}`);
            }

            if(results['trace']) {
                if (parameters['options'] && !empty(parameters['options'])) {
                    RegisterProcessElementTraceResource(results['trace'], 'track-and-trace-options', 'options', { 'process': execution_instance_entry.get('process'), 'version': execution_instance_entry.get('version'), 'instance': execution_instance_entry.get('instance'), 'element': parameters['task'], 'options': parameters['options'] });
                }

                if (parameters['data'] && !empty(parameters['data'])) {
                    RegisterProcessElementTraceResource(results['trace'], 'track-and-trace-data', 'data', parameters['data']);
                }

                if (results['validation'] && !empty(results['validation'])) {
                    RegisterProcessElementTraceResource(results['trace'], 'track-and-trace-executions', 'verifications', { 'process': execution_instance_entry.get('process'), 'version': execution_instance_entry.get('version'), 'instance': execution_instance_entry.get('instance'), 'element': parameters['task'], 'validation': results['validation'] });
                }
            }

            return results;
        } else {
            const trace: IProcessElementTraceModel = await CreateProcessElementTraceEntry({ 'identifier': uuidv4(), 'instance': execution_instance_entry.get('instance'), 'process': execution_instance_entry.get('process'), 'version': execution_instance_entry.get('version'), 'type': 'invalid_element', 'element': parameters['task'], 'data': parameters['data'], 'options': parameters['options'], 'validation': { 'integrity': 'invalid_element', 'conditions': verified_conditions } });
            await execution_instance_entry.update({ $push: { 'traces.updates': trace.get('identifier') } }, { upsert: true, new: true });
            
            if (parameters['options'] && !empty(parameters['options'])) {
                RegisterProcessElementTraceResource(trace.get('identifier'), 'track-and-trace-options', 'options', { 'process': execution_instance_entry.get('process'), 'version': execution_instance_entry.get('version'), 'instance': execution_instance_entry.get('instance'), 'element': parameters['task'], 'options': parameters['options'] });
            }

            if (parameters['data'] && !empty(parameters['data'])) {
                RegisterProcessElementTraceResource(trace.get('identifier'), 'track-and-trace-data', 'data', parameters['data']);
            }

            RegisterProcessElementTraceResource(trace.get('identifier'), 'track-and-trace-executions', 'verifications', { 'process': execution_instance_entry.get('process'), 'version': execution_instance_entry.get('version'), 'instance': execution_instance_entry.get('instance'), 'element': parameters['task'], 'validation': { 'integrity': 'invalid_element', 'conditions': verified_conditions } });
            
            // TODO URGENT: Send a notification (?)
            return { 'success': false, 'instance': execution_instance_entry.toJSON(), 'trace': trace.get('identifier'), 'errors': ['invalid_element'] };
        }
    } catch(error) {
        console.error('Error during update of instance');
        console.error(error);
        // TODO: Handle error
        throw new Error('An error occurred during update of execution instance');
    }
}

async function VerifyIfTaskIsAValidCandidateForRegistration(execution_instance_entry: IExecutionInstanceModel, task: Identifier, options?: ProcessTaskOptions): Promise<boolean> {
    const was_already_deviated: boolean = !!execution_instance_entry.get('deviation') || !!((await FetchExecutionInstanceTraces({ 'filters': { process: execution_instance_entry.get('process'), version: execution_instance_entry.get('version'), instance: execution_instance_entry.get('instance'), type: 'deviation' } })).pop());
    const is_deviated: boolean = options?.['deviation'] || was_already_deviated;

    if (is_deviated) {
        return true;
    }
    else {
        const process_version_entry: IProcessVersionModel = await GetProcessVersionEntry(execution_instance_entry.get('process'), execution_instance_entry.get('version'));
        const process_version_model: RegisteredData = await RetrieveData(process_version_entry.get('resources.file'));
        const tree_of_objects: TreeOfProcessObjects = process_version_model['data']['tree'];
        return has(tree_of_objects['tasks'], task);
    }
}

async function VerifyIfEventIsAValidCandidateForRegistration(execution_instance_entry: IExecutionInstanceModel, event: Identifier, options?: ProcessTaskOptions): Promise<boolean> {
    const was_already_deviated: boolean = !!execution_instance_entry.get('deviation') || !!((await FetchExecutionInstanceTraces({ 'filters': { process: execution_instance_entry.get('process'), version: execution_instance_entry.get('version'), instance: execution_instance_entry.get('instance'), type: 'deviation' } })).pop());
    const is_deviated: boolean = options?.['deviation'] || was_already_deviated;

    if (is_deviated) {
        return true;
    }
    else {
        const process_version_entry: IProcessVersionModel = await GetProcessVersionEntry(execution_instance_entry.get('process'), execution_instance_entry.get('version'));
        const process_version_model: RegisteredData = await RetrieveData(process_version_entry.get('resources.file'));
        const tree_of_objects: TreeOfProcessObjects = process_version_model['data']['tree'];
        return has(tree_of_objects['events'], event) && (tree_of_objects['events'][event]['type'] === 'end');
    }
}

export async function TerminateExecutionInstance(parameters: { instance: Identifier, end: Identifier, data?: Object }): Promise<{ 'success': boolean, 'instance'?: LeanDocument<IExecutionInstanceModel>, 'errors'?: string[], 'validation'?: { [key: string]: any } }> {
    try {
        const execution_instance_entry: IExecutionInstanceModel = await GetExecutionInstanceEntry(parameters['instance']);

        if (execution_instance_entry.get('state') !== 'running') throw new Error('Instance is not running');

        const end_is_valid_candidate: boolean = await VerifyIfEventIsAValidCandidateForRegistration(execution_instance_entry, parameters['end']);

        if (end_is_valid_candidate) {
            const results = await TerminateExecutionInstanceEntry(parameters);

            if(results['success'] === false) {
                console.log('Termination could not be registered');

                const message: SendMailOptions = {
                    from: 'Track and Trace <track-and-trace@company.com>',
                    to: 'Finance department <finance@company.com>',
                    subject: `Violation detected for instance: ${results['instance']!['instance']}`,
                    html: `A tentative of termination of instance <b>${results['instance']!['instance']}</b> (process: ${results['instance']!['process']}, version: ${results['instance']!['version']}) was requested but Track & Trace detected a violation during validation. Please find the results below:<br/><br/>Errors: ${JSON.stringify(results['errors'])}${ results['validation'] ? '<br/>' + JSON.stringify(results['validation']) : ''}`
                };
            
                const response: SentMessageInfo = await TRANSPORTER.sendMail(message);
                console.log(`Mail sent: ${ response.messageId }`);
                console.log(`URL: ${ getTestMessageUrl(response )}`);
            }

            if(results['trace']) {
                if (parameters['data'] && !empty(parameters['data'])) {
                    RegisterProcessElementTraceResource(results['trace'], 'track-and-trace-data', 'data', parameters['data']);
                    RegisterExecutionInstanceResource(execution_instance_entry.get('identifier'), 'track-and-trace-data', 'data', parameters['data'], 'resources.data.stop');
                }

                if (results['validation'] && !empty(results['validation'])) {
                    RegisterProcessElementTraceResource(results['trace'], 'track-and-trace-executions', 'verifications', { 'process': execution_instance_entry.get('process'), 'version': execution_instance_entry.get('version'), 'instance': execution_instance_entry.get('instance'), 'element': parameters['end'], 'validation': results['validation'] });
                }
            }

            return results;
        } else {
            const trace: IProcessElementTraceModel = await CreateProcessElementTraceEntry({ 'identifier': uuidv4(), 'instance': execution_instance_entry.get('instance'), 'process': execution_instance_entry.get('process'), 'version': execution_instance_entry.get('version'), 'type': 'invalid_element', 'element': parameters['end'], 'data': parameters['data'], 'validation': { 'integrity': 'invalid_element' } });
            await execution_instance_entry.update({ $push: { 'traces.updates': trace.get('identifier') } }, { upsert: true, new: true });
            
            if (parameters['data'] && !empty(parameters['data'])) {
                RegisterProcessElementTraceResource(trace.get('identifier'), 'track-and-trace-data', 'data', parameters['data']);
            }

            RegisterProcessElementTraceResource(trace.get('identifier'), 'track-and-trace-executions', 'verifications', { 'process': execution_instance_entry.get('process'), 'version': execution_instance_entry.get('version'), 'instance': execution_instance_entry.get('instance'), 'element': parameters['end'], 'validation': { 'integrity': 'invalid_element' } });
            // TODO URGENT: Send a notification (?)
            return { 'success': false, 'instance': execution_instance_entry.toJSON(), 'errors': ['invalid_element'] };
        }
    } catch {
        // TODO: Handle error
        throw new Error('An error occurred during termination of execution instance');
    }
}

export async function CancelExecutionInstance(parameters: { instance: Identifier, data?: Object }): Promise<{ 'success': boolean, 'instance'?: LeanDocument<IExecutionInstanceModel>, 'errors'?: string[], 'validation'?: { [key: string]: any } }> {
    try {
        const cancelation_results =  await CancelExecutionInstanceEntry(parameters);

        if(cancelation_results['success']) {
            if (parameters['data'] && !empty(parameters['data'])) {
                RegisterExecutionInstanceResource(parameters['instance'], 'track-and-trace-data', 'data', parameters['data'],'resources.data.stop');
            }
        }

        return cancelation_results;
    } catch {
        // TODO: Handle error
        throw new Error('An error occurred during cancelation of execution instance');
    }
}

export function ActivateImmediatePathsLinkedToStartEvents(execution_instance_entry: IExecutionInstanceModel, tree_of_instances: TreeOfProcessInstances): void {
    for (const start_event of Object.values(tree_of_instances['elements']).filter((element: ProcessElementClass) => element instanceof ProcessEventClass && element.get_type() === 'start')) {
        const child: ProcessElementClass = tree_of_instances['elements'][(start_event as ProcessEventClass).get_child()!];
        const new_branch: ProcessExecutionBranch = { 'state': 'candidate', 'start': child.get_identifier(), 'traces': [] };
        execution_instance_entry['execution']['branches'].push(new_branch);
        if (child instanceof ProcessDivergentGatewayClass) {
            CreateLevelForDivergentGateway(child, new_branch, tree_of_instances);
        }
    }
}

function CreateLevelForDivergentGateway(gateway: ProcessDivergentGatewayClass, branch_where_level_should_be_inserted: ProcessBranch | ProcessExecutionBranch, tree_of_instances: TreeOfProcessInstances): void {
    let level: ProcessLevel = { 'gateway': gateway.get_identifier(), 'state': 'candidate', 'branches': [] };
    for (let connection_identifier of gateway.get_connections()) {
        let connection: ProcessConnectionClass = tree_of_instances['connections'][connection_identifier];
        let successor: Identifier;
        if (connection.get_entry() === gateway.get_identifier()) {
            successor = connection.get_exit();
        } else {
            successor = connection.get_entry();
        }
        const branch: ProcessBranch = { 'state': 'candidate', 'connection': connection_identifier, 'traces': [] };
        level['branches'].push(branch);
        let first_element_of_branch: ProcessElementClass = tree_of_instances['elements'][successor];
        if (first_element_of_branch instanceof ProcessDivergentGatewayClass) CreateLevelForDivergentGateway(first_element_of_branch, branch, tree_of_instances);
        else if (first_element_of_branch instanceof ProcessEventClass && first_element_of_branch.get_type() === 'end') branch['state'] === 'executed';
    }

    branch_where_level_should_be_inserted['traces'].push(level);
}

export function ExploreAndTestExecutionForUpdate(element_to_insert: ProcessExecutableElementClass, execution: ProcessExecution, tree_of_instances: TreeOfProcessInstances, trace_identifier: Identifier): boolean {
    // All branches should be either candidate or active anyway
    for (const branch of execution['branches'].filter((branch: ProcessExecutionBranch) => ['candidate', 'active'].includes(branch['state']))) {
        const nb_registered_traces: number = branch['traces'].length;
        const branch_has_no_registered_traces: boolean = nb_registered_traces === 0;
        const element_to_consider: ProcessElementClass = tree_of_instances['elements'][branch_has_no_registered_traces ? branch['start'] : (has(branch['traces'][nb_registered_traces - 1], 'gateway') ? (branch['traces'][nb_registered_traces - 1] as ProcessLevel)['gateway'] : (branch['traces'][nb_registered_traces - 1] as ProcessExecutableElementTrace)['element'])];

        if (element_to_consider instanceof ProcessGatewayClass) {
            const level: ProcessLevel = branch['traces'][nb_registered_traces - 1] as ProcessLevel;
            const [element_was_inserted, branch_modified] = ExploreAndTestLevelForUpdate(element_to_insert, level, tree_of_instances, trace_identifier);

            if (element_was_inserted) {
                if (branch['state'] === 'candidate') branch['state'] = 'active';
                if (execution['state'] === 'candidate') execution['state'] = 'active';

                if (element_to_consider.get_type() === 'exclusive') {
                    for (const other_branch_of_gateway of level['branches'].filter((considered_branch: ProcessBranch) => considered_branch['connection'] !== branch_modified!['connection'])) {
                        TerminateBranchAndAllItsChildren(other_branch_of_gateway);
                    }
                }

                const identifier_of_reference_of_gateway_of_considered_level: Nullable<Identifier> = element_to_consider.get_reference();
                const reference_of_gateway_of_considered_level: Nullable<ProcessConvergentGatewayClass> = identifier_of_reference_of_gateway_of_considered_level ? tree_of_instances['elements'][identifier_of_reference_of_gateway_of_considered_level] as ProcessConvergentGatewayClass : null;
                if (reference_of_gateway_of_considered_level && !VerifyIfAtLeastOneBranchShouldBeExecutedInLevel(level, tree_of_instances)) {
                    const successor_of_reference_of_gateway: ProcessElementClass = tree_of_instances['elements'][reference_of_gateway_of_considered_level.get_child()!];
                    if (successor_of_reference_of_gateway instanceof ProcessDivergentGatewayClass) {
                        CreateLevelForDivergentGateway(successor_of_reference_of_gateway, branch, tree_of_instances);
                    }
                }

                return true;
            } else {
                if (VerifyIfElementCanBeInsertedAfterLevel(element_to_insert, level, tree_of_instances)) {
                    const trace: ProcessExecutableElementTrace = { 'trace': trace_identifier, 'element': element_to_insert.get_identifier() };
                    branch['traces'].push(trace);

                    const successor_of_element: ProcessElementClass = tree_of_instances['elements'][element_to_insert.get_child()!];
                    if (successor_of_element instanceof ProcessDivergentGatewayClass) {
                        CreateLevelForDivergentGateway(successor_of_element, branch, tree_of_instances);
                    }

                    return true;
                } else {
                    continue;
                }
            }
        } else if (element_to_consider instanceof ProcessExecutableElementClass) {
            const element_can_be_inserted: boolean = (branch_has_no_registered_traces) ? (element_to_consider.get_identifier() === element_to_insert.get_identifier()) : (element_to_consider.get_child() === element_to_insert.get_identifier());
            if (element_can_be_inserted) {
                if (branch['state'] === 'candidate') branch['state'] = 'active';
                if (execution['state'] === 'candidate') execution['state'] = 'active';

                const trace: ProcessExecutableElementTrace = { 'trace': trace_identifier, 'element': element_to_insert.get_identifier() };
                branch['traces'].push(trace);

                const successor_of_element: ProcessElementClass = tree_of_instances['elements'][element_to_insert.get_child()!];
                if (successor_of_element instanceof ProcessDivergentGatewayClass) {
                    CreateLevelForDivergentGateway(successor_of_element, branch, tree_of_instances);
                }

                return true;
            } else {
                continue;
            }
        } else {
            continue;
        }
    }

    return false;
}

function ExploreAndTestLevelForUpdate(element_to_insert: ProcessExecutableElementClass, level: ProcessLevel, tree_of_instances: TreeOfProcessInstances, trace_identifier: Identifier): [boolean, Nullable<ProcessBranch>] {
    const gateway_of_current_level: ProcessDivergentGatewayClass = tree_of_instances['elements'][level['gateway']] as ProcessDivergentGatewayClass;

    for (const branch of level['branches'].filter((branch: ProcessBranch) => ['candidate', 'active'].includes(branch['state']))) {
        const last_element_of_branch: Maybe<ProcessExecutableElementTrace | ProcessEndEventTrace | ProcessLevel> = branch['traces'][branch['traces'].length - 1];

        if (last_element_of_branch && has(last_element_of_branch, 'gateway')) {
            const last_level_of_branch: ProcessLevel = last_element_of_branch as ProcessLevel;
            if (['candidate', 'active'].includes(last_level_of_branch['state'])) {
                const [element_was_inserted, branch_modified]: [boolean, Nullable<ProcessBranch>] = ExploreAndTestLevelForUpdate(element_to_insert, last_element_of_branch as ProcessLevel, tree_of_instances, trace_identifier);

                const gateway_of_modified_level: ProcessGatewayClass = tree_of_instances['elements'][last_level_of_branch['gateway']] as ProcessGatewayClass;

                if (element_was_inserted) {
                    if (level['state'] === 'candidate') level['state'] = 'active';
                    if (branch['state'] === 'candidate') branch['state'] = 'active';

                    // Case where two successive convergent gateways, cf. case A in big else below
                    if (last_level_of_branch['state'] === 'executed') {
                        const gateway_of_executed_level: ProcessDivergentGatewayClass = tree_of_instances['elements'][last_level_of_branch['gateway']] as ProcessDivergentGatewayClass;
                        const reference_of_gateway_of_executed_level: Nullable<Identifier> = gateway_of_executed_level.get_reference();
                        const child_of_reference_gateway_for_executed_level: Nullable<Identifier> = reference_of_gateway_of_executed_level ? (tree_of_instances['elements'][reference_of_gateway_of_executed_level] as ProcessConvergentGatewayClass).get_child() : null;

                        const reference_of_gateway_of_current_level: Nullable<Identifier> = gateway_of_current_level.get_reference();
                        if (child_of_reference_gateway_for_executed_level && reference_of_gateway_of_current_level && (child_of_reference_gateway_for_executed_level === reference_of_gateway_of_current_level)) {
                            branch['state'] = 'executed';
                        }
                    }

                    if (level['branches'].every((branch: ProcessBranch) => ['executed', 'cancelled'].includes(branch['state']))) level['state'] = 'executed';
                    
                    const identifier_of_reference_of_gateway_of_modified_level: Nullable<Identifier> = gateway_of_modified_level.get_reference();
                    const reference_of_gateway_of_modified_level: Nullable<ProcessConvergentGatewayClass> = identifier_of_reference_of_gateway_of_modified_level ? tree_of_instances['elements'][identifier_of_reference_of_gateway_of_modified_level] as ProcessConvergentGatewayClass : null;
                    if (reference_of_gateway_of_modified_level && !VerifyIfAtLeastOneBranchShouldBeExecutedInLevel(last_level_of_branch, tree_of_instances)) {
                        const successor_of_reference_of_gateway: ProcessElementClass = tree_of_instances['elements'][reference_of_gateway_of_modified_level.get_child()!];
                        if (successor_of_reference_of_gateway instanceof ProcessDivergentGatewayClass) {
                            CreateLevelForDivergentGateway(successor_of_reference_of_gateway, branch, tree_of_instances);
                        }
                    }

                    if (gateway_of_modified_level.get_type() === 'exclusive') {
                        for (const other_branch_of_gateway of last_level_of_branch['branches'].filter((considered_branch: ProcessBranch) => considered_branch['connection'] !== branch_modified!['connection'])) {
                            TerminateBranchAndAllItsChildren(other_branch_of_gateway);
                        }
                    }

                    if (branch_modified!['state'] === 'candidate') branch_modified!['state'] = 'active';
                    
                    const last_element_of_modified_branch: (ProcessExecutableElementTrace | ProcessEndEventTrace | ProcessLevel) = branch_modified!['traces'][branch_modified!['traces'].length - 1];

                    if (has(last_element_of_modified_branch, 'gateway')) {
                        const last_level_of_modified_branch: ProcessLevel = last_element_of_modified_branch as ProcessLevel;
                        if (last_level_of_modified_branch['state'] === 'executed') {
                            const gateway_of_executed_level: ProcessDivergentGatewayClass = tree_of_instances['elements'][last_level_of_modified_branch['gateway']] as ProcessDivergentGatewayClass;
                            
                            const reference_of_gateway_of_executed_level: Nullable<Identifier> = gateway_of_executed_level.get_reference();
                            const child_of_reference_gateway_for_executed_level: Nullable<Identifier> = reference_of_gateway_of_executed_level ? (tree_of_instances['elements'][reference_of_gateway_of_executed_level] as ProcessConvergentGatewayClass).get_child() : null;
                            
                            const gateway_of_current_explored_level: ProcessDivergentGatewayClass = tree_of_instances['elements'][level['gateway']] as ProcessDivergentGatewayClass;
                            const reference_of_gateway_of_current_explored_level: Nullable<Identifier> = gateway_of_current_explored_level.get_reference();
                            
                            if (child_of_reference_gateway_for_executed_level && reference_of_gateway_of_current_explored_level && child_of_reference_gateway_for_executed_level === reference_of_gateway_of_current_explored_level) {
                                branch['state'] = 'executed';
                            }
                        }
                    }

                    return [element_was_inserted, branch];
                }
            }
        }

        // Not an else because sometimes an element can be added in current level even if last inserted element of branch was a level
        // (cf. example 3 from specification, case where f1 can be added even if p1 is active (as one of the branches is still candidate, while p1 is inclusive))
        if (VerifyIfElementCanBeInsertedInBranch(element_to_insert, branch, tree_of_instances)) {
            const gateway_of_current_explored_level: ProcessDivergentGatewayClass = tree_of_instances['elements'][level['gateway']] as ProcessDivergentGatewayClass;

            if (level['state'] === 'candidate') {
                level['state'] = 'active';
            }

            if (branch['state'] === 'candidate') {
                branch['state'] = 'active';

                // If branch is empty, we need to consider case where gateway is an OR exclusive
                // If so, all other candidate branches are cancelled
                if (gateway_of_current_explored_level.get_type() === 'exclusive') {
                    for (const other_branch of level['branches'].filter((branch_being_considered: ProcessBranch) => branch_being_considered['connection'] !== branch['connection'])) {
                        TerminateBranchAndAllItsChildren(other_branch);
                    }
                }
            }

            const trace: ProcessExecutableElementTrace = { 'trace': trace_identifier, 'element': element_to_insert.get_identifier() };
            branch['traces'].push(trace);
            
            const successor_of_element: ProcessElementClass = tree_of_instances['elements'][element_to_insert.get_child()!];

            if (successor_of_element instanceof ProcessConvergentGatewayClass) {
                branch['state'] = 'executed';
            }

            if (level['branches'].every((branch_being_considered: ProcessBranch) => ['executed', 'cancelled'].includes(branch_being_considered['state']))) {
                level['state'] = 'executed';
            }

            if (successor_of_element instanceof ProcessDivergentGatewayClass) {
                if ((level['state'] === 'executed') || ((gateway_of_current_explored_level.get_type() === 'inclusive') && (level['branches'].every((branch_being_considered: ProcessBranch) => ['candidate', 'executed'].includes(branch_being_considered['state']))))) {
                    CreateLevelForDivergentGateway(successor_of_element, branch, tree_of_instances);
                }
            }
            return [true, branch];
        }
    }

    return [false, null];
}

function VerifyIfAtLeastOneBranchShouldBeExecutedInLevel(level: ProcessLevel, tree_of_instances: TreeOfProcessInstances): boolean {
    const gateway_of_level: ProcessDivergentGatewayClass = tree_of_instances['elements'][level['gateway']] as ProcessDivergentGatewayClass;

    if ((gateway_of_level.get_type() === 'inclusive')) {
        const level_has_at_least_one_executed_branch: boolean = level['branches'].some((branch_being_considered: ProcessBranch) => branch_being_considered['state'] === 'executed');
        const level_has_at_least_one_active_branch: boolean = level['branches'].some((branch_being_considered: ProcessBranch) => branch_being_considered['state'] === 'active');

        return !level_has_at_least_one_executed_branch || level_has_at_least_one_active_branch;
    } else {
        const level_has_at_least_one_candidate_branch: boolean = level['branches'].some((branch_being_considered: ProcessBranch) => branch_being_considered['state'] === 'candidate');

        if (level_has_at_least_one_candidate_branch) {
            return true;
        }
        else {
            const active_branches: ProcessBranch[] = level['branches'].filter((branch_being_considered: ProcessBranch) => branch_being_considered['state'] === 'active');

            for (const branch of active_branches) {
                const last_element_of_branch: ProcessExecutableElementTrace | ProcessLevel = branch['traces'][branch['traces'].length - 1] as ProcessExecutableElementTrace | ProcessLevel;

                if (has(last_element_of_branch, 'gateway')) {
                    const last_level_of_branch: ProcessLevel = last_element_of_branch as ProcessLevel;
                    const gateway_of_last_level_of_branch: ProcessDivergentGatewayClass = tree_of_instances['elements'][last_level_of_branch['gateway']] as ProcessDivergentGatewayClass;
                    const reference_of_gateway_of_last_level_of_branch: Nullable<Identifier> = gateway_of_last_level_of_branch.get_reference();

                    const reference_of_gateway_of_current_level: Nullable<Identifier> = gateway_of_level.get_reference();
                    if (reference_of_gateway_of_last_level_of_branch && reference_of_gateway_of_current_level) {
                        if ((tree_of_instances['elements'][reference_of_gateway_of_last_level_of_branch] as ProcessConvergentGatewayClass).get_child() === reference_of_gateway_of_current_level) {
                            const result_from_iteration: boolean = VerifyIfAtLeastOneBranchShouldBeExecutedInLevel(last_level_of_branch, tree_of_instances);
                            if (result_from_iteration) return true;
                            else continue;
                        } else {
                            return true;
                        }
                    } else {
                        return true;
                    }
                } else {
                    return true;
                }
            }

            return false;
        }
    }
}

export function VerifyKeyControlViolations(element_to_register: ProcessExecutableElementClass | ProcessEventClass, execution: ProcessExecution, tree_of_instances: TreeOfProcessInstances): KeyControlViolationResults {
    for (const branch of execution['branches'].filter((branch: ProcessExecutionBranch) => ['candidate', 'active'].includes(branch['state']))) {
        const nb_registered_traces: number = branch['traces'].length;
        const branch_has_no_registered_traces: boolean = nb_registered_traces === 0;
        const element_to_consider: ProcessElementClass = tree_of_instances['elements'][branch_has_no_registered_traces ? branch['start'] : (has(branch['traces'][nb_registered_traces - 1], 'gateway') ? (branch['traces'][nb_registered_traces - 1] as ProcessLevel)['gateway'] : (branch['traces'][nb_registered_traces - 1] as ProcessExecutableElementTrace)['element'])];

        if (element_to_consider instanceof ProcessGatewayClass) {
            switch ((branch['traces'][nb_registered_traces - 1] as ProcessLevel)['state']) {
                case 'candidate': {
                    const results: KeyControlViolationResults = VerifyCandidateGateway(element_to_consider, element_to_register, tree_of_instances, branch['traces'][nb_registered_traces - 1] as ProcessLevel);
                    if (PossibleOrConfirmedKeyControlViolationValues.includes(results['violation'])) return results;
                    else continue;
                }
                case 'active': {
                    const results: KeyControlViolationResults = VerifyActiveGateway(element_to_consider, element_to_register, tree_of_instances, branch['traces'][nb_registered_traces - 1] as ProcessLevel);
                    if (PossibleOrConfirmedKeyControlViolationValues.includes(results['violation'])) return results;
                    else continue;
                }
                default: continue;
            }
        } else if (element_to_consider instanceof ProcessExecutableElementClass) {
            const potential_key_control_violated: ProcessElementClass = branch_has_no_registered_traces ? element_to_consider : tree_of_instances['elements'][element_to_consider.get_child() as Identifier];
            if (potential_key_control_violated instanceof ProcessKeyControlClass) {
                const violation_detected: boolean = VerifyKeyControlFollowingRegisteredTask(potential_key_control_violated as ProcessKeyControlClass, element_to_register, tree_of_instances);
                if (violation_detected) return { 'violation': 'confirmed', 'controls': [{ 'control': potential_key_control_violated.get_identifier(), 'violation': 'confirmed' }] };
                else continue;
            } else continue;
        }
    }

    return { 'violation': 'none' };
}

function VerifyKeyControlFollowingRegisteredTask(key_control: ProcessKeyControlClass, element_to_register: ProcessExecutableElementClass | ProcessEventClass, tree_of_instances: TreeOfProcessInstances): boolean {
    let successor: Maybe<ProcessElementClass> = tree_of_instances['elements'][key_control.get_child()];

    if (!successor) return false;

    if (successor instanceof ProcessCompensatingControlClass) {
        successor = tree_of_instances['elements'][successor.get_child()];
    }

    if (successor.get_identifier() === element_to_register.get_identifier()) {
        return true;
    } else if (successor instanceof ProcessGatewayClass) {
        if (successor instanceof ProcessDivergentGatewayClass) {
            return VerifyFirstElementOfEachBranchOfGateway(successor, element_to_register, tree_of_instances);
        }

        if (successor instanceof ProcessConvergentGatewayClass) {
            return VerifyIfElementIsAnImmediateChildOfConvergentGateway(successor, element_to_register, tree_of_instances);
        }
    }

    return false;
}

function VerifyCandidateGateway(gateway: ProcessGatewayClass, element_to_register: ProcessExecutableElementClass | ProcessEventClass, tree_of_instances: TreeOfProcessInstances, level: ProcessLevel): KeyControlViolationResults {
    let results: KeyControlViolationResults = VerifyPresenceOfElementInOneBranchOfGateway(gateway, level, element_to_register, tree_of_instances, []);
    if (results['violation'] === 'confirmed') {
        return results;
    } else {
        // If the gateway has no closing reference, then no need to proceed to further verifications
        const identifier_of_reference_of_gateway: Nullable<Identifier> = gateway.get_reference();
        if (identifier_of_reference_of_gateway) {
            const reference_of_gateway: ProcessConvergentGatewayClass = tree_of_instances['elements'][identifier_of_reference_of_gateway] as ProcessConvergentGatewayClass;
            results = VerifyRecursivelyAllCandidateBranchesOfGateway(gateway, gateway.get_connections(), element_to_register, tree_of_instances);
            
            if (results['violation'] === 'none') {
                return results;
            } else {
                const task_to_register_found_as_immediate_child_of_gateway: boolean = VerifyIfElementIsAnImmediateChildOfConvergentGateway(reference_of_gateway, element_to_register, tree_of_instances);
                if (task_to_register_found_as_immediate_child_of_gateway) {
                    return results;
                }
                else return { 'violation': 'none' };
            }
        } else {
            return { 'violation': 'none' };
        }
    }
}

function VerifyActiveGateway(gateway: ProcessGatewayClass, element_to_register: ProcessExecutableElementClass | ProcessEventClass, tree_of_instances: TreeOfProcessInstances, level: ProcessLevel): KeyControlViolationResults {
    let results: KeyControlViolationResults = VerifyPresenceOfElementInOneBranchOfGateway(gateway, level, element_to_register, tree_of_instances, []);
    if (results['violation'] === 'confirmed') {
        return results;
    } else {
        // If the gateway has no closing reference, then no need to proceed to further verifications
        const identifier_of_reference_of_gateway: Nullable<Identifier> = gateway.get_reference();
        if (identifier_of_reference_of_gateway) {
            const reference_of_gateway: ProcessConvergentGatewayClass = tree_of_instances['elements'][identifier_of_reference_of_gateway] as ProcessConvergentGatewayClass;

            const active_branches: ProcessBranch[] = level['branches'].filter((branch: ProcessBranch) => branch['state'] === 'active');
            const candidate_branches: ProcessBranch[] = level['branches'].filter((branch: ProcessBranch) => branch['state'] === 'candidate');
            results = VerifyRecursivelyAllBranchesOfActiveGateway(gateway, active_branches, candidate_branches, element_to_register, tree_of_instances);
            const element_to_register_found_as_immediate_child_of_gateway: boolean = VerifyIfElementIsAnImmediateChildOfConvergentGateway(reference_of_gateway, element_to_register, tree_of_instances);
            if (element_to_register_found_as_immediate_child_of_gateway) return results;
            else return { 'violation': 'none' };
        } else {
            return { 'violation': 'none' };
        }
    }
}

function VerifyRecursivelyAllBranchesOfActiveGateway(gateway: ProcessGatewayClass, active_branches: ProcessBranch[], candidate_branches: ProcessBranch[], element_to_register: ProcessExecutableElementClass | ProcessEventClass, tree_of_instances: TreeOfProcessInstances, visited_gateways: Identifier[] = []): KeyControlViolationResults {
    const results: KeyControlViolationResults = { 'violation': 'none' };

    const results_for_active_branches: { [key: string]: KeyControlViolationResults } = {};
    for (const branch of active_branches) {
        const last_registered_trace: ProcessLevel | ProcessExecutableElementTrace = branch['traces'][branch['traces'].length - 1] as ProcessLevel | ProcessExecutableElementTrace;

        let last_element: ProcessElementClass = tree_of_instances['elements'][has(last_registered_trace, 'element') ? (last_registered_trace as ProcessExecutableElementTrace)['element'] : (last_registered_trace as ProcessLevel)['gateway']];

        if (last_element instanceof ProcessExecutableElementClass) {
            last_element = tree_of_instances['elements'][last_element.get_child() as Identifier];
        }

        if (last_element instanceof ProcessKeyControlClass) {
            let next_element: ProcessElementClass = tree_of_instances['elements'][last_element.get_child()];

            if ((next_element instanceof ProcessCompensatingControlClass) && (next_element.get_key_control() === last_element.get_identifier())) {
                next_element = tree_of_instances['elements'][next_element.get_child()];
            }

            if ((next_element instanceof ProcessConvergentGatewayClass) && (next_element.get_reference() === gateway.get_identifier())) {
                results_for_active_branches[branch['connection']] = { 'violation': 'confirmed', 'controls': [{ 'control': last_element.get_identifier(), 'violation': 'confirmed' }] };
            } else if (next_element instanceof ProcessDivergentGatewayClass) {
                const reference_of_divergent_gateway: ProcessConvergentGatewayClass = tree_of_instances['elements'][next_element.get_reference()!] as ProcessConvergentGatewayClass;

                if (reference_of_divergent_gateway.get_child() === gateway.get_reference()) {
                    const results: KeyControlViolationResults = VerifyRecursivelyAllCandidateBranchesOfGateway(next_element, next_element.get_connections(), element_to_register, tree_of_instances, visited_gateways);
                    // TODO IMMEDIATELY: Restrict the if with verification of confirmed violation at the gateway level
                    if (results['violation'] === 'confirmed') {
                        results_for_active_branches[branch['connection']] = { 'violation': 'confirmed', 'controls': [{ 'control': last_element.get_identifier(), 'violation': 'confirmed' }, ...results['controls']] };;
                    } else {
                        results_for_active_branches[branch['connection']] = { 'violation': 'none' };
                    }
                } else {
                    results_for_active_branches[branch['connection']] = { 'violation': 'none' };
                }
            } else {
                results_for_active_branches[branch['connection']] = { 'violation': 'none' };
            }
        } else if (last_element instanceof ProcessDivergentGatewayClass) {
            const closing_reference_of_first_element: Nullable<Identifier> = last_element.get_reference();
            const closing_reference_of_gateway: Nullable<Identifier> = gateway.get_reference();
            // The second part of the condition ensures there is no task left on the branch after the closing reference of inner gateway (if any)
            if ((visited_gateways.includes(last_element.get_identifier())) || (!closing_reference_of_first_element || !closing_reference_of_gateway || ((tree_of_instances['elements'][closing_reference_of_first_element] as ProcessExecutableElementClass).get_child() !== closing_reference_of_gateway))) {
                results_for_active_branches[branch['connection']] = { 'violation': 'none' };
            } else {
                visited_gateways.push(last_element.get_identifier());
                let local_results: KeyControlViolationResults;
                // Cf. caseE
                if ((last_registered_trace as ProcessLevel)['state'] === 'active') {
                    const active_level: ProcessLevel = last_registered_trace as ProcessLevel;
                    const active_branches: ProcessBranch[] = active_level['branches'].filter((branch: ProcessBranch) => branch['state'] === 'active');
                    const candidate_branches: ProcessBranch[] = active_level['branches'].filter((branch: ProcessBranch) => branch['state'] === 'candidate');
                    local_results = VerifyRecursivelyAllBranchesOfActiveGateway(last_element, active_branches, candidate_branches, element_to_register, tree_of_instances);
                } else {
                    local_results = VerifyRecursivelyAllCandidateBranchesOfGateway(last_element, last_element.get_connections(), element_to_register, tree_of_instances, visited_gateways);
                }

                if (PossibleOrConfirmedKeyControlViolationValues.includes(local_results['violation'])) {
                    results_for_active_branches[branch['connection']] = local_results;
                } else {
                    results_for_active_branches[branch['connection']] = { 'violation': 'none' };
                }
            }
        } else {
            results_for_active_branches[branch['connection']] = { 'violation': 'none' };
            continue;
        }
    }

    if (Object.values(results_for_active_branches).find((results: KeyControlViolationResults) => PossibleOrConfirmedKeyControlViolationValues.includes(results['violation']))) {
        const violated_controls_in_active_branches: KeyControlViolation[] = flat_map(pick_by(results_for_active_branches, (result: KeyControlViolationResults) => PossibleOrConfirmedKeyControlViolationValues.includes(result['violation'])), 'controls');
        Object.assign(results, { 'violation': 'confirmed', 'controls': [...violated_controls_in_active_branches, ...((results['violation'] === 'none') ? [] : results['controls'])] });
    }

    if (gateway.get_type() !== 'exclusive') {
        const results_for_candidate_branches: KeyControlViolationResults = VerifyRecursivelyAllCandidateBranchesOfGateway(gateway, candidate_branches.map((branch: ProcessBranch) => branch['connection']), element_to_register, tree_of_instances);
        
        if (PossibleOrConfirmedKeyControlViolationValues.includes(results_for_candidate_branches['violation'])) Object.assign(results, { 'violation': ((results as KeyControlViolationResults)['violation'] === 'confirmed') ? 'confirmed' : 'possible', 'controls': [...(results_for_candidate_branches as PossibleAndConfirmedKeyControlViolationResults)['controls'], ...((results['violation'] === 'none') ? [] : results['controls'])] });
    }

    return results;
}

function VerifyPresenceOfElementInOneBranchOfGateway(parent_gateway: ProcessGatewayClass, level: ProcessLevel, element_to_register: ProcessExecutableElementClass | ProcessEventClass, tree_of_instances: TreeOfProcessInstances, visited_elements: string[] = []): KeyControlViolationResults {
    loop_on_branches:
    for (const branch of level['branches'].filter((branch: ProcessBranch) => ['candidate', 'active'].includes(branch['state']))) {
        let starting_point: ProcessElementClass;
        if (branch['state'] === 'candidate') {
            const connection: ProcessConnectionClass = tree_of_instances['connections'][branch['connection']];
            starting_point = tree_of_instances['elements'][connection.get_entry()];
        } else {
            const last_registered_trace_in_branch: ProcessExecutableElementTrace | ProcessEndEventTrace | ProcessLevel = branch['traces'][branch['traces'].length - 1];
            starting_point = tree_of_instances['elements'][(last_registered_trace_in_branch as ProcessExecutableElementTrace)['element'] ?? (last_registered_trace_in_branch as ProcessLevel)['gateway']];
        }

        if (starting_point instanceof ProcessDivergentGatewayClass) {
            if (visited_elements.includes(starting_point.get_identifier())) continue;

            visited_elements.push(starting_point.get_identifier());
            return VerifyPresenceOfElementInOneBranchOfGateway(parent_gateway, branch['traces'][branch['traces'].length - 1] as ProcessLevel, element_to_register, tree_of_instances, visited_elements);
        } else if (starting_point instanceof ProcessKeyControlClass) {
            let next_element: ProcessElementClass = tree_of_instances['elements'][starting_point.get_child()];

            if ((next_element instanceof ProcessCompensatingControlClass) && (next_element.get_key_control() === starting_point.get_identifier())) {
                next_element = tree_of_instances['elements'][next_element.get_child()];
            }

            if (next_element instanceof ProcessDivergentGatewayClass) {
                if (VerifyFirstElementOfEachBranchOfGateway(next_element, element_to_register, tree_of_instances)) {
                    return { 'violation': 'confirmed', 'controls': [{ 'control': starting_point.get_identifier(), 'violation': 'confirmed' }] };
                } else {
                    continue loop_on_branches;
                }
            } else {
                while (next_element instanceof ProcessConvergentGatewayClass) {
                    if (visited_elements.includes(next_element.get_identifier()) || (next_element.get_reference() === parent_gateway.get_identifier())) {
                        continue loop_on_branches;
                    } else {
                        visited_elements.push(next_element.get_identifier());
                        next_element = tree_of_instances['elements'][next_element.get_child()!];
                    }
                }

                if (next_element instanceof ProcessDivergentGatewayClass) {
                    const result: boolean = VerifyFirstElementOfEachBranchOfGateway(next_element, element_to_register, tree_of_instances);
                    
                    if (result) return { 'violation': 'confirmed', controls: [{ 'control': starting_point.get_identifier(), 'violation': 'confirmed' }] };
                    else continue loop_on_branches;
                } else if (next_element.get_identifier() === element_to_register.get_identifier()) {
                    return { 'violation': 'confirmed', controls: [{ 'control': starting_point.get_identifier(), 'violation': 'confirmed' }] };
                }
                else continue loop_on_branches;
            }
        }
    }

    return { 'violation': 'none' };
}

// TODO: Remove strict_verification parameter + no return before end even if gateway is exclusive and no violation detected for one branch
function VerifyRecursivelyAllCandidateBranchesOfGateway(gateway: ProcessGatewayClass, connections_of_candidate_branches: Identifier[], element_to_register: ProcessExecutableElementClass | ProcessEventClass, tree_of_instances: TreeOfProcessInstances, visited_gateways: Identifier[] = []): KeyControlViolationResults {
    const results_per_branches: { [key: string]: KeyControlViolationResults } = {};
    for (const connection_identifier of connections_of_candidate_branches) {
        const connection: ProcessConnectionClass = tree_of_instances['connections'][connection_identifier];
        const first_element: ProcessElementClass = tree_of_instances['elements'][connection.get_entry()];

        if (first_element instanceof ProcessKeyControlClass) {
            let next_element: ProcessElementClass = tree_of_instances['elements'][first_element.get_child()];

            if ((next_element instanceof ProcessCompensatingControlClass) && (next_element.get_key_control() === first_element.get_identifier())) {
                next_element = tree_of_instances['elements'][next_element.get_child()];
            }

            if ((next_element instanceof ProcessConvergentGatewayClass) && (next_element.get_reference() === gateway.get_identifier())) {
                results_per_branches[connection_identifier] = { 'violation': 'confirmed', 'controls': [{ 'control': first_element.get_identifier(), 'violation': 'confirmed' }] };
            } else if (next_element instanceof ProcessDivergentGatewayClass) {
                const reference_of_divergent_gateway: ProcessConvergentGatewayClass = tree_of_instances['elements'][next_element.get_reference()!] as ProcessConvergentGatewayClass;

                if (reference_of_divergent_gateway.get_child() === gateway.get_reference()) {
                    const results: KeyControlViolationResults = VerifyRecursivelyAllCandidateBranchesOfGateway(next_element, next_element.get_connections(), element_to_register, tree_of_instances, visited_gateways);
                    // TODO IMMEDIATELY: Restrict the if with verification of confirmed violation at the gateway level
                    if (PossibleOrConfirmedKeyControlViolationValues.includes(results['violation'])) {
                        results_per_branches[connection_identifier] = { 'violation': results['violation'], 'controls': [{ 'control': first_element.get_identifier(), 'violation': 'confirmed' }, ...(results as PossibleAndConfirmedKeyControlViolationResults)['controls']] };;
                    } else {
                        results_per_branches[connection_identifier] = { 'violation': 'none' };
                    }
                } else {
                    results_per_branches[connection_identifier] = { 'violation': 'none' };
                }
            } else {
                results_per_branches[connection_identifier] = { 'violation': 'none' };
            }
        } else if (first_element instanceof ProcessEventClass) {
            results_per_branches[connection_identifier] = { 'violation': 'none' };
        } else if (first_element instanceof ProcessDivergentGatewayClass) {
            const closing_reference_of_first_element: Nullable<Identifier> = first_element.get_reference();
            const closing_reference_of_gateway: Nullable<Identifier> = gateway.get_reference();
            // The second part of the condition ensures there is no task left on the branch after the closing reference of inner gateway (if any)
            if ((visited_gateways.includes(first_element.get_identifier())) || (!closing_reference_of_first_element || !closing_reference_of_gateway || ((tree_of_instances['elements'][closing_reference_of_first_element] as ProcessExecutableElementClass).get_child() !== closing_reference_of_gateway))) {
                results_per_branches[connection_identifier] = { 'violation': 'none' };
            } else {
                visited_gateways.push(first_element.get_identifier());
                const local_results: KeyControlViolationResults = VerifyRecursivelyAllCandidateBranchesOfGateway(first_element, first_element.get_connections(), element_to_register, tree_of_instances, visited_gateways)
                if (local_results['violation']) {
                    results_per_branches[connection_identifier] = local_results;
                } else {
                    results_per_branches[connection_identifier] = { 'violation': 'none' };
                }
            }
        } else {
            results_per_branches[connection_identifier] = { 'violation': 'none' };
        }
    }

    if (Object.values(results_per_branches).find((results: KeyControlViolationResults) => PossibleOrConfirmedKeyControlViolationValues.includes(results['violation']))) {
        const all_controls: KeyControlViolation[] = flat_map(pick_by(results_per_branches, (result: KeyControlViolationResults) => PossibleOrConfirmedKeyControlViolationValues.includes(result['violation'])), 'controls');
        // If gateway is not a AND, then all violations detected so far cannot be confirmed, even if some were marked as such during prior verifications (because of, e.g., inner AND gateway)
        if (gateway.get_type() !== 'parallel') all_controls.forEach((control: KeyControlViolation) => control['violation'] = 'possible');
        return { 'violation': Object.values(results_per_branches).every((results: KeyControlViolationResults) => results['violation'] === 'confirmed') ? 'confirmed' : 'possible', 'controls': all_controls };
    } else {
        return { 'violation': 'none' };
    }
}

function VerifyFirstElementOfEachBranchOfGateway(gateway: ProcessDivergentGatewayClass, element_to_register: ProcessExecutableElementClass | ProcessEventClass, tree_of_instances: TreeOfProcessInstances, visited_elements: Identifier[] = []): boolean {
    for (const connection_identifier of gateway.get_connections()) {
        const connection: ProcessConnectionClass = tree_of_instances['connections'][connection_identifier];
        const first_element: ProcessElementClass = tree_of_instances['elements'][connection.get_entry()];
        if (visited_elements.includes(first_element.get_identifier())) {
            continue;
        }

        visited_elements.push(first_element.get_identifier());
        if (first_element.get_identifier() === element_to_register.get_identifier()) {
            return true;
        } else if (first_element instanceof ProcessDivergentGatewayClass) {
            const result: boolean = VerifyFirstElementOfEachBranchOfGateway(first_element, element_to_register, tree_of_instances, visited_elements);
            if (result) return true;
            else continue;
        } else if (first_element instanceof ProcessConvergentGatewayClass) {
            const result: boolean = VerifyIfElementIsAnImmediateChildOfConvergentGateway(first_element, element_to_register, tree_of_instances);
            if (result) return true;
            else continue;
        } else continue;
    }

    return false;
}

function VerifyIfElementIsAnImmediateChildOfConvergentGateway(gateway: ProcessConvergentGatewayClass, element_to_register: ProcessExecutableElementClass | ProcessEventClass, tree_of_instances: TreeOfProcessInstances, visited_elements: Identifier[] = []): boolean {
    const successor: ProcessElementClass = tree_of_instances['elements'][gateway.get_child()!];

    if (visited_elements.includes(successor.get_identifier())) return false;

    visited_elements.push(successor.get_identifier());
    if ((successor instanceof ProcessExecutableElementClass) || (successor instanceof ProcessEventClass)) {
        if (successor.get_identifier() === element_to_register.get_identifier()) return true;
        else return false;
    } else if (successor instanceof ProcessGatewayClass) {
        if (successor instanceof ProcessDivergentGatewayClass) {
            return VerifyFirstElementOfEachBranchOfGateway(successor, element_to_register, tree_of_instances, visited_elements);
        }

        if (successor instanceof ProcessConvergentGatewayClass) {
            return VerifyIfElementIsAnImmediateChildOfConvergentGateway(successor, element_to_register, tree_of_instances, visited_elements);
        }
    }

    return false;
}

export function ExploreAndTestExecutionForTermination(event: ProcessEventClass, execution: ProcessExecution, tree_of_instances: TreeOfProcessInstances, trace_identifier: Identifier): boolean {
    // All branches should be either candidate or active anyway
    for (const branch of execution['branches'].filter((branch: ProcessExecutionBranch) => ['candidate', 'active'].includes(branch['state']))) {
        const nb_registered_traces: number = branch['traces'].length;
        const branch_has_no_registered_traces: boolean = nb_registered_traces === 0;
        const element_to_consider: ProcessElementClass = tree_of_instances['elements'][branch_has_no_registered_traces ? branch['start'] : (has(branch['traces'][nb_registered_traces - 1], 'gateway') ? (branch['traces'][nb_registered_traces - 1] as ProcessLevel)['gateway'] : (branch['traces'][nb_registered_traces - 1] as ProcessExecutableElementTrace)['element'])];

        if (element_to_consider instanceof ProcessGatewayClass) {
            const level: ProcessLevel = branch['traces'][nb_registered_traces - 1] as ProcessLevel;
            const [process_has_been_terminated, _]: [boolean, Nullable<ProcessBranch>] = ExploreAndTestLevelForTermination(event, level, tree_of_instances, trace_identifier);

            if (process_has_been_terminated) {
                branch['state'] = 'executed';
                execution['state'] = 'executed';

                return true;
            } else {
                if (VerifyIfElementCanBeInsertedAfterLevel(event, level, tree_of_instances)) {
                    branch['state'] = 'executed';
                    execution['state'] = 'executed';
                    const trace: ProcessEndEventTrace = { 'trace': trace_identifier, 'end': event.get_identifier() };
                    branch['traces'].push(trace);
                    return true;
                } else {
                    continue;
                }
            }
        } else if (element_to_consider instanceof ProcessExecutableElementClass) {
            const element_can_be_inserted: boolean = (branch_has_no_registered_traces) ? (element_to_consider.get_identifier() === event.get_identifier()) : (element_to_consider.get_child() === event.get_identifier());
            if (element_can_be_inserted) {
                branch['state'] = 'executed';
                execution['state'] = 'executed';

                const trace: ProcessExecutableElementTrace = { 'trace': trace_identifier, 'element': event.get_identifier() };
                branch['traces'].push(trace);

                return true;
            } else {
                continue;
            }
        } else {
            continue;
        }
    }

    return false;
}

function ExploreAndTestLevelForTermination(event: ProcessEventClass, level: ProcessLevel, tree_of_instances: TreeOfProcessInstances, trace_identifier: Identifier): [boolean, Nullable<ProcessBranch>] {
    for (const branch of level['branches'].filter((branch: ProcessBranch) => ['candidate', 'active'].includes(branch['state']))) {
        const last_element_of_branch: Maybe<ProcessExecutableElementTrace | ProcessEndEventTrace | ProcessLevel> = branch['traces'][branch['traces'].length - 1];

        if (last_element_of_branch && has(last_element_of_branch, 'gateway')) {
            const last_level_of_branch: ProcessLevel = last_element_of_branch as ProcessLevel;
            if (['candidate', 'active'].includes(last_level_of_branch['state'])) {
                const [process_has_been_terminated, branch_terminated]: [boolean, Nullable<ProcessBranch>] = ExploreAndTestLevelForTermination(event, last_level_of_branch, tree_of_instances, trace_identifier);

                if (process_has_been_terminated) {
                    level['state'] = 'executed';
                    branch['state'] = 'executed';

                    const gateway_of_level: ProcessDivergentGatewayClass = tree_of_instances['elements'][last_level_of_branch['gateway']] as ProcessDivergentGatewayClass;
                    if (gateway_of_level.get_type() === 'exclusive') {
                        for (let branch_of_gateway of (last_element_of_branch as ProcessLevel)['branches'].filter((considered_branch: ProcessBranch) => considered_branch['connection'] !== branch_terminated!['connection'])) {
                            TerminateBranchAndAllItsChildren(branch_of_gateway);
                        }
                    }

                    return [process_has_been_terminated, branch];
                }
            }
        }

        if (VerifyIfElementCanBeInsertedInBranch(event, branch, tree_of_instances)) {
            branch['state'] = 'executed';
            level['state'] = 'executed';

            // If branch is empty, we need to consider case where gateway is an OR exclusive
            // If so, all other candidate branches are cancelled
            for (const other_branch of level['branches'].filter((branch_being_considered: ProcessBranch) => branch_being_considered['connection'] !== branch['connection'])) {
                TerminateBranchAndAllItsChildren(other_branch);
            }

            const trace: ProcessEndEventTrace = { 'trace': trace_identifier, 'end': event.get_identifier() };
            branch['traces'].push(trace);
            return [true, branch];
        }
    }

    return [false, null];
}

export function CancelExecution(execution: ProcessExecution, tree_of_instances: TreeOfProcessInstances): void {
    for (const branch of execution['branches'].filter((branch: ProcessExecutionBranch) => ['candidate', 'active'].includes(branch['state']))) {
        const last_element_of_branch: (ProcessExecutableElementTrace | ProcessLevel) = branch['traces'][branch['traces'].length - 1] as (ProcessExecutableElementTrace | ProcessLevel);
        if (has(last_element_of_branch, 'gateway') && ['candidate', 'active'].includes((last_element_of_branch as ProcessLevel)['state'])) {
            ExploreAndCancelCandidateAndActiveLevels(last_element_of_branch as ProcessLevel, tree_of_instances);

            const gateway_of_level: ProcessGatewayClass = tree_of_instances['elements'][(last_element_of_branch as ProcessLevel)['gateway']] as ProcessGatewayClass;
            if (gateway_of_level.get_type() === 'exclusive') {
                for (const branch_of_gateway of (last_element_of_branch as ProcessLevel)['branches'].filter((branch: ProcessBranch) => branch['state'] !== 'executed')) {
                    TerminateBranchAndAllItsChildren(branch_of_gateway, true);
                }
            }
        }

        branch['state'] = 'cancelled';
    }

    execution['state'] = 'cancelled';
}

function ExploreAndCancelCandidateAndActiveLevels(level: ProcessLevel, tree_of_instances: TreeOfProcessInstances): void {
    for (const branch of level['branches'].filter((branch: ProcessBranch) => ['candidate', 'active'].includes(branch['state']))) {
        const last_element_of_branch: (ProcessExecutableElementTrace | ProcessEndEventTrace | ProcessLevel) = branch['traces'][branch['traces'].length - 1];
        if (has(last_element_of_branch, 'gateway') && ['candidate', 'active'].includes((last_element_of_branch as ProcessLevel)['state'])) {
            ExploreAndCancelCandidateAndActiveLevels(last_element_of_branch as ProcessLevel, tree_of_instances);

            const gateway_of_level: ProcessGatewayClass = tree_of_instances['elements'][(last_element_of_branch as ProcessLevel)['gateway']] as ProcessGatewayClass;
            if (gateway_of_level.get_type() === 'exclusive') {
                for (const branch_of_gateway of (last_element_of_branch as ProcessLevel)['branches'].filter((branch: ProcessBranch) => branch['state'] !== 'executed')) {
                    TerminateBranchAndAllItsChildren(branch_of_gateway, true);
                }
            }
        }

        branch['state'] = 'cancelled';
    }

    level['state'] = 'cancelled';
}

function TerminateBranchAndAllItsChildren(branch: ProcessBranch | ProcessExecutionBranch, cancellation: boolean = false): void {
    if (['executed', 'cancelled'].includes(branch['state'])) return;

    if ((branch['state'] === 'candidate') || cancellation) branch['state'] = 'cancelled';
    else branch['state'] = 'executed';

    if ((branch['traces'].length > 0) && has(branch['traces'][branch['traces'].length - 1], 'gateway')) {
        TerminateLevelAndAllItsBranches(branch['traces'][branch['traces'].length - 1] as ProcessLevel, cancellation);
    }
}

function TerminateLevelAndAllItsBranches(level: ProcessLevel, cancellation: boolean = false): void {
    for (let branch of level['branches'].filter((branch_being_considered: ProcessBranch) => ['candidate', 'active'].includes(branch_being_considered['state']))) {
        TerminateBranchAndAllItsChildren(branch, cancellation);
    }
    if ((level['state'] === 'candidate') || cancellation) level['state'] = 'cancelled';
    else level['state'] = 'executed';
}

function VerifyIfElementCanBeInsertedInBranch(element: ProcessExecutableElementClass | ProcessEventClass, branch: ProcessBranch, tree_of_instances: TreeOfProcessInstances): boolean {
    if (branch['traces'].length === 0) return VerifyFirstElementOfBranch(element, branch, tree_of_instances);
    else return VerifyLastElementOfBranch(element, branch, tree_of_instances)
}

function VerifyFirstElementOfBranch(element: ProcessElementClass, branch: ProcessBranch, tree_of_instances: TreeOfProcessInstances): boolean {
    const connection: ProcessConnectionClass = tree_of_instances['connections'][branch['connection']];
    return (branch['traces'].length === 0) && (connection.get_entry() === element.get_identifier());
}

function VerifyLastElementOfBranch(element: ProcessElementClass, branch: ProcessBranch, tree_of_instances: TreeOfProcessInstances): boolean {
    let last_element_of_branch: ProcessExecutableElementTrace | ProcessEndEventTrace | ProcessLevel = branch['traces'][branch['traces'].length - 1];

    if (has(last_element_of_branch, 'gateway')) {
        return VerifyIfElementCanBeInsertedAfterLevel(element, last_element_of_branch as ProcessLevel, tree_of_instances);
    } else {
        return VerifyIfLastElementOfBranchIsDirectParentOfElement(element.get_parents(), (last_element_of_branch as ProcessExecutableElementTrace)['element']!);
    }
}

function VerifyIfElementCanBeInsertedAfterLevel(element: ProcessElementClass, level: ProcessLevel, tree_of_instances: TreeOfProcessInstances): boolean {
    const gateway_of_level: ProcessDivergentGatewayClass = tree_of_instances['elements'][level['gateway']] as ProcessDivergentGatewayClass;
    const reference_of_gateway_of_level: Nullable<ProcessConvergentGatewayClass> = gateway_of_level.get_reference() ? tree_of_instances['elements'][gateway_of_level.get_reference()!] as ProcessConvergentGatewayClass : null;

    if (reference_of_gateway_of_level) {
        for (const convergent_gateway_as_parent of element.get_parents().filter((identifier: Identifier) => tree_of_instances['elements'][identifier] instanceof ProcessConvergentGatewayClass)) {
            if (reference_of_gateway_of_level.get_identifier() === convergent_gateway_as_parent) {
                if (level['state'] === 'executed') {
                    return true;
                } else if ((level['state'] === 'active') && (!VerifyIfAtLeastOneBranchShouldBeExecutedInLevel(level, tree_of_instances))) {
                    level['branches'].filter((branch_being_considered: ProcessBranch) => ['candidate', 'active'].includes(branch_being_considered['state'])).forEach((branch_being_considered: ProcessBranch) => {
                        TerminateBranchAndAllItsChildren(branch_being_considered);
                    });
                    level['state'] = 'executed';
                    return true;
                } else {
                    continue;
                }
            }
        }
        return false;
    } else {
        return false;
    }
}

function VerifyIfLastElementOfBranchIsDirectParentOfElement(parents_of_element: Identifier[], identifier_of_last_element_of_branch: Identifier): boolean {
    return parents_of_element.includes(identifier_of_last_element_of_branch);
}