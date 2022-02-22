import { Model, connection, Document } from 'mongoose';

import { TraceSchema, ITraceModel } from './traces/trace';

export let Trace: Model<ITraceModel & Document>;

async function Initialize(): Promise<void> {
    Trace = connection.model<ITraceModel & Document>('Trace', TraceSchema);
}

export { Initialize as InitializeModels };
export * from './traces/trace';