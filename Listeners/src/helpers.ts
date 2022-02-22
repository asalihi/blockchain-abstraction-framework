import { readFileSync } from 'fs';

export const SHUTDOWN_SIGNALS: NodeJS.Signals[] = ['SIGABRT', 'SIGBUS', 'SIGFPE', 'SIGHUP', 'SIGILL', 'SIGINT', 'SIGQUIT', 'SIGUSR1', 'SIGUSR2', 'SIGTERM'];
const TIMEOUT_BEFORE_FORCED_SHUTDOWN: number = 10000;
const SHUTDOWN_LISTENERS: { operation: string, listener: () => any | Promise<any> }[] = [];

export function RegisterProcessShutdownListener(operation: string, listener: () => any | Promise<any>): () => any | Promise<any> {
    SHUTDOWN_LISTENERS.push({ operation, listener });
    return listener;
}

export async function Shutdown(): Promise<void> {
    // console.clear();
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

export function ReadFile(location: string): Buffer {
    try {
        return readFileSync(location);
    } catch {
        throw new Error(`Could not read file: ${ location }`);
    }
}