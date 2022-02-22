import { Connection, Document, Model } from 'mongoose';

import { ProcessSchema, IProcessModel, ProcessVersionSchema, IProcessVersionModel, ExecutionInstanceSchema, IExecutionInstanceModel, TrackAndTraceTraceSchema, ITrackAndTraceTraceModel, ProcessTraceSchema, IProcessTraceModel, ProcessVersionTraceSchema, IProcessVersionTraceModel, ExecutionInstanceTraceSchema, IExecutionInstanceTraceModel, ProcessElementTraceSchema, IProcessElementTraceModel } from '@service/database/schemata';

export let Process: Model<IProcessModel & Document>;
export let ProcessVersion: Model<IProcessVersionModel & Document>;
export let ExecutionInstance: Model<IExecutionInstanceModel & Document>;
export let TrackAndTraceTrace: Model<ITrackAndTraceTraceModel & Document>;
export let ProcessTrace: Model<IProcessTraceModel & Document>;
export let ProcessVersionTrace: Model<IProcessVersionTraceModel & Document>;
export let ExecutionInstanceTrace: Model<IExecutionInstanceTraceModel & Document>;
export let ProcessElementTrace: Model<IProcessElementTraceModel & Document>;

async function Initialize(connection: Connection): Promise<void> {
    Process = connection.model<IProcessModel & Document>('Process', ProcessSchema);
    ProcessVersion = connection.model<IProcessVersionModel & Document>('ProcessVersion', ProcessVersionSchema);
    ExecutionInstance = connection.model<IExecutionInstanceModel & Document>('ExecutionInstance', ExecutionInstanceSchema);
    TrackAndTraceTrace = connection.model<ITrackAndTraceTraceModel & Document>('TrackAndTraceTrace', TrackAndTraceTraceSchema);
    ProcessTrace = TrackAndTraceTrace.discriminator<IProcessTraceModel & Document>('ProcessTrace', ProcessTraceSchema, 'process');
    ProcessVersionTrace = TrackAndTraceTrace.discriminator<IProcessVersionTraceModel & Document>('ProcessVersionTrace', ProcessVersionTraceSchema, 'version');
    ExecutionInstanceTrace = TrackAndTraceTrace.discriminator<IExecutionInstanceTraceModel & Document>('ExecutionInstanceTrace', ExecutionInstanceTraceSchema, 'instance');
    ProcessElementTrace = TrackAndTraceTrace.discriminator<IProcessElementTraceModel & Document>('ProcessElementTrace', ProcessElementTraceSchema, 'element');
}

export { Initialize as InitializeModels };
export * from './instances/instance';
export * from './processes/process';
export * from './traces/trace';
export * from './versions/version';