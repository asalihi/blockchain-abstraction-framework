import config from 'config';
import { platform } from 'os';
import { Channel } from 'amqplib';
import { AxiosResponse } from 'axios';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import { add, compareAsc as compare, format } from 'date-fns';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { omitBy as omit_by, isNil as is_nil } from 'lodash';
import { basename, dirname, join } from 'path';
import { fileSync as generate_temp_file, FileResult } from 'tmp';
import { v4 as uuidv4 } from 'uuid';
import yn from 'yn';
import { ShellString, exec, exit } from 'shelljs';
import { dump } from 'js-yaml';

import { PROXY } from '@core/server/proxy';
import { GATEWAY } from '@core/server/server';
import { ConversionError, DirectoryCreationError, HTTPRequestError, ReadFileError, WriteFileError, ShellInstructionExecutionError, ShellCommandExecutionError, ShellScriptExecutionError, DateManipulationError, GenericError, ServerError } from '@core/errors/errors';
import { CreateChannel, SendMessage } from '@core/rabbitmq/rabbitmq';
import { RecursivePartial, ExecutionOptions, HTTPEndpoint, HTTPHeaders, HTTPMethod, HTTPParameters, Notification, NotificationAudience, NotificationIssuer, NotificationOptions, Message, Nullable, ShellScript, ShellInstructionParameters, ShellExecutionResults, ShellCommand } from '@core/types/types';
import { TIMEOUT_BEFORE_FORCED_SHUTDOWN, SCRIPT_EXECUTED_AS_ROOT, BASH_COMMAND_AS_LOGGED_USER, DEFAULT_EXECUTION_OPTIONS } from '@core/constants/constants';

const SHUTDOWN_LISTENERS: { operation: string, listener: () => any | Promise<any> }[] = [];

export function RegisterProcessShutdownListener(operation: string, listener: () => any | Promise<any>): () => any | Promise<any> {
    SHUTDOWN_LISTENERS.push({ operation, listener });
    return listener;
}

export async function Shutdown(): Promise<void> {
    console.clear();
    console.log('[CORE] Module is exiting gracefully...');

    for(const entry of SHUTDOWN_LISTENERS) {
        try {
            console.log(`[CORE] Executing operation: ${entry['operation']}`);
            await entry['listener']();
            console.log(`[CORE] Operation executed successfully: ${entry['operation']}`);
        } catch (error) {
            console.warn(`[CORE] Operation '${entry['operation']}' failed before completing: ${error}`);
        }
    }

    console.log('[CORE] All operations handled correctly. Exiting.');
    process.nextTick(() => process.exit(0));
}

export const FORCE_EXIT_FUNCTION = (timeout: number = TIMEOUT_BEFORE_FORCED_SHUTDOWN) => () => {
    setTimeout((): never => {
        console.warn(`[CORE] Module could not be stopped gracefully after ${timeout}ms: forcing shutdown`);
        return process.exit(1);
    }, timeout).unref();
};

export function GenerateYAMLFileContent(content: any): string {
	return dump(content, { 'styles': { '!!null': 'canonical' }, 'lineWidth': -1 }).replace(/ ~/g, '').replace(/'''/g, '').replace(/''/g, '\'');
}

export function GenerateYAMLFile(file: { location: string, name: string }, content: any): void {
	WriteFile(file, GenerateYAMLFileContent(content));
}

export function GenerateDockerComposeFile(file: { location: string, name: string }, content: any): void {
	WriteFile(file, GenerateYAMLFileContent(content).replace(/'/g, '').replace(/ ~/g, '').replace(/(version: )(.+)/, "$1\'$2\'"));
}

export function VerifyPlatform(): void {
    if (platform() !== 'linux') {
        console.error('[CORE] This module can be executed on linux only. Exiting.');
        exit(1);
    }
}

export function VerifyIfElevatedPrivileges(): boolean {
    return SCRIPT_EXECUTED_AS_ROOT;
}

export async function Sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export function ExecuteCommand(command: string, options: RecursivePartial<ExecutionOptions> = DEFAULT_EXECUTION_OPTIONS): ShellString {
    options = Object.assign({}, DEFAULT_EXECUTION_OPTIONS, options);

    const result: ShellString = exec(command, { silent: options['silent'] });

    if (result.code !== 0) {
        console.log(result.stderr);

        if (options['critical']) {
            throw new Error(`An error occurred while executing command: ${command}`);
        }
        else return result;
    } else {
        if (options['silent'] === false) console.log(result.stdout);
        return result;
    }
}

export function ReadFile(location: string): Buffer {
    try {
        return readFileSync(location);
    } catch {
        throw new ReadFileError(location);
    }
}

export function WriteFile(file: { location: string, name: string }, data: any, as_logged_user: boolean = VerifyIfElevatedPrivileges()): void {
    if (!existsSync(file['location'])) {
        try {
            ExecuteCommand(`${as_logged_user ? BASH_COMMAND_AS_LOGGED_USER : 'bash'} -c 'mkdir -p ${file['location']}'`);
        } catch {
            throw new DirectoryCreationError(file['location']);
        }
    }

    const full_path: string = join(file['location'], file['name']);
    try {
        writeFileSync(full_path, data);
        if (as_logged_user) ExecuteCommand(`bash -c 'chown $SUDO_USER:$SUDO_USER ${full_path}'`);
    } catch {
        throw new WriteFileError(full_path);
    }
}

export async function SendNotification(audience: NotificationAudience, message: Message, options?: Partial<NotificationOptions>): Promise<boolean> {
    const issuer: NotificationIssuer = { 'platform': config.get('platform'), 'route': 'service' };  // TODO: Define route using variable
    let notification: Partial<Notification> = { 'identifier': uuidv4(), 'timestamp': Date.now(), 'issuer': issuer, 'audience': audience, 'message': message };

    // TODO: Use env variable for default signature strategy
    options = Object.assign({}, { 'signature': yn(config.get('core.notifications.signature'), { default: true }) }, options);

    if (options?.['signature']) {
        // TODO URGENT: Sign notification
    }

    const channel: Channel = await CreateChannel();
    const sent: boolean = await SendMessage(channel, config.get('queue.exchange'), notification as Notification);

    channel.close();
    return sent;
}

export async function ExecuteHTTPRequest(endpoint: HTTPEndpoint, method: HTTPMethod, options?: { headers?: HTTPHeaders, parameters?: HTTPParameters }): Promise<AxiosResponse> {
    return await PROXY.request({ method: method, url: endpoint, ...(options?.['headers'] && { headers: options['headers'] }), ...(options?.['parameters'] && { data: options['parameters'] }) }).catch((error) => {
        if (error.response) return error.response;
        else throw new HTTPRequestError(endpoint, method, error);
    });
}

export async function SendHTTPRequestToGatewayAPI(endpoint: HTTPEndpoint, method: HTTPMethod, options?: { headers?: HTTPHeaders, parameters?: HTTPParameters }): Promise<AxiosResponse> {
    return SendHTTPRequestToGateway(config.get('gateway.api') + endpoint, method, options);
}

export async function SendHTTPRequestToGateway(endpoint: HTTPEndpoint, method: HTTPMethod, options?: { headers?: HTTPHeaders, parameters?: HTTPParameters }): Promise<AxiosResponse> {
    return await GATEWAY.request({ method: method, url: endpoint, ...(options?.['headers'] && { headers: options['headers'] }), ...(options?.['parameters'] && { data: options['parameters'] }) }).catch((error) => {
        console.error('[CORE] An error occurred while sending request to gateway');
        if(error.response) console.error(`[CORE] ${ JSON.stringify(error.response) }`);
        else if(error.request) console.error(`[CORE] ${ JSON.stringify(error.request) }`);
        else  {console.error(`[CORE] Error:`); console.error(error); }
        throw new HTTPRequestError(endpoint, method, error);
    });
}

export async function ExecuteShellCommand(command: ShellCommand, parameters?: ShellInstructionParameters, strict: boolean = true): Promise<ShellExecutionResults> {
    return await ExecuteShellInstruction(command, parameters, strict);
}

export async function ExecuteShellScript(script: ShellScript, parameters?: ShellInstructionParameters, strict: boolean = true): Promise<ShellExecutionResults> {
    const file: FileResult = generate_temp_file({ postfix: '.sh' });
    try {
        WriteFile({ 'location': dirname(file['name']), 'name': basename(file['name']) }, script);
        await SetExecutionPermission(file['name']);
        return await ExecuteShellInstruction('/bin/bash', (parameters) ? [file['name'], ...parameters] : [file['name']], strict);
    } catch (error) {
        throw error;
    } finally {
        file.removeCallback();
    }
}

async function SetExecutionPermission(file: string): Promise<void> {
    await ExecuteShellInstruction(`[[ -x ${file} ]] || ([[ -e ${file} ]] && chmod +x ${file}) || exit 3`);
}

async function ExecuteShellInstruction(instruction: ShellCommand, parameters: string[] = [], strict: boolean = true): Promise<ShellExecutionResults> {
    const process: ChildProcessWithoutNullStreams = spawn(instruction, parameters, { shell: (platform() === 'win32') ? true : '/bin/bash' });

    new Promise((_, reject) => process.on('error', (error: Error) => reject(error))).catch((error: Error) => { throw new ShellInstructionExecutionError(instruction, -1) });

    const output: string[] = [];
    for await (const data of process.stdout) output.push(data.toString().trim());

    const errors: string[] = [];
    for await (const error of process.stderr) errors.push(error.toString().trim());

    try {
        const code: number = await new Promise((resolve, reject) => process.on('exit', (code: number) => resolve(code)));
        if ((code !== 0) && strict) throw new ShellInstructionExecutionError(instruction, code);
        else return { code, output, errors };
    } catch {
        if (strict) throw new ShellInstructionExecutionError(instruction, -1);
        else return { code: -1, output: [], errors: [] };
    }
}

export function ConvertDate(date: Date | number, pattern: string = 'ddMMyyy'): string {
    try {
        return format(date, pattern);
    } catch {
        throw new ConversionError(date.toString(), `date (${pattern})`);
    }
}

export function AddSecondsToCurrentDate(seconds: number): Date {
    return AddSecondsToDate(new Date(), seconds);
}

export function AddSecondsToDate(date: Date, seconds: number): Date {
    try {
        return add(date, { seconds: seconds });
    } catch {
        throw new DateManipulationError('add seconds');
    }
}

export function GetCurrentDateInSeconds(): number {
    return GetDateInSeconds(new Date());
}

export function GetDateInSeconds(date: Date): number {
    try {
        return Number(format(date, 't'));
    } catch {
        throw new ConversionError(date.toString(), 'date (timestamp in seconds)');
    }
}

export function GetCurrentDay(pattern: string = 'ddMMyyyy'): string {
    let now: number = Date.now();
    try {
        return format(now, pattern);
    } catch {
        throw new ConversionError(now.toString(), `date (${pattern})`);
    }
}

export function CompareDates(first: number | Date, second: number | Date): number {
    return compare(first, second);
}

// This function does not support complex objects where a custom function is needed to perform the sort
export function Sort(object: { [key: string]: any }): Object {
    return Object.keys(omit_by(object, is_nil)).sort().reduce((accumulator: Object, key: string) => {
        if (object[key]) {
            let element: any = (typeof object[key] == 'object') ? ((object[key] instanceof Array) ? [...object[key]].sort() : Sort(object[key])) : object[key];
            return { ...accumulator, [key]: element };
        } else {
            return { ...accumulator };
        }
    }, {});
}

export function CapitalizeFirstLetterOnly(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

export function ReplaceSpaces(s: string, substitution: string = '-'): string {
    return s.replace(/ /g, substitution);
}

export function ReplaceSpacesAndCapitalizeFirstLetterOnly(s: string): string {
    return CapitalizeFirstLetterOnly(ReplaceSpaces(s, ''));
}

export function ReplaceSpacesAndRemoveUppercases(s: string): string {
    return ReplaceSpaces(s.toLowerCase());
}

export function ConvertArrayToObject(array: Array<any>, key: string): { [key: string]: any } {
    return array.reduce((object, item) => { let { [key]: id, ...properties } = item; return Object.assign({}, { ...object, [id]: properties }); }, {});
}

export function ConvertObjectToArray(object: { [key: string]: any }, key_name: string, additional_properties?: { [key: string]: any }): Array<{ [key: string]: any }> {
    return Object.keys(object).map((key: string) => Object.assign({ [key_name]: key }, object[key], additional_properties));
}

export function RemoveKeys(object: { [key: string]: any }, keys: string[]): { [key: string]: any } {
    return { ...Object.keys(object).filter((key: string) => !keys.includes(key)).reduce((object_to_return: { [key: string]: any }, key: string) => { return { ...object_to_return, [key]: object[key] } }, {}) };
}

export function KeepKeys(object: { [key: string]: any }, keys: string[]): { [key: string]: any } {
    return { ...Object.keys(object).filter((key: string) => keys.includes(key)).reduce((object_to_return: { [key: string]: any }, key: string) => { return { ...object_to_return, [key]: object[key] } }, {}) };
}

export function GetEnumKeyOfValue<T extends { [index: string]: string }>(enumerator: T, value: string): Nullable<keyof T> {
    let keys = Object.keys(enumerator).filter(x => enumerator[x] == value);
    return keys.length > 0 ? keys.pop()! : null;
}