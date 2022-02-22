require('dotenv-expand')(require('dotenv').config());
import config from 'config';
import mongoose from 'mongoose';
import yn from 'yn';
import { AxiosResponse } from 'axios';
import fs from 'fs';
import { Answers, DistinctChoice, ListChoiceMap, prompt, QuestionCollection } from 'inquirer';

import { RegisterProcessShutdownListener, Shutdown, VerifyPlatform, RetrieveGatewayJWKS, InitializeLocalJWKS, HOME_DIRECTORY, Process, TreeOfProcessInstances, ProcessVersionOptions, ExecutionInstanceOptions, ProcessTaskOptions, ExecuteShellCommand, DATABASE_CONNECTION_STRING, SendHTTPRequestToGatewayAPI, HTTPMethod, ProcessOptions } from 'core';

import { LOCAL_RSA_KEYS } from '@service/constants/constants';
import { InitializeMessageQueue } from '@service/rabbitmq/rabbitmq';
import { SetupRoutines } from '@service/routines/routines';
import { InitializeNodeMailer } from '@service/controllers/nodemailer';
import { InitializeEthereumConnector, ShutdownEthereumConnector } from '@service/controllers/ethereum-connector';
import { InitializeFabricConnector, ShutdownFabricConnector } from '@service/controllers/fabric-connector';
import { InitializeDatabase } from '@service/database/database';
import { CreateProcessEntry, CreateProcessVersionEntry, CreateExecutionInstanceEntry, ActivateExecutionInstanceEntry, TerminateExecutionInstanceEntry, CancelExecutionInstanceEntry, IExecutionInstanceModel, GetExecutionInstanceEntry, GetProcessEntry, IProcessModel, GetProcessVersionEntry, IProcessVersionModel, DeactivateProcessVersionEntry, DeactivateProcessEntry } from '@service/database/schemata';
import { UpdateExecutionInstance as UpdateExecutionInstanceEntry } from '@service/controllers/controller';
import { ConvertProcess, SanitizeProcess, CreateDependancyTree, ConvertTreeOfInstances } from '@service/controllers/converter';
import { InitializeServer } from './server/server';

const TRACK_AND_TRACE_FOLDER: string = `${ HOME_DIRECTORY }/TRACK_AND_TRACE`;

async function Initialize(): Promise<void> {
	/* TODO IMMEDIATELY: UNCOMMENT THESE LINES + ADD GENERATION OF LOCAL KEYSTORE
	await Promise.all([InitializeDatabase(), InitializeMessageQueue(), SetupRoutines()]);*/

	// TODO URGENT: DELETE NEXT LINES

	try {
		VerifyPlatform();
		RegisterShutdownListeners();
		console.log('Initializing database...');
		await InitializeDatabase();
		console.log('Database initialized');
		console.log('Keystore of gateway retrieved');
		console.log('Generating local keystore...');
		InitializeLocalJWKS({ keys: LOCAL_RSA_KEYS, location: `${HOME_DIRECTORY}/${config.get('crypto.materials.folder') ?? (config.get('platform') + '/' + config.get('module'))}` });
		console.log('Local keystore generated');
		console.log('Initializing nodemailer...');
		await InitializeNodeMailer();
		console.log('Nodemailer initialized successfully');
		console.log('Initializing Fabric connector...');
		await InitializeFabricConnector();
		console.log('Fabric connector initialized successfully');
		console.log('Initialize Ethereum connector...');
		await InitializeEthereumConnector();
		console.log('Ethereum connector initialized successfully');
		if (yn(config.get('core.secure_mode'), { default: true })) {
			console.log('Retrieving gateway keystore...');
			await RetrieveGatewayJWKS();
			console.log('Keystore of gateway successfully retrieved');
		}
        console.log('Starting server...');
        await InitializeServer();
        console.log('Server started');
		await DisplayMenu();
	} catch (error) {
		// TODO: Log error
		console.error('AN ERROR OCCURRED DURING INITIALIZATION');
		console.error(error);
		return await Shutdown();
	};
}

function RegisterShutdownListeners(): void {
	RegisterProcessShutdownListener('database disconnection', async () => mongoose.disconnect());
	RegisterProcessShutdownListener('ethereum connector shutdown', async () => ShutdownEthereumConnector());
	RegisterProcessShutdownListener('fabric connector shutdown', async () => ShutdownFabricConnector());
}

Initialize();

let QUIT_COMMAND: string = 'exit';
let DEFAULT_COMMAND: string = 'load_process';

let ALL_COMMANDS: DistinctChoice<ListChoiceMap<Answers>>[] = [
    {
        name: 'Create scenario',
        value: 'create_scenario'
    },
    {
        name: 'Create process',
        value: 'create_process'
    },
    {
        name: 'Deactivate process',
        value: 'deactivate_process'
    },
    {
        name: 'Create process version',
        value: 'create_process_version'
    },
    {
        name: 'Deactivate process version',
        value: 'deactivate_process_version'
    },
    {
        name: 'Create execution instance',
        value: 'create_execution_instance'
    },
    {
        name: 'Activate execution instance',
        value: 'activate_execution_instance'
    },
    {
        name: 'Update execution instance',
        value: 'update_execution_instance'
    },
    {
        name: 'Terminate execution instance',
        value: 'terminate_execution_instance'
    },
    {
        name: 'Cancel execution instance',
        value: 'cancel_execution_instance'
    },
    {
        name: 'Display process',
        value: 'display_process'
    },
    {
        name: 'Display process version',
        value: 'display_process_version'
    },
    {
        name: 'Display execution_tree',
        value: 'display_execution_tree'
    },
    {
        name: 'Display execution instance',
        value: 'display_execution_instance'
    },
    {
        name: 'Register Track & Trace repositories',
        value: 'register_track_and_trace_repositories'
    },
    {
        name: 'Empty Track & Trace collections',
        value: 'empty_track_and_trace_collections'
    },
    {
        name: 'Exit',
        value: QUIT_COMMAND
    }
];

type SelectedCommand = Record<'command', string>;
const WHAT_DO_YOU_WANT_TO_DO: QuestionCollection<SelectedCommand>[] = [
    {
        type: 'list',
        name: 'command',
        message: 'What do you want to do?',
        default: DEFAULT_COMMAND,
        choices: ALL_COMMANDS,
        pageSize: 20
    }
];

// MENU
export async function DisplayMenu(): Promise<void> {
    while (true) {
        try {
            const response: SelectedCommand = await prompt(WHAT_DO_YOU_WANT_TO_DO);
            console.clear();
            
            switch (response['command']) {
                case 'create_scenario': {
                    await CreateScenario();
                    break;
                }
                case 'create_process': {
                    await CreateProcess();
                    break;
                }
                case 'deactivate_process': {
                    await DeactivateProcess();
                    break;
                }
                case 'create_process_version': {
                    await CreateProcessVersion();
                    break;
                }
                case 'deactivate_process_version': {
                    await DeactivateProcessVersion();
                    break;
                }
                case 'create_execution_instance': {
                    await CreateExecutionInstance();
                    break;
                }
                case 'activate_execution_instance': {
                    await ActivateExecutionInstance();
                    break;
                }
                case 'update_execution_instance': {
                    await UpdateExecutionInstance();
                    break;
                }
                case 'terminate_execution_instance': {
                    await TerminateExecutionInstance();
                    break;
                }
                case 'cancel_execution_instance': {
                    await CancelExecutionInstance();
                    break;
                }
                case 'display_process': {
                    await DisplayProcess();
                    break;
                }
                case 'display_process_version': {
                    await DisplayProcessVersion();
                    break;
                }
                case 'display_execution_tree': {
                    await DisplayExecutionTree();
                    break;
                }
                case 'display_execution_instance': {
                    await DisplayExecutionInstance();
                    break;
                }
                case 'register_track_and_trace_repositories': {
                    await RegisterTrackAndTraceRepositories();
                    break;
                }
                case 'empty_track_and_trace_collections': {
                    await EmptyTrackAndTraceCollections();
                    break;
                }
                case QUIT_COMMAND: {
                    return await Shutdown();
                } 
            }

            InsertNewlines(1);
        } catch(error) {
            console.error('An unexpected error occurred while handling command');
            console.error(error);
        }
    };
}
// END: MENU

// HELPERS
function InsertNewlines(n: number = 1): void {
    for (let i = 0; i < n; i++) console.log();
}

function ReadFile(location: string): Buffer {
    try {
        return fs.readFileSync(location);
    } catch {
        let error: string = `Could not find file: ${location}`;
        throw new Error(error);
    }
}
// END: HELPERS

const SCENARIO_CREATION_QUESTIONS: QuestionCollection[] = [
    {
        type: 'input',
        name: 'filename',
        message: 'Name of the file:',
        default: 'caseA.bpmn',
        validate: (value: string) => { return value ? true : 'Please enter the name of the file to load' }
    }
];

async function CreateScenario(): Promise < void> {
    let response: Answers;

    while (true) {
        InsertNewlines(1);
        response = await prompt(SCENARIO_CREATION_QUESTIONS);
        try {
            await EmptyTrackAndTraceCollections();
            console.log('Creating process...');
            const process_options: ProcessOptions = JSON.parse(ReadFile(`${TRACK_AND_TRACE_FOLDER}/process-options.json`).toString()) as ProcessOptions;
            const process_data: { [key: string]: any } = JSON.parse(ReadFile(`${TRACK_AND_TRACE_FOLDER}/process-data.json`).toString());
            await CreateProcessEntry({ identifier: 'process', options: process_options, data: process_data });
            console.log('Process successfully created');

            console.log('Creating process version...');
            console.log('Loading model...');
            const file_content: Buffer = ReadFile(`${TRACK_AND_TRACE_FOLDER}/${response['filename']}`);
            console.log('Model loaded successfully');
            console.log('Loading process version options...');
            const version_options: ProcessVersionOptions = JSON.parse(ReadFile(`${TRACK_AND_TRACE_FOLDER}/process-version-options.json`).toString()) as ProcessVersionOptions;
            console.log('Process version options loaded successfully');
            console.log('Loading process version data...');
            const version_data: { [key: string]: any } = JSON.parse(ReadFile(`${TRACK_AND_TRACE_FOLDER}/process-version-data.json`).toString());
            console.log('Process version data loaded successfully');
            const process: Process = await ConvertProcess(file_content.toString());
            const sanitized_process: Process = SanitizeProcess(process, version_options);
            const tree_of_instances: TreeOfProcessInstances = CreateDependancyTree(sanitized_process, version_options);
            console.log('Dependency tree created successfully');
            await CreateProcessVersionEntry({ process: 'process', version: 'version', 'file': file_content.toString(), 'tree': ConvertTreeOfInstances(tree_of_instances), options: version_options, data: version_data });
            console.log('Process version successfully created');

            console.log('Creating instance...');
            const instance_options: ExecutionInstanceOptions = JSON.parse(ReadFile(`${TRACK_AND_TRACE_FOLDER}/instance-options.json`).toString()) as ExecutionInstanceOptions;
            const instance_data: { [key: string]: any } = JSON.parse(ReadFile(`${TRACK_AND_TRACE_FOLDER}/instance-data.json`).toString());
            await CreateExecutionInstanceEntry({ instance: 'instance', process: 'process', version: 'version', options: instance_options, data: instance_data });
            console.log('Execution instance successfully created');

            console.log('Activating instance...');
            await ActivateExecutionInstanceEntry({ instance: 'instance' });
            console.log('Instance successfully activated');
            break;
        } catch (error) {
            console.error(error);
        }
    }
}

const PROCESS_CREATION_QUESTIONS: QuestionCollection[] = [
    {
        type: 'input',
        name: 'process',
        message: 'Name of the process:',
        default: 'process',
        validate: (value: string) => { return value ? true : 'Please enter the name of the process to create' }
    },
    {
        type: 'input',
        name: 'options',
        message: 'File containing BPMN process options (should be located in HOME folder):',
        default: 'process-options.json',
        validate: (value: string) => { return value ? true : 'Please enter the filename' }
    },
    {
        type: 'input',
        name: 'data',
        message: 'File containing BPMN process data (should be located in HOME folder):',
        default: 'process-data.json',
        validate: (value: string) => { return value ? true : 'Please enter the filename' }
    }
];

async function CreateProcess(): Promise<void> {
    let response: Answers;

    while (true) {
        InsertNewlines(1);
        response = await prompt(PROCESS_CREATION_QUESTIONS);
        try {
            console.log('Loading process options...');
            const options: ProcessOptions = JSON.parse(ReadFile(`${TRACK_AND_TRACE_FOLDER}/${response['options']}`).toString()) as ProcessOptions;
            console.log('Process options loaded successfully');
            console.log('Loading process data...');
            const data: { [key: string]: any } = JSON.parse(ReadFile(`${TRACK_AND_TRACE_FOLDER}/${response['data']}`).toString());
            console.log('Process data loaded successfully');
            console.log('Creating process...');
            await CreateProcessEntry({ identifier: response['process'], options, data });
            console.log('Process successfully created');
            break;
        } catch (error) {
            console.error(error);
        }
    }
}

const PROCESS_DEACTIVATION_QUESTIONS: QuestionCollection[] = [
    {
        type: 'input',
        name: 'process',
        message: 'Name of the parent process:',
        default: 'process',
        validate: (value: string) => { return value ? true : 'Please enter the name of the parent process' }
    }
];

async function DeactivateProcess(): Promise<void> {
    let response: Answers;

    while (true) {
        InsertNewlines(1);
        response = await prompt(PROCESS_DEACTIVATION_QUESTIONS);
        try {
            console.log('Deactivating process...');
            await DeactivateProcessEntry({ process_identifier: response['process'] });
            console.log('Process deactivated successfully');
            break;
        } catch (error) {
            console.error(error);
        }
    }
}

const PROCESS_VERSION_CREATION_QUESTIONS: QuestionCollection[] = [
    {
        type: 'input',
        name: 'version',
        message: 'Version name:',
        default: 'version',
        validate: (value: string) => { return value ? true : 'Please enter the name of the version' }
    },
    {
        type: 'input',
        name: 'process',
        message: 'Name of parent process:',
        default: 'process',
        validate: (value: string) => { return value ? true : 'Please enter the name of the process' }
    },
    {
        type: 'input',
        name: 'filename',
        message: 'File containing BPMN process (should be located in HOME folder):',
        default: 'exemple2.bpmn',
        validate: (value: string) => { return value ? true : 'Please enter the filename' }
    },
    {
        type: 'input',
        name: 'options',
        message: 'File containing BPMN process options (should be located in HOME folder):',
        default: 'process-version-options.json',
        validate: (value: string) => { return value ? true : 'Please enter the filename' }
    },
    {
        type: 'input',
        name: 'data',
        message: 'File containing BPMN process data (should be located in HOME folder):',
        default: 'process-version-data.json',
        validate: (value: string) => { return value ? true : 'Please enter the filename' }
    }
];

async function CreateProcessVersion(): Promise<void> {
    let response: Answers;
    let file_content: Buffer;

    while (true) {
        InsertNewlines(1);
        response = await prompt(PROCESS_VERSION_CREATION_QUESTIONS);
        try {
            console.log('Loading model...');
            file_content = ReadFile(`${TRACK_AND_TRACE_FOLDER}/${response['filename']}`);
            console.log('Model loaded successfully');
            console.log('Loading process version options...');
            const options: ProcessVersionOptions = JSON.parse(ReadFile(`${TRACK_AND_TRACE_FOLDER}/${response['options']}`).toString()) as ProcessVersionOptions;
            console.log('Process version options loaded successfully');
            console.log('Loading process version data...');
            const data: { [key: string]: any } = JSON.parse(ReadFile(`${TRACK_AND_TRACE_FOLDER}/${response['data']}`).toString());
            console.log('Process version data loaded successfully');
            console.log('Converting XML process...');
            const process: Process = await ConvertProcess(file_content.toString());
            console.log('Process was converted successfully');
            console.log('Cleaning proces...');
            const sanitized_process: Process = SanitizeProcess(process, options);
            console.log('Process was cleaned successfully');
            console.log('Generating dependency tree...');
            const tree_of_instances: TreeOfProcessInstances = CreateDependancyTree(sanitized_process, options);
            console.log('Dependency tree created successfully');
            console.log('Creating version...');
            await CreateProcessVersionEntry({ process: response['process'], version: response['version'], 'file': file_content.toString(), 'tree': ConvertTreeOfInstances(tree_of_instances), options, data });
            console.log('Process version successfully created');
            break;
        } catch (error) {
            console.error(error);
        }
    }
}

const PROCESS_VERSION_DEACTIVATION_QUESTIONS: QuestionCollection[] = [
    {
        type: 'input',
        name: 'process',
        message: 'Name of the parent process:',
        default: 'process',
        validate: (value: string) => { return value ? true : 'Please enter the name of the parent process' }
    },
    {
        type: 'input',
        name: 'version',
        message: 'Name of the version:',
        default: 'version',
        validate: (value: string) => { return value ? true : 'Please enter the name of the version' }
    }
];

async function DeactivateProcessVersion(): Promise<void> {
    let response: Answers;

    while (true) {
        InsertNewlines(1);
        response = await prompt(PROCESS_VERSION_DEACTIVATION_QUESTIONS);
        try {
            console.log('Deactivating process version...');
            await DeactivateProcessVersionEntry({ process_identifier: response['process'], version_identifier: response['version'] });
            console.log('Process version deactivated successfully');
            break;
        } catch (error) {
            console.error(error);
        }
    }
}

const EXECUTION_INSTANCE_CREATION_QUESTIONS: QuestionCollection[] = [
    {
        type: 'input',
        name: 'instance',
        message: 'Execution instance name:',
        default: 'instance',
        validate: (value: string) => { return value ? true : 'Please enter the name of the execution instance' }
    },
    {
        type: 'input',
        name: 'process',
        message: 'Name of parent process:',
        default: 'process',
        validate: (value: string) => { return value ? true : 'Please enter the name of the process' }
    },
    {
        type: 'input',
        name: 'version',
        message: 'Name of parent version:',
        default: 'version',
        validate: (value: string) => { return value ? true : 'Please enter the name of the version' }
    },
    {
        type: 'input',
        name: 'options',
        message: 'File containing execution instance options (should be located in HOME folder):',
        default: 'instance-options.json',
        validate: (value: string) => { return value ? true : 'Please enter the filename' }
    },
    {
        type: 'input',
        name: 'data',
        message: 'File containing execution instance data (should be located in HOME folder):',
        default: 'instance-data.json',
        validate: (value: string) => { return value ? true : 'Please enter the filename' }
    }
];

async function CreateExecutionInstance(): Promise<void> {
    let response: Answers;

    while (true) {
        InsertNewlines(1);
        response = await prompt(EXECUTION_INSTANCE_CREATION_QUESTIONS);
        try {
            console.log('Loading execution instance options...');
            const options: ExecutionInstanceOptions = JSON.parse(ReadFile(`${TRACK_AND_TRACE_FOLDER}/${response['options']}`).toString()) as ExecutionInstanceOptions;
            console.log('Execution instance options loaded successfully');
            console.log('Loading execution instance data...');
            const data: { [key: string]: any } = JSON.parse(ReadFile(`${TRACK_AND_TRACE_FOLDER}/${response['data']}`).toString());
            console.log('Execution instance data loaded successfully');
            console.log('Creating execution instance...');
            await CreateExecutionInstanceEntry({ instance: response['instance'], process: response['process'], version: response['version'], options, data });
            console.log('Execution instance successfully created');
            break;
        } catch (error) {
            console.error(error);
        }
    }
}

const EXECUTION_INSTANCE_ACTIVATION_QUESTIONS: QuestionCollection[] = [
    {
        type: 'input',
        name: 'instance',
        message: 'Name of execution instance to activate:',
        default: 'instance',
        validate: (value: string) => { return value ? true : 'Please enter the name of the execution instance' }
    }
];

async function ActivateExecutionInstance(): Promise<void> {
    let response: Answers;

    while (true) {
        InsertNewlines(1);
        response = await prompt(EXECUTION_INSTANCE_ACTIVATION_QUESTIONS);
        try {
            console.log('Activating execution instance...');
            await ActivateExecutionInstanceEntry({ instance: response['instance'] });
            console.log('Execution instance activation successfully called');
            break;
        } catch (error) {
            console.error(error);
        }
    }
}

const EXECUTION_INSTANCE_UPDATE_QUESTIONS: QuestionCollection[] = [
    {
        type: 'input',
        name: 'instance',
        message: 'Name of execution instance to update:',
        default: 'instance',
        validate: (value: string) => { return value ? true : 'Please enter the name of the execution instance' }
    },
    {
        type: 'input',
        name: 'task',
        message: 'Identifier of the task to register:',
        default: 'task',
        validate: (value: string) => { return value ? true : 'Please enter the identifier of the task' }
    },
    {
        type: 'input',
        name: 'options',
        message: 'File containing task options (should be located in HOME folder):',
        default: 'task-options.json',
        validate: (value: string) => { return value ? true : 'Please enter the filename' }
    },
    {
        type: 'input',
        name: 'data',
        message: 'File containing task data (should be located in HOME folder):',
        default: 'task-data.json',
        validate: (value: string) => { return value ? true : 'Please enter the filename' }
    }
];

async function UpdateExecutionInstance(): Promise<void> {
    let response: Answers;

    while (true) {
        InsertNewlines(1);
        response = await prompt(EXECUTION_INSTANCE_UPDATE_QUESTIONS);
        try {
            console.log('Loading task options...');
            const options: ProcessTaskOptions = JSON.parse(ReadFile(`${TRACK_AND_TRACE_FOLDER}/${response['options']}`).toString()) as ProcessTaskOptions;
            console.log('Task options loaded successfully');
            console.log('Loading task data...');
            const data: { [key: string]: any } = JSON.parse(ReadFile(`${TRACK_AND_TRACE_FOLDER}/${response['data']}`).toString());
            console.log('Task data loaded successfully');
            console.log('Updating execution instance...');
            await UpdateExecutionInstanceEntry({ instance: response['instance'], task: response['task'], options, data });
            console.log('Execution instance update called successfully');
            break;
        } catch (error) {
            console.error(error);
        }
    }
}

const EXECUTION_INSTANCE_TERMINATION_QUESTIONS: QuestionCollection[] = [
    {
        type: 'input',
        name: 'instance',
        message: 'Name of execution instance to terminate:',
        default: 'instance',
        validate: (value: string) => { return value ? true : 'Please enter the name of the execution instance' }
    },
    {
        type: 'input',
        name: 'event',
        message: 'Identifier of end event:',
        default: 'end',
        validate: (value: string) => { return value ? true : 'Please enter the identifier of the end event' }
    }
];

async function TerminateExecutionInstance(): Promise<void> {
    let response: Answers;

    while (true) {
        InsertNewlines(1);
        response = await prompt(EXECUTION_INSTANCE_TERMINATION_QUESTIONS);
        try {
            console.log('Terminating execution instance...');
            await TerminateExecutionInstanceEntry({ instance: response['instance'], end: response['event'] });
            console.log('Execution instance termination successfully called');
            break;
        } catch (error) {
            console.error(error);
        }
    }
}

const EXECUTION_INSTANCE_CANCELATION_QUESTIONS: QuestionCollection[] = [
    {
        type: 'input',
        name: 'instance',
        message: 'Name of execution instance to cancel:',
        default: 'instance',
        validate: (value: string) => { return value ? true : 'Please enter the name of the execution instance' }
    }
];

async function CancelExecutionInstance(): Promise<void> {
    let response: Answers;

    while (true) {
        InsertNewlines(1);
        response = await prompt(EXECUTION_INSTANCE_CANCELATION_QUESTIONS);
        try {
            console.log('Cancelling execution instance...');
            await CancelExecutionInstanceEntry({ instance: response['instance'] });
            console.log('Execution instance cancellation successfully called');
            break;
        } catch (error) {
            console.error(error);
        }
    }
}

const PROCESS_DISPLAY_QUESTIONS: QuestionCollection[] = [
    {
        type: 'input',
        name: 'process',
        message: 'Name of process:',
        default: 'process',
        validate: (value: string) => { return value ? true : 'Please enter the name of the process' }
    }
];

async function DisplayProcess(): Promise<void> {
    let response: Answers;

    while (true) {
        InsertNewlines(1);
        response = await prompt(PROCESS_DISPLAY_QUESTIONS);
        try {
            console.log('Loading process...');
            const process_entry: IProcessModel = await GetProcessEntry(response['process']);
            console.log('Process successfully loaded');
            console.log('Display process...');
            console.log(JSON.stringify(process_entry.toJSON()));
            break;
        } catch (error) {
            console.error(error);
        }
    }
}

const PROCESS_VERSION_DISPLAY_QUESTIONS: QuestionCollection[] = [
    {
        type: 'input',
        name: 'version',
        message: 'Name of version:',
        default: 'version',
        validate: (value: string) => { return value ? true : 'Please enter the name of the version' }
    },
    {
        type: 'input',
        name: 'process',
        message: 'Name of parent process:',
        default: 'process',
        validate: (value: string) => { return value ? true : 'Please enter the name of the parent process' }
    }
];

async function DisplayProcessVersion(): Promise<void> {
    let response: Answers;

    while (true) {
        InsertNewlines(1);
        response = await prompt(PROCESS_VERSION_DISPLAY_QUESTIONS);
        try {
            console.log('Loading process version...');
            const process_version_entry: IProcessVersionModel = await GetProcessVersionEntry(response['process'], response['version']);
            console.log('Process version successfully loaded');
            console.log('Display process version...');
            console.log(JSON.stringify(process_version_entry.toJSON()));
            break;
        } catch (error) {
            console.error(error);
        }
    }
}

const DEPENDENCY_TREE_DISPLAY_QUESTIONS: QuestionCollection[] = [
    {
        type: 'input',
        name: 'instance',
        message: 'Name of execution instance:',
        default: 'instance',
        validate: (value: string) => { return value ? true : 'Please enter the name of the execution instance' }
    }
];

const EXECUTION_TREE_DISPLAY_QUESTIONS: QuestionCollection[] = [
    {
        type: 'input',
        name: 'instance',
        message: 'Name of execution instance:',
        default: 'instance',
        validate: (value: string) => { return value ? true : 'Please enter the name of the execution instance' }
    }
];

async function DisplayExecutionTree(): Promise<void> {
    let response: Answers;

    while (true) {
        InsertNewlines(1);
        response = await prompt(EXECUTION_TREE_DISPLAY_QUESTIONS);
        try {
            console.log('Loading execution instance...');
            const execution_instance_entry: IExecutionInstanceModel = await GetExecutionInstanceEntry(response['instance']);
            console.log('Execution instance successfully loaded');
            console.log('Fetching execution tree...');
            console.log(JSON.stringify(execution_instance_entry.get('execution')));
            break;
        } catch (error) {
            console.error(error);
        }
    }
}

const EXECUTION_INSTANCE_DISPLAY_QUESTIONS: QuestionCollection[] = [
    {
        type: 'input',
        name: 'instance',
        message: 'Name of execution instance:',
        default: 'instance',
        validate: (value: string) => { return value ? true : 'Please enter the name of the execution instance' }
    }
];

async function DisplayExecutionInstance(): Promise<void> {
    let response: Answers;

    while (true) {
        InsertNewlines(1);
        response = await prompt(EXECUTION_INSTANCE_DISPLAY_QUESTIONS);
        try {
            console.log('Loading execution instance...');
            const execution_instance_entry: IExecutionInstanceModel = await GetExecutionInstanceEntry(response['instance']);
            console.log('Execution instance successfully loaded');
            console.log('Display execution instance...');
            console.log(JSON.stringify(execution_instance_entry.toJSON()));
            break;
        } catch (error) {
            console.log(error);
        }
    }
}

async function RegisterTrackAndTraceRepositories(): Promise<void> {
    const repositories: { identifier: string, name: string }[] = [
        { identifier: 'track-and-trace-processes', name: 'T&T processes' },
        { identifier: 'track-and-trace-executions', name: 'T&T executions' },
        { identifier: 'track-and-trace-options', name: 'T&T options' },
        { identifier: 'track-and-trace-data', name: 'T&T data' }
    ];

    const responses: AxiosResponse[] = await Promise.all(repositories.map(async (repository: { identifier: string, name: string }) => SendHTTPRequestToGatewayAPI('/data-manager/repositories', HTTPMethod.POST, {
        'parameters': {
            'identifier': repository['identifier'],
            'name': repository['name'],
            'description': `Repository used for ${repository['name']}`,
            'custodian': 'mongodb-storage'
        }
    })));

    if (responses.every((response: AxiosResponse) => (response.status >= 200) && (response.status < 300))) console.log('All repositories created');
    else console.error('Error while creating repositories');
}

async function EmptyTrackAndTraceCollections(): Promise<void> {
    try {
        console.log('Emptying Track & Trace collections...');
        await ExecuteShellCommand(`mongosh ${DATABASE_CONNECTION_STRING} --eval "['processes', 'process-versions', 'execution-instances', 'track-and-trace-traces', 'data', 'references'].forEach(function(c) { db[c].remove({}) })"`);
        await ExecuteShellCommand(`mongosh ${DATABASE_CONNECTION_STRING} --eval "db['repositories'].updateMany({}, { \\$set: { 'entries': [] } })"`);
        console.log('Done');
    } catch (error) {
        console.error('Error while emptying Track & Trace collections');
        console.error(error);
    }
}