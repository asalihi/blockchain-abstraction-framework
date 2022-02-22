import { AxiosResponse } from 'axios';
import { isEmpty as empty, pick, flatten, isObject, merge } from 'lodash';
import { getTestMessageUrl, SendMailOptions, SentMessageInfo } from 'nodemailer';

import { ExecuteHTTPRequest, RetrieveData, Identifier, ExecutionInstanceOptions, Nullable, ProcessTaskOptions, ProcessTaskActions, ProcessTaskDefinition, SendEmailAction, SendHTTPRequestAction } from 'core';
import { GetExecutionInstanceEntry, GetProcessEntry, GetProcessVersionEntry, IExecutionInstanceModel, IProcessModel, IProcessVersionModel } from '@service/database/schemata';
import { GetResources } from '@service/controllers/controller';
import { TRANSPORTER } from '@service/controllers/nodemailer';
import { FormatValueUsingExternalReference } from '@service/helpers/functions';

// Constrain type for context
export async function ExecuteTaskActions(context: string[], instance: Identifier, task: Identifier, data: { [key: string]: any } = {}, options: ProcessTaskOptions = {}): Promise<void> {
    const execution_instance_entry: IExecutionInstanceModel = await GetExecutionInstanceEntry(instance);

    const execution_instance_options: Nullable<ExecutionInstanceOptions> = execution_instance_entry.get('resources.options') ? (await RetrieveData(execution_instance_entry.get('resources.options')))['data']['options'] as ExecutionInstanceOptions : null;
    const task_actions_to_execute_from_execution_instance: Partial<ProcessTaskActions> = pick(execution_instance_options?.['tasks']?.find((definition: ProcessTaskDefinition) => definition['identifier'] === task)?.['actions'] ?? {}, ['execution', ...context]);
    const task_actions_to_execute_from_task_options: Partial<ProcessTaskActions> = pick(options?.['actions'] ?? {}, ['execution', ...context]);
    const all_actions_to_execute: Partial<ProcessTaskActions> = merge(task_actions_to_execute_from_execution_instance, task_actions_to_execute_from_task_options);
    if (!empty(all_actions_to_execute)) {
        const process_entry: IProcessModel = await GetProcessEntry(execution_instance_entry.get('process'));
        const process_version_entry: IProcessVersionModel = await GetProcessVersionEntry(execution_instance_entry.get('process'), execution_instance_entry.get('version'));
        const execution_instance_data: { [key: string]: any } = await GetResources(execution_instance_entry.toJSON(), 'resources.data');
        const process_data: { [key: string]: any } = await GetResources(process_entry.toJSON(), 'resources.data.creation');
        const process_version_data: { [key: string]: any } = await GetResources(process_version_entry.toJSON(), 'resources.data.creation');

        const all_data: Record<'process' | 'version' | 'instance' | 'task', { [key: string]: any }> = { 'process': process_data, 'version': process_version_data, 'instance': Object.values(execution_instance_data).reduce((data, ctx) => merge(data, ctx), {}), 'task': data };

        // Support context
        for (const action of flatten(Object.values(all_actions_to_execute))) {
            switch (action['type']) {
                case 'email': {
                    ExecuteSendEmailAction(action as SendEmailAction, all_data);
                    continue;
                }
                case 'api': {
                    ExecuteSendHTTPRequest(action as SendHTTPRequestAction, all_data);
                    continue;
                }
            }
        }
    }
}

// TODO URGENT: Refactor handling of referencesre
async function ExecuteSendEmailAction(action: SendEmailAction, data: Record<'process' | 'version' | 'instance' | 'task', { [key: string]: any }>): Promise<void> {
    console.log(`[ACTION:EMAIL] Handling action: ${action['identifier']}`);

    action['subject'] = FormatValueUsingExternalReference(action['subject'], data);
    action['content'] = FormatValueUsingExternalReference(action['content'], data);
    for(const receiver of action['receivers'].keys()) {
        action['receivers'][receiver] = FormatValueUsingExternalReference(action['receivers'][receiver], data);
    }

    for (const receiver of action['receivers']) {
        try {
            console.log(`[ACTION:EMAIL] Sending email to: ${receiver}`);
            const message: SendMailOptions = {
                from: 'Track and Trace <track-and-trace@company.com>',
                to: receiver,
                subject: action['subject'],
                html: action['content']
            };

            const response: SentMessageInfo = await TRANSPORTER.sendMail(message);
            console.log(`Mail sent: ${response.messageId}`);
            console.log(`URL: ${getTestMessageUrl(response)}`);
        } catch (error) {
            console.error(`[ACTION:EMAIL] Could not send an email to: ${receiver}.`);
            console.error(error);
        }
    }
}

// TODO URGENT: Refactor handling of templates
async function ExecuteSendHTTPRequest(action: SendHTTPRequestAction, data: Record<'process' | 'version' | 'instance' | 'task', { [key: string]: any }>): Promise<void> {
    try {
        console.log(`[ACTION:HTTP] Handling action: ${action['identifier']}`);

        action['endpoint'] = FormatValueUsingExternalReference(action['endpoint'], data);

        if (action['parameters']) {
            for (const parameter_key of Object.keys(action['parameters'])) {
                action['parameters'][parameter_key] = FormatValueUsingExternalReference(action['parameters'][parameter_key], data);
            }
        }

        console.log(`[ACTION:HTTP] Sending request...`);
        const response: AxiosResponse = await ExecuteHTTPRequest(action['endpoint'], action['method'], { headers: action['headers'], parameters: action['parameters'] });
        console.log(`[ACTION:HTTP] Response received`);
        if (response.data) console.log(isObject(response.data) ? JSON.stringify(response.data) : response.data);
    } catch(error) {
        console.error(`[ACTION:HTTP] An error occurred while sending HTTP request`);
        console.error(error);
    }
}