import config from 'config';
import { isEmpty as empty } from 'lodash';
import { ClientSession, Document, Query, FilterQuery, LeanDocument } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

import { Nullable, Identifier, Timestamp, RegisterReference, ComputeSHA256, SignContent, VerifySignature, QueryExecutionError, ElementNotFoundInCollection, TreeOfProcessInstances, ProcessEventClass, ProcessExecutableElementClass, ExecutionInstanceOptions, ProcessTaskOptions, ProcessControlClass, ProcessElementTraceType, KeyControlViolationResults, Sort, RegisteredData, RetrieveData, ListOfVerifiedExecutionConditions, VerifiedExecutionCondition, PossibleOrConfirmedKeyControlViolationValues, PossibleAndConfirmedKeyControlViolationResults } from 'core';
import { DATABASE_CONNECTION as connection } from '@service/database/database';
import { IExecutionInstanceSchema, IExecutionInstanceModel } from './instance';
import { ExecutionInstance, IProcessVersionModel, GetProcessVersionEntry, VerifyProcessVersionSignature, IExecutionInstanceTraceModel, CreateExecutionInstanceTraceEntry, FetchExecutionInstanceTraces } from '@service/database/schemata';
import { ActivateImmediatePathsLinkedToStartEvents, ExploreAndTestExecutionForUpdate, ExploreAndTestExecutionForTermination, CancelExecution, VerifyKeyControlViolations } from '@service/controllers/controller';
import { ConvertTreeOfObjects } from '@service/controllers/converter';

import { InvalidProcessVersionSignature } from '@service/errors/errors';
import { CreateProcessElementTraceEntry } from '../traces/trace';
import { IProcessElementTraceModel } from '../traces/elements/trace';
import { RegisterEntry } from '@service/controllers/blockchain';
import { ExecuteTaskActions } from '@service/controllers/executor';

type ExecutionInstanceQuery = Query<Nullable<IExecutionInstanceModel>, IExecutionInstanceModel>;

async function ExecuteQuery(identifier: string, operation: string, query: ExecutionInstanceQuery): Promise<IExecutionInstanceModel> {
	let execution_instance: Nullable<IExecutionInstanceModel>;
	try {
		execution_instance = await query.exec();
	} catch (error) {
		throw new QueryExecutionError(operation);
	}

	if (execution_instance) return execution_instance;

	throw new ElementNotFoundInCollection('execution instance', identifier);
}

export async function GetExecutionInstanceEntry(identifier: string, session?: ClientSession): Promise<IExecutionInstanceModel> {
	const query: ExecutionInstanceQuery = ExecutionInstance.findOne({ instance: identifier }).session(session ?? null);
	return ExecuteQuery(identifier, 'fetch', query);
}

export async function CreateExecutionInstanceEntry(parameters: { 'process': Identifier, 'version': Identifier, 'instance'?: Identifier, data?: Object, options?: ExecutionInstanceOptions }, session?: ClientSession): Promise<IExecutionInstanceModel> {
	let success: boolean = false;
	let execution_instance_entry: IExecutionInstanceModel;

	const operations = async (parameters: { 'process': Identifier, 'version': Identifier, 'instance'?: Identifier, data?: Object, options?: ExecutionInstanceOptions }, session?: ClientSession): Promise<void> => {
		const process_version_entry: IProcessVersionModel = await GetProcessVersionEntry(parameters['process'], parameters['version'], session);

		if (process_version_entry.get('state') === 'active') {
			// TODO URGENT: Signature should be verified during pre-validate hook
			if (!VerifyProcessVersionSignature(process_version_entry)) throw new InvalidProcessVersionSignature(process_version_entry.get('process'), process_version_entry.get('version'));

			const creation: Timestamp = Date.now();
			const instance: Identifier = parameters['instance'] ?? uuidv4();
			const signature: string = SignContent(ComputeSHA256(`${process_version_entry.get('process')}_${process_version_entry.get('version')}_${instance}_${creation}_${process_version_entry.get('signature')}${(parameters['options'] && !empty(parameters['options'])) ? '_' + ComputeSHA256(JSON.stringify(Sort(parameters['options']))) : ''}`), config.get('crypto.signing.keys.track_and_trace'));
			execution_instance_entry = await new ExecutionInstance({ 'instance': instance, 'process': process_version_entry.get('process'), 'version': process_version_entry.get('version'), 'state': 'inactive', 'creation': creation, 'signature': signature, 'execution': { 'state': 'candidate', 'branches': [] } }).save({ session });

			const trace: IExecutionInstanceTraceModel = await CreateExecutionInstanceTraceEntry({ 'process': parameters['process'], 'version': parameters['version'], 'instance': instance, 'type': 'creation', 'data': parameters['data'] }, session);

			execution_instance_entry.set('traces.creation', trace.get('identifier'));
			execution_instance_entry.markModified('traces.creation');
			await execution_instance_entry.save({ session });

			await process_version_entry.update({ $push: { 'instances': instance } }, { upsert: true, new: true, session });

			success = true;
		} else {
			// TODO: Cancel data registration by submitting a message to Data Manager using the message queue of the platform
			// TODO: Handle error
			throw new Error('Execution instance is not active');
		}
	};

	if (session) {
		await operations(parameters, session);
	} else {
		await connection.transaction(async function executor(session: ClientSession): Promise<void> {
			await operations(parameters, session);
		}).catch((error) => { /* TODO: Log */ });
	}

	if (success) return execution_instance_entry!;
	else throw new QueryExecutionError('creation of execution instance entry');
}

export async function RegisterExecutionInstanceResource(instance: Identifier, repository: string, resource: string, data: any, path: string = `resources.${resource}`): Promise<void> {
    try {
        const execution_instance_entry: IExecutionInstanceModel = await GetExecutionInstanceEntry(instance);
        const reference: any = await RegisterReference(repository, data);
        RegisterEntry(config.has(`track-and-trace.storage.${resource}`) ? config.get(`track-and-trace.storage.${resource}`) : 'fabric', 'data', reference['identifier'], reference['fingerprint']);
        execution_instance_entry.set(path, reference['identifier']);
        execution_instance_entry.markModified(path);
        await execution_instance_entry.save();
    } catch(error) {
        // TODO: Handle error
        throw error;
    }
}

// TODO URGENT: Set created type as return (verifications should not be added if empty condition verification results, while it is done in some parts of the function)
export async function ActivateExecutionInstanceEntry(parameters: { instance: Identifier, data?: Object }, session?: ClientSession): Promise<{ 'success': boolean, 'instance'?: LeanDocument<IExecutionInstanceModel>, 'errors'?: string[], 'validation'?: { [key: string]: any } }> {
	// TODO URGENT: Create appropriate type
	const results: { 'success': boolean, 'instance'?: LeanDocument<IExecutionInstanceModel>, 'errors'?: string[], 'validation'?: { [key: string]: any } } = { 'success': false };

	let execution_instance_entry: IExecutionInstanceModel;

	const operations = async (parameters: { instance: Identifier, data?: Object }, session: ClientSession): Promise<void> => {
		execution_instance_entry = await GetExecutionInstanceEntry(parameters['instance'], session);
		if (execution_instance_entry.get('state') === 'inactive') {
			const process_version_entry: IProcessVersionModel = await GetProcessVersionEntry(execution_instance_entry.get('process'), execution_instance_entry.get('version'), session);
			const process_version_model: RegisteredData = await RetrieveData(process_version_entry.get('resources.file'));
			const tree_of_instances: TreeOfProcessInstances = ConvertTreeOfObjects(process_version_model['data']['tree']);

			ActivateImmediatePathsLinkedToStartEvents(execution_instance_entry, tree_of_instances);
			execution_instance_entry.markModified('execution');
			execution_instance_entry.set('state', 'running');
			execution_instance_entry.set('start', Date.now());
			await execution_instance_entry.save({ session });

			const trace: IExecutionInstanceTraceModel = await CreateExecutionInstanceTraceEntry({ 'process': execution_instance_entry.get('process'), 'version': execution_instance_entry.get('version'), 'instance': execution_instance_entry.get('instance'), 'type': 'activation', 'data': parameters['data'] }, session);

			execution_instance_entry.set('traces.start', trace.get('identifier'));
			execution_instance_entry.markModified('traces.start');
			await execution_instance_entry.save({ session });

			Object.assign(results, { 'success': true, 'instance': execution_instance_entry.toJSON() });
		} else {
			// TODO: Handle error
			Object.assign(results, { 'success': false, 'instance': execution_instance_entry.toJSON(), 'errors': ['instance_not_inactive'] });
		}
	};

	if (session) {
		await operations(parameters, session);
	} else {
		await connection.transaction(async function executor(session: ClientSession): Promise<void> {
			await operations(parameters, session);
		}).catch((error) => { /* TODO: Log error */ throw error });
	}

	return results;
}

// TODO URGENT: Set created type as return (verifications should not be added if empty condition verification results, while it is done in some parts of the function)
export async function UpdateExecutionInstanceEntry(parameters: { instance: Identifier, task: Identifier, data?: Object, options?: ProcessTaskOptions, conditions: ListOfVerifiedExecutionConditions }, session?: ClientSession): Promise<{ 'success': boolean, 'instance'?: LeanDocument<IExecutionInstanceModel>, 'trace'?: Identifier, 'errors'?: string[], 'validation'?: { [key: string]: any } }> {
	// TODO: Merge behavior (returned result, insertion of the reference of the created trace in the instance properties, etc.)

	// TODO URGENT: Create appropriate type
	const results: { 'success': boolean, 'instance'?: LeanDocument<IExecutionInstanceModel>, 'trace'?: Identifier, 'errors'?: string[], 'validation'?: { [key: string]: any } } = { 'success': false };

	const operations = async (parameters: { instance: Identifier, task: Identifier, data?: Object, options?: ProcessTaskOptions, conditions: ListOfVerifiedExecutionConditions }, session: ClientSession): Promise<void> => {
		const execution_instance_entry: IExecutionInstanceModel = await GetExecutionInstanceEntry(parameters['instance'], session);
		if (execution_instance_entry.get('state') === 'running') {
			const at_least_one_condition_is_invalid: boolean = !empty(parameters['conditions']) ? Object.values(parameters['conditions']).some((result: VerifiedExecutionCondition) => result['validation'] === false) : false;

			const process_version_entry: IProcessVersionModel = await GetProcessVersionEntry(execution_instance_entry.get('process'), execution_instance_entry.get('version'), session);

			// TODO: Merge with verification in top-level control
			const deviation_traces: LeanDocument<IExecutionInstanceTraceModel>[] = await FetchExecutionInstanceTraces({ 'filters': { process: execution_instance_entry.get('process'), version: execution_instance_entry.get('version'), instance: execution_instance_entry.get('instance'), type: 'deviation' } }, session);
			const was_already_deviated: boolean = !!execution_instance_entry.get('deviation') || (deviation_traces.length > 0);
			const is_deviated: boolean = parameters['options']?.['deviation'] || was_already_deviated;
			if (is_deviated) {
				if (at_least_one_condition_is_invalid) {
					const trace: IProcessElementTraceModel = await CreateProcessElementTraceEntry({ 'identifier': uuidv4(), 'instance': execution_instance_entry.get('instance'), 'process': execution_instance_entry.get('process'), 'version': execution_instance_entry.get('version'), 'type': 'validation_failed', 'element': parameters['task'], 'data': parameters['data'], 'options': parameters['options'], 'validation': { 'integrity': 'ok', 'deviation': true, 'conditions': parameters['conditions'] } }, session);
					await execution_instance_entry.update({ $push: { 'traces.updates': trace.get('identifier') } }, { upsert: true, new: true, session });
					Object.assign(results, { 'success': false, 'instance': execution_instance_entry.toJSON(), 'trace': trace.get('identifier'), 'errors': ['verification_of_conditions_failed'], 'validation': { 'integrity': 'deviation_enforced', 'deviation': true, 'conditions': parameters['conditions'] } });
					ExecuteTaskActions(['failure'], execution_instance_entry.get('instance'), parameters['task'], parameters['data'], parameters['options']);
				} else {
					if (!was_already_deviated) {
						// TODO URGENT: Send a notification (if needed) to inform of the deviation

						execution_instance_entry.set('deviation', Date.now());

						const process_version_model: RegisteredData = await RetrieveData(process_version_entry.get('resources.file'));
						const tree_of_instances: TreeOfProcessInstances = ConvertTreeOfObjects(process_version_model['data']['tree']);
						CancelExecution(execution_instance_entry.get('execution'), tree_of_instances);
						execution_instance_entry.markModified('execution');
						await execution_instance_entry.save({ session });
					}

					const trace: IProcessElementTraceModel = await CreateProcessElementTraceEntry({ 'identifier': uuidv4(), 'instance': execution_instance_entry.get('instance'), 'process': execution_instance_entry.get('process'), 'version': execution_instance_entry.get('version'), 'type': was_already_deviated ? 'update' : 'deviation', 'element': parameters['task'], 'data': parameters['data'], 'options': parameters['options'], 'validation': { 'integrity': 'ok', 'deviation': true, ...(!empty(parameters['conditions']) && { 'conditions': parameters['conditions'] }) } }, session);

					await execution_instance_entry.update({ $push: { 'traces.updates': trace.get('identifier') } }, { upsert: true, new: true, session });
					Object.assign(results, { 'success': true, 'instance': execution_instance_entry.toJSON(), 'trace': trace.get('identifier'), 'validation': { 'integrity': 'ok', 'deviation': true, ...(!empty(parameters['conditions']) && { 'conditions': parameters['conditions'] }) } });
					ExecuteTaskActions(['success'], execution_instance_entry.get('instance'), parameters['task'], parameters['data'], parameters['options']);
				}
			} else {
				const trace_identifier: Identifier = uuidv4();
				const process_version_model: RegisteredData = await RetrieveData(process_version_entry.get('resources.file'));
				const tree_of_instances: TreeOfProcessInstances = ConvertTreeOfObjects(process_version_model['data']['tree']);
				const element: ProcessExecutableElementClass = tree_of_instances['elements'][parameters['task']] as ProcessExecutableElementClass;
				const element_was_inserted: boolean = ExploreAndTestExecutionForUpdate(element, execution_instance_entry.get('execution'), tree_of_instances, trace_identifier);

				if (element_was_inserted) {
					if (at_least_one_condition_is_invalid) {
						// TODO: Remove those two lines as they could be useless (check for no conflict with update)
						execution_instance_entry.unmarkModified('execution'); // We ignore the modification of the execution tree, as we should not persist an update of the process because of failed condition(s)
						await execution_instance_entry.save({ session });
						
						const trace: IProcessElementTraceModel = await CreateProcessElementTraceEntry({ 'identifier': trace_identifier, 'instance': execution_instance_entry.get('instance'), 'process': execution_instance_entry.get('process'), 'version': execution_instance_entry.get('version'), 'type': 'validation_failed', 'element': parameters['task'], 'data': parameters['data'], 'options': parameters['options'], 'validation': { 'integrity': 'ok', 'deviation': false, 'conditions': parameters['conditions'] } }, session);
						await execution_instance_entry.update({ $push: { 'traces.updates': trace.get('identifier') } }, { upsert: true, new: true, session });
						Object.assign(results, { 'success': false, 'instance': execution_instance_entry.toJSON(), 'trace': trace.get('identifier'), 'errors': ['verification_of_conditions_failed'], 'validation': { 'integrity': 'ok', 'deviation': false, 'conditions': parameters['conditions'] } });
						ExecuteTaskActions(['failure'], execution_instance_entry.get('instance'), parameters['task'], parameters['data'], parameters['options']);
					} else {
						execution_instance_entry.markModified('execution');
						await execution_instance_entry.save({ session });

						const trace_type: ProcessElementTraceType = (element instanceof ProcessControlClass) ? `${element.get_control_type()}_control_executed` : 'task_executed';
						const trace: IProcessElementTraceModel = await CreateProcessElementTraceEntry({ 'identifier': trace_identifier, 'instance': execution_instance_entry.get('instance'), 'process': execution_instance_entry.get('process'), 'version': execution_instance_entry.get('version'), 'type': trace_type, 'element': parameters['task'], 'data': parameters['data'], 'options': parameters['options'], 'validation': { 'integrity': 'ok', 'deviation': false, ...(!empty(parameters['conditions']) && { 'conditions': parameters['conditions'] }) } }, session);
						await execution_instance_entry.update({ $push: { 'traces.updates': trace.get('identifier') } }, { upsert: true, new: true, session });
						Object.assign(results, { 'success': true, 'instance': execution_instance_entry.toJSON(), 'trace': trace.get('identifier'), 'validation': { 'integrity': 'ok', 'deviation': false, ...(!empty(parameters['conditions']) && { 'conditions': parameters['conditions'] }) } });
						ExecuteTaskActions(['success'], execution_instance_entry.get('instance'), parameters['task'], parameters['data'], parameters['options']);
					}
				} else {
					const verification_of_key_control_violations: KeyControlViolationResults = VerifyKeyControlViolations(element, execution_instance_entry.get('execution'), tree_of_instances);
					if (PossibleOrConfirmedKeyControlViolationValues.includes(verification_of_key_control_violations['violation'])) {
						// TODO URGENT: Create type
						const key_control_violations = { 'key_control_violations': (verification_of_key_control_violations as PossibleAndConfirmedKeyControlViolationResults)['controls'] };
						const trace: IProcessElementTraceModel = await CreateProcessElementTraceEntry({ 'identifier': trace_identifier, 'instance': execution_instance_entry.get('instance'), 'process': execution_instance_entry.get('process'), 'version': execution_instance_entry.get('version'), 'type': 'validation_failed', 'element': parameters['task'], 'data': parameters['data'], 'options': parameters['options'], 'validation': Object.assign({ 'integrity': `${verification_of_key_control_violations['violation']}_key_control_violation`, 'deviation': false }, key_control_violations, { ...(!empty(parameters['conditions']) && { 'conditions': parameters['conditions'] }) }) }, session);
						await execution_instance_entry.update({ $push: { 'traces.updates': trace.get('identifier') } }, { upsert: true, new: true, session });

						Object.assign(results, { 'success': false, 'instance': execution_instance_entry.toJSON(), 'trace': trace.get('identifier'), 'errors': ['violation_of_integrity', `${verification_of_key_control_violations['violation']}_key_control_violation`, ...(at_least_one_condition_is_invalid ? ['verification_of_conditions_failed'] : [])], 'validation': Object.assign({ 'integrity': 'key_control_violation', 'deviation': false }, key_control_violations, { ...(!empty(parameters['conditions']) && { 'conditions': parameters['conditions'] }) }) });
						ExecuteTaskActions(['violation', ...(at_least_one_condition_is_invalid ? ['failure'] : [])], execution_instance_entry.get('instance'), parameters['task'], parameters['data'], parameters['options']);
					} else {
						const trace: IProcessElementTraceModel = await CreateProcessElementTraceEntry({ 'identifier': trace_identifier, 'instance': execution_instance_entry.get('instance'), 'process': execution_instance_entry.get('process'), 'version': execution_instance_entry.get('version'), 'type': 'validation_failed', 'element': parameters['task'], 'data': parameters['data'], 'options': parameters['options'], 'validation': { 'integrity': 'violation_of_integrity', 'deviation': false, ...(!empty(parameters['conditions']) && { 'conditions': parameters['conditions'] }) } }, session);
						await execution_instance_entry.update({ $push: { 'traces.updates': trace.get('identifier') } }, { upsert: true, new: true, session });

						// TODO URGENT: Add verifications of conditions if needed
						Object.assign(results, { 'success': false, 'instance': execution_instance_entry.toJSON(), 'trace': trace.get('identifier'), 'errors': ['violation_of_integrity', ...(at_least_one_condition_is_invalid ? ['verification_of_conditions_failed'] : [])], 'validation': { 'integrity': 'violation_of_integrity', 'deviation': false, ...(!empty(parameters['conditions']) && { 'conditions': parameters['conditions'] }) } });
						ExecuteTaskActions(['violation', ...(at_least_one_condition_is_invalid ? ['failure'] : [])], execution_instance_entry.get('instance'), parameters['task'], parameters['data'], parameters['options']);
					}
				}
			}
		} else {
			// TODO: Handle error
			Object.assign(results, { 'success': false, 'instance': execution_instance_entry.toJSON(), 'errors': ['instance_not_running'] });
		}
	};

	if (session) {
		await operations(parameters, session);
	} else {
		await connection.transaction(async function executor(session: ClientSession): Promise<void> {
			await operations(parameters, session);
		}).catch((error) => { /* TODO: Log error */ throw error });
	}

	return results;
}

// TODO URGENT: Set created type as return (verifications should not be added if empty condition verification results, while it is done in some parts of the function)
export async function TerminateExecutionInstanceEntry(parameters: { instance: Identifier, end: Identifier, data?: Object }, session?: ClientSession): Promise<{ 'success': boolean, 'instance'?: LeanDocument<IExecutionInstanceModel>, 'trace'?: Identifier, 'errors'?: string[], 'validation'?: { [key: string]: any } }> {
	// TODO URGENT: Create appropriate type
	const results: { 'success': boolean, 'instance'?: LeanDocument<IExecutionInstanceModel>, 'trace'?: Identifier, 'errors'?: string[], 'validation'?: { [key: string]: any } } = { 'success': false };

	let execution_instance_entry: IExecutionInstanceModel;

	const operations = async (parameters: { instance: Identifier, end: Identifier, data?: Object }, session: ClientSession): Promise<void> => {
		execution_instance_entry = await GetExecutionInstanceEntry(parameters['instance'], session);

		if (execution_instance_entry.get('state') === 'running') {
			const process_version_entry: IProcessVersionModel = await GetProcessVersionEntry(execution_instance_entry.get('process'), execution_instance_entry.get('version'), session);

			const trace_identifier: Identifier = uuidv4();
			const deviation_traces: LeanDocument<IExecutionInstanceTraceModel>[] = await FetchExecutionInstanceTraces({ 'filters': { process: execution_instance_entry.get('process'), version: execution_instance_entry.get('version'), instance: execution_instance_entry.get('instance'), type: 'deviation' } }, session);
			const instance_was_deviated: boolean = !!execution_instance_entry.get('deviation') || (deviation_traces.length > 0);

			const process_version_model: RegisteredData = await RetrieveData(process_version_entry.get('resources.file'));
			const tree_of_instances: TreeOfProcessInstances = ConvertTreeOfObjects(process_version_model['data']['tree']);
			const event: ProcessEventClass = tree_of_instances['elements'][parameters['end']] as ProcessEventClass;

			let instance_should_be_terminated: boolean = instance_was_deviated;

			if (!instance_was_deviated) {
				const process_was_terminated = ExploreAndTestExecutionForTermination(event, execution_instance_entry.get('execution'), tree_of_instances, trace_identifier);

				if (process_was_terminated) execution_instance_entry.markModified('execution');
				instance_should_be_terminated = process_was_terminated;
			}

			if (instance_should_be_terminated) {
				execution_instance_entry.set('state', 'finished');
				execution_instance_entry.set('stop', Date.now());
				await execution_instance_entry.save({ session });

				const event_trace: IProcessElementTraceModel = await CreateProcessElementTraceEntry({ 'identifier': trace_identifier, 'instance': execution_instance_entry.get('instance'), 'process': execution_instance_entry.get('process'), 'version': execution_instance_entry.get('version'), 'type': 'instance_terminated', 'element': parameters['end'], 'data': parameters['data'], 'validation': { 'integrity': 'ok', 'deviation': false } }, session);
				await execution_instance_entry.update({ $push: { 'traces.updates': event_trace.get('identifier') } }, { upsert: true, new: true, session });

				const termination_trace: IExecutionInstanceTraceModel = await CreateExecutionInstanceTraceEntry({ 'identifier': uuidv4(), 'process': execution_instance_entry.get('process'), 'version': execution_instance_entry.get('version'), 'instance': execution_instance_entry.get('instance'), 'type': 'termination', 'data': parameters['data'] }, session);

				execution_instance_entry.set('traces.stop', termination_trace.get('identifier'));
				execution_instance_entry.markModified('traces.stop');
				await execution_instance_entry.save({ session });

				Object.assign(results, { 'success': true, 'instance': execution_instance_entry.toJSON(), 'trace': event_trace.get('identifier'), 'validation': { 'integrity': 'ok', 'deviation': instance_was_deviated } });
			} else {
				const verification_of_key_control_violations: KeyControlViolationResults = VerifyKeyControlViolations(event, execution_instance_entry.get('execution'), tree_of_instances);
				if (PossibleOrConfirmedKeyControlViolationValues.includes(verification_of_key_control_violations['violation'])) {
					// TODO URGENT: Create type
					const key_control_violations = { 'key_control_violations': (verification_of_key_control_violations as PossibleAndConfirmedKeyControlViolationResults)['controls'] };
					const trace: IProcessElementTraceModel = await CreateProcessElementTraceEntry({ 'identifier': trace_identifier, 'instance': execution_instance_entry.get('instance'), 'process': execution_instance_entry.get('process'), 'version': execution_instance_entry.get('version'), 'type': 'validation_failed', 'element': parameters['end'], 'data': parameters['data'], 'validation': Object.assign({ 'integrity': 'key_control_violation', 'deviation': false }, key_control_violations) }, session);
					await execution_instance_entry.update({ $push: { 'traces.updates': trace.get('identifier') } }, { upsert: true, new: true, session });

					Object.assign(results, { 'success': false, 'instance': execution_instance_entry.toJSON(), 'trace': trace.get('identifier'), 'errors': ['violation_of_integrity', `${verification_of_key_control_violations['violation']}_key_control_violation`], 'validation': Object.assign({ 'integrity': `${verification_of_key_control_violations['violation']}_key_control_violation`, 'deviation': false }, key_control_violations) });
				} else {
					const trace: IProcessElementTraceModel = await CreateProcessElementTraceEntry({ 'identifier': trace_identifier, 'instance': execution_instance_entry.get('instance'), 'process': execution_instance_entry.get('process'), 'version': execution_instance_entry.get('version'), 'type': 'validation_failed', 'element': parameters['end'], 'data': parameters['data'], 'validation': { 'integrity': 'violation_of_integrity', 'deviation': false } }, session);
					await execution_instance_entry.update({ $push: { 'traces.updates': trace.get('identifier') } }, { upsert: true, new: true, session });

					// TODO URGENT: Add verifications of conditions if needed
					Object.assign(results, { 'success': false, 'instance': execution_instance_entry.toJSON(), 'trace': trace.get('identifier'), 'errors': ['violation_of_integrity'], 'validation': { 'integrity': 'violation_of_integrity', 'deviation': false } });
				}
			}
		} else {
			// TODO: Handle error
			Object.assign(results, { 'success': false, 'instance': execution_instance_entry.toJSON(), 'errors': ['instance_not_running'] });
		}
	};

	if (session) {
		await operations(parameters, session);
	} else {
		await connection.transaction(async function executor(session: ClientSession): Promise<void> {
			await operations(parameters, session);
		}).catch((error) => { /* TODO: Log error */ throw error });
	}

	return results;
}

// TODO URGENT: Set created type as return
export async function CancelExecutionInstanceEntry(parameters: { instance: Identifier, data?: Object }, session?: ClientSession): Promise<{ 'success': boolean, 'instance'?: LeanDocument<IExecutionInstanceModel>, 'errors'?: string[], 'validation'?: { [key: string]: any } }> {
	// TODO URGENT: Create appropriate type
	const results: { 'success': boolean, 'instance'?: LeanDocument<IExecutionInstanceModel>, 'errors'?: string[], 'validation'?: { [key: string]: any } } = { 'success': false };

	let execution_instance_entry: IExecutionInstanceModel;

	const operations = async (parameters: { instance: Identifier, data?: Object }, session: ClientSession): Promise<void> => {
		execution_instance_entry = await GetExecutionInstanceEntry(parameters['instance'], session);
		if (['inactive', 'running'].includes(execution_instance_entry.get('state'))) {
			const process_version_entry: IProcessVersionModel = await GetProcessVersionEntry(execution_instance_entry.get('process'), execution_instance_entry.get('version'), session);
			const process_version_model: RegisteredData = await RetrieveData(process_version_entry.get('resources.file'));
			const tree_of_instances: TreeOfProcessInstances = ConvertTreeOfObjects(process_version_model['data']['tree']);

			CancelExecution(execution_instance_entry.get('execution'), tree_of_instances);
			execution_instance_entry.markModified('execution');

			execution_instance_entry.set('state', 'cancelled');
			execution_instance_entry.set('stop', Date.now());
			await execution_instance_entry.save({ session });

			const trace: IExecutionInstanceTraceModel = await CreateExecutionInstanceTraceEntry({ 'process': execution_instance_entry.get('process'), 'version': execution_instance_entry.get('version'), 'instance': execution_instance_entry.get('instance'), 'type': 'cancelation', 'data': parameters['data'] }, session);

			execution_instance_entry.set('traces.stop', trace.get('identifier'));
			execution_instance_entry.markModified('traces.stop');
			await execution_instance_entry.save({ session });

			// TODO URGENT: Send a notification
			Object.assign(results, { 'success': true, 'instance': execution_instance_entry.toJSON() });
		} else {
			// TODO: Handle error
			Object.assign(results, { 'success': false, 'instance': execution_instance_entry.toJSON(), 'errors': ['instance_already_terminated_or_cancelled'] });
		}
	};

	if (session) {
		await operations(parameters, session);
	} else {
		await connection.transaction(async function executor(session: ClientSession): Promise<void> {
			await operations(parameters, session);
		}).catch((error) => { /* TODO: Log error */ throw error });
	}

	return results;
}

export async function VerifyExecutionInstanceSignature(execution_instance: IExecutionInstanceModel): Promise<boolean> {
	// TODO: Handle better the retrieval of data
	const process_version_entry: IProcessVersionModel = await GetProcessVersionEntry(execution_instance.get('process'), execution_instance.get('version'));
	const execution_instance_options: Nullable<RegisteredData> = execution_instance.get('resources.options') ? await RetrieveData(execution_instance.get('resources.options')) : null;
	return VerifySignature(execution_instance.get('signature'), config.get('crypto.signing.keys.track_and_trace')) === ComputeSHA256(`${execution_instance.get('process')}_${execution_instance.get('version')}_${execution_instance.get('instance')}_${execution_instance.get('creation')}_${process_version_entry.get('signature')}${execution_instance_options ? '_' + ComputeSHA256(JSON.stringify(Sort(execution_instance_options['data']['options']))) : ''}`);
}

export async function CountExecutionInstances(filters?: FilterQuery<IExecutionInstanceModel & Document>, session?: ClientSession): Promise<number> {
	return await ExecutionInstance.countDocuments(filters ?? {}).session(session ?? null);
}

export async function FetchExecutionInstances(parameters: any, session?: ClientSession): Promise<(IExecutionInstanceSchema & { '_id'?: string })[]> {
	let query: Query<(IExecutionInstanceModel & Document)[], IExecutionInstanceModel & Document, {}> = ExecutionInstance.find(parameters['filters']).skip(parameters['page'] * parameters['size']).limit(parameters['size']).select('-execution').session(session ?? null);

	if (parameters['sort_field']) {
		query = query.sort({ [parameters['sort_field']]: parameters['sort_direction'] });
	}

	return await query.lean().exec();
}