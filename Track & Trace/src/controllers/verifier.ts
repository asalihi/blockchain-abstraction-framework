import { AxiosResponse } from 'axios';
import config from 'config';
import { isEmpty as empty, groupBy as group, map, mergeWith, merge, Dictionary } from 'lodash';

import { Nullable, DistributivePick, DistributivePickValues, ExecuteHTTPRequest, Identifier, ProcessVersionOptions, ExecutionInstanceOptions, ProcessTaskDefinition, ProcessTaskPartialConditions, ExecutionCondition, ListOfExecutionConditionDefinitions, ListOfExecutionConditions, ListOfVerifiedExecutionConditions, SUPPORTED_CRYPTOGRAPHY_CONDITIONS, SUPPORTED_DATETIME_CONDITIONS, SUPPORTED_NUMBER_CONDITIONS, SUPPORTED_STRING_CONDITIONS, VerifyCryptographyCondition, VerifyDatetimeCondition, VerifyNumberCondition, VerifyStringCondition, CryptographyCondition, DatetimeCondition, NumberCondition, StringCondition, RetrieveData, PartialExecutionCondition } from "core";
import { IProcessModel, GetProcessEntry, IProcessVersionModel, GetProcessVersionEntry, IExecutionInstanceModel, GetExecutionInstanceEntry } from "@service/database/schemata";
import { GetResources } from '@service/controllers/controller';
import { FormatValueUsingExternalReference } from '@service/helpers/functions';

export async function RetrieveConditions(instance: Identifier, task: Identifier, task_conditions_from_task_options: ProcessTaskPartialConditions = []): Promise<ListOfExecutionConditionDefinitions> {
    const execution_instance_entry: IExecutionInstanceModel = await GetExecutionInstanceEntry(instance);
    const execution_instance_options: Nullable<ExecutionInstanceOptions> = execution_instance_entry.get('resources.options') ? (await RetrieveData(execution_instance_entry.get('resources.options')))['data']['options'] as ExecutionInstanceOptions : null;
    const task_conditions_from_execution_instance: ProcessTaskPartialConditions = execution_instance_options?.['tasks']?.find((definition: ProcessTaskDefinition) => definition['identifier'] === task)?.['conditions'] ?? [];

    const process_version_entry: IProcessVersionModel = await GetProcessVersionEntry(execution_instance_entry.get('process'), execution_instance_entry.get('version'));
    const process_version_options: Nullable<ProcessVersionOptions> = process_version_entry.get('resources.options') ? (await RetrieveData(process_version_entry.get('resources.options')))['data']['options'] as ProcessVersionOptions : null;
    const task_conditions_from_process_version: ProcessTaskPartialConditions = process_version_options?.['tasks']?.find((definition: ProcessTaskDefinition) => definition['identifier'] === task)?.['conditions'] ?? [];

    const dictionary_of_conditions: Dictionary<PartialExecutionCondition[]> = group<PartialExecutionCondition>([...task_conditions_from_process_version, ...task_conditions_from_execution_instance, ...task_conditions_from_task_options], 'identifier');
    return map(dictionary_of_conditions, (group: PartialExecutionCondition[]) => mergeWith({}, ...group, (destination: any, source: any) => { if (Array.isArray(destination)) return destination.concat(source) }));
}

export async function RetrieveAllData(instance: Identifier, task_data: { [key: string]: any } = {}): Promise<Record<'process' | 'version' | 'instance' | 'task', { [key: string]: any }>> {
    const execution_instance_entry: IExecutionInstanceModel = await GetExecutionInstanceEntry(instance);
    const process_entry: IProcessModel = await GetProcessEntry(execution_instance_entry.get('process'));
    const process_version_entry: IProcessVersionModel = await GetProcessVersionEntry(execution_instance_entry.get('process'), execution_instance_entry.get('version'));
    const execution_instance_data: { [key: string]: any } = await GetResources(execution_instance_entry.toJSON(), 'resources.data');
    const process_data: { [key: string]: any } = await GetResources(process_entry.toJSON(), 'resources.data.creation');
    const process_version_data: { [key: string]: any } = await GetResources(process_version_entry.toJSON(), 'resources.data.creation');

    return { 'process': process_data, 'version': process_version_data, 'instance': Object.values(execution_instance_data).reduce((data, ctx) => merge(data, ctx), {}), 'task': task_data };
}

export async function FormatConditions(instance: Identifier, list_of_execution_condition_definitions: ListOfExecutionConditionDefinitions, all_data: Record<'process' | 'version' | 'instance' | 'task', { [key: string]: any }>): Promise<ListOfExecutionConditions> {
    const execution_instance_entry: IExecutionInstanceModel = await GetExecutionInstanceEntry(instance);
    const process_version_entry: IProcessVersionModel = await GetProcessVersionEntry(execution_instance_entry.get('process'), execution_instance_entry.get('version'));

    const list_of_execution_conditions: ListOfExecutionConditions = [];
    for (const condition of list_of_execution_condition_definitions) {
        const properties: any = {};
        for (const property of Object.keys(condition['properties']) as (keyof typeof condition['properties'])[]) {
            const definition: any = condition['properties'][property];
            if(!definition['type']) {
                properties[property] = definition;
                continue;
            }

            if (definition['type'] === 'request') {
                definition['request']['endpoint'] = FormatValueUsingExternalReference(definition['request']['endpoint'], all_data);
                if(definition['request']['parameters']) {
                    for(const parameter_key of Object.keys(definition['request']['parameters'])) {
                        definition['request']['parameters'][parameter_key] = FormatValueUsingExternalReference(definition['request']['parameters'][parameter_key], all_data);
                    }
                }
                // TODO: Handle options if any (e.g. sign request, setup retry logic, encrypt request parameters after having sent the request, etc.)
                const response: AxiosResponse = await ExecuteHTTPRequest(definition['request']['endpoint'], definition['request']['method'], { 'headers': definition['request']['headers'] ?? {}, 'parameters': definition['request']['parameters'] ?? {} });
                // TODO: Handle the retrieval of the value (by default, we look for the property 'response' in the data, considered as JSON)
                properties[property as keyof typeof condition['properties']] = Object.assign(definition, { 'value': response.data['response'] });
            } else if (definition['type'] === 'template') {
                switch (definition['template']) {
                    case 'DATE_CREATION_PROCESS': {
                        properties[property] = Object.assign(definition, { 'value': process_version_entry.get('creation') });
                        break;
                    };
                    case 'DATE_CREATION_INSTANCE': {
                        properties[property] = Object.assign(definition, { 'value': execution_instance_entry.get('creation') });
                        break;
                    };
                    case 'DATE_EXECUTION_INSTANCE': {
                        properties[property] = Object.assign(definition, { 'value': execution_instance_entry.get('start') });
                        break;
                    };
                    case 'CURRENT_DATE': {
                        properties[property] = Object.assign(definition, { 'value': Date.now() });
                        break;
                    };
                    case 'PLATFORM_IDENTIFIER': {
                        properties[property] = Object.assign(definition, { 'value': config.get('platform') });
                        break;
                    };
                    case 'CALLER_IDENTIFIER': {
                        throw new Error('Template of property is not supported yet'); // TODO URGENT: Handle case
                    };
                    case 'CALLER_RANK': {
                        throw new Error('Template of property is not supported yet'); // TODO URGENT: Handle case
                    };
                    case 'SIGNING_KEY_OF_CALLER': {
                        throw new Error('Template of property is not supported yet'); // TODO URGENT: Handle case
                    };
                    case 'SIGNING_KEY_OF_PLATFORM': {
                        throw new Error('Template of property is not supported yet'); // TODO URGENT: Handle case
                    };
                    case 'ACTIVE_SIGNING_KEY_OF_PLATFORM': {
                        throw new Error('Template of property is not supported yet'); // TODO URGENT: Handle case
                    }
                    default: {
                        throw new Error('Invalid template'); // TODO URGENT: Handle case
                    }
                }
            } else if (definition['type'] === 'value') {
                const formatted_value: string = FormatValueUsingExternalReference(definition['value'], all_data);
                properties[property] = Object.assign(definition, { 'value': formatted_value });
            } else {
                throw new Error('Invalid type of value'); // TODO: Handle error
            }
        }
        list_of_execution_conditions.push({ 'identifier': condition['identifier'], 'condition': condition['condition'], 'properties': properties } as ExecutionCondition);
    }

    return list_of_execution_conditions;
}

// TODO URGENT: Use promises for parent function and all verifiers
export function VerifyConditions(conditions: ListOfExecutionConditions): ListOfVerifiedExecutionConditions {
    const list_of_verified_execution_conditions: ListOfVerifiedExecutionConditions = [];

    for (const condition of conditions) {
        if (SUPPORTED_CRYPTOGRAPHY_CONDITIONS.includes(condition['condition'])) {
            list_of_verified_execution_conditions.push(VerifyCryptographyCondition(condition as CryptographyCondition));
        } else if (SUPPORTED_DATETIME_CONDITIONS.includes(condition['condition'])) {
            list_of_verified_execution_conditions.push(VerifyDatetimeCondition(condition as DatetimeCondition));
        } else if (SUPPORTED_NUMBER_CONDITIONS.includes(condition['condition'])) {
            list_of_verified_execution_conditions.push(VerifyNumberCondition(condition as NumberCondition));
        } else if (SUPPORTED_STRING_CONDITIONS.includes(condition['condition'])) {
            list_of_verified_execution_conditions.push(VerifyStringCondition(condition as StringCondition));
        } else {
            // TODO: Log error
            list_of_verified_execution_conditions.push(Object.assign(condition, { 'validation': false, 'error': 'UNSUPPORTED_EXECUTION_CONDITION' }));
        }
    }

    return list_of_verified_execution_conditions;
}

export async function ValidateConditions(instance: Identifier, task: Identifier, task_data: { [key: string]: any } = {}, task_conditions_from_task_options: ProcessTaskPartialConditions = []): Promise<ListOfVerifiedExecutionConditions> {
    const definitions: ListOfExecutionConditionDefinitions = await RetrieveConditions(instance, task, task_conditions_from_task_options);
    if (empty(definitions)) {
        return [];
    } else {
        const data: Record<'process' | 'version' | 'instance' | 'task', { [key: string]: any }> = await RetrieveAllData(instance, task_data);
        const list_of_conditions: ListOfExecutionConditions = await FormatConditions(instance, definitions, data);
        return VerifyConditions(list_of_conditions);
    }
}