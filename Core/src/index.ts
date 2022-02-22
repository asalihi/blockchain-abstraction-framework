import { Schema } from 'mongoose';

import { SHUTDOWN_SIGNALS } from '@core/constants/constants';
import { FORCE_EXIT_FUNCTION, Shutdown } from '@core/helpers/helpers';

function Initialize(): void {
    SHUTDOWN_SIGNALS.forEach((signal: NodeJS.Signals) => {
        process.on(signal, FORCE_EXIT_FUNCTION());
        process.on(signal, Shutdown);
    });

    process.on('beforeExit', FORCE_EXIT_FUNCTION());
    process.on('beforeExit', Shutdown);
}

Initialize();

export * from '@core/constants/constants';
export * from '@core/crypto/crypto';
export * from '@core/database/database';
export * from '@core/errors/errors';
export * from '@core/helpers/helpers';
export * from '@core/rabbitmq/rabbitmq';
export * from '@core/routines/routines';
export * from '@core/server/server';
export * from '@core/types/types';

export { Schema as MongooseSchema };