import { execSync as exec } from 'child_process';
import { getuid } from 'process';

import { RecursivePartial, ExecutionOptions } from '@core/types/types';

export const TIMEOUT_BEFORE_FORCED_SHUTDOWN: number = 10000;
export const SHUTDOWN_SIGNALS: NodeJS.Signals[] = ['SIGABRT', 'SIGBUS', 'SIGFPE', 'SIGHUP', 'SIGILL', 'SIGINT', 'SIGQUIT', 'SIGUSR1', 'SIGUSR2', 'SIGTERM'];
export const SCRIPT_EXECUTED_AS_ROOT: boolean = (getuid() === 0) ? true : false;
export const HOME_DIRECTORY: string = exec(`getent passwd \${SUDO_USER:-$USER} | cut -d: -f6 | tr -d '\n'`, { stdio: 'pipe' }).toString();
export const COMMAND_AS_LOGGED_USER: string = 'sudo -u $SUDO_USER';
export const BASH_COMMAND_AS_LOGGED_USER: string = SCRIPT_EXECUTED_AS_ROOT ? `${COMMAND_AS_LOGGED_USER} bash` : 'bash';
export const COMMAND_AS_SUDO_USER: string = 'sudo -u $SUDO_USER';
export const BASH_COMMAND_AS_SUDO_USER: string = `${COMMAND_AS_SUDO_USER} bash`;
export const DEFAULT_EXECUTION_OPTIONS: RecursivePartial<ExecutionOptions> = { silent: process.env.SILENT_EXECUTION_MODE ? (process.env.SILENT_EXECUTION_MODE === 'true') : true, critical: false };