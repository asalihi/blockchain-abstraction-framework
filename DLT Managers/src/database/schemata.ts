import { Document, Connection, Model } from 'mongoose';

import { IEthereumNetworkModel, EthereumNetworkSchema, IContractVersionModel, ContractVersionSchema, IDLTInstanceProfileModel, DLTInstanceProfileSchema, DLTInstanceSchema, IDLTInstanceModel, FabricNetworkSchema, IFabricNetworkModel, RecordSchema, IRecordModel, AbstractedRecordSchema, IAbstractedRecordModel, RawRecordSchema, IRawRecordModel, RecordSubmissionSchema, IRecordSubmissionModel, AbstractedRecordSubmissionSchema, IAbstractedRecordSubmissionModel, RawRecordSubmissionSchema, IRawRecordSubmissionModel, ContractSchema, IContractModel, ContractOperationSchema, IContractOperationModel, ContractInvocationSchema, IContractInvocationModel, ContractManagementSchema, IContractManagementModel, RawContractOperationSchema, IRawContractOperationModel, ContractOperationTaskSchema, IContractOperationTaskModel, ContractTemplateSchema, IContractTemplateModel } from '@service/database/schemata';

export let DLTInstance: Model<IDLTInstanceModel & Document>;
export let DLTInstanceProfile: Model<IDLTInstanceProfileModel & Document>;
export let EthereumNetwork: Model<IEthereumNetworkModel & Document>;
export let FabricNetwork: Model<IFabricNetworkModel & Document>;
export let Record: Model<IRecordModel & Document>;
export let AbstractedRecord: Model<IAbstractedRecordModel & Document>;
export let RawRecord: Model<IRawRecordModel & Document>;
export let RecordSubmission: Model<IRecordSubmissionModel & Document>;
export let AbstractedRecordSubmission: Model<IAbstractedRecordSubmissionModel & Document>;
export let RawRecordSubmission: Model<IRawRecordSubmissionModel & Document>;
export let Contract: Model<IContractModel & Document>;
export let ContractVersion: Model<IContractVersionModel & Document>;
export let ContractOperation: Model<IContractOperationModel & Document>;
export let ContractInvocation: Model<IContractInvocationModel & Document>;
export let ContractManagement: Model<IContractManagementModel & Document>;
export let RawContractOperation: Model<IRawContractOperationModel & Document>;
export let ContractOperationTask: Model<IContractOperationTaskModel & Document>;
export let ContractTemplate: Model<IContractTemplateModel & Document>;

async function Initialize(connection: Connection): Promise<void> {
    DLTInstance = connection.model<IDLTInstanceModel & Document>('DLTInstance', DLTInstanceSchema);
    DLTInstanceProfile = connection.model<IDLTInstanceProfileModel & Document>('DLTInstanceProfile', DLTInstanceProfileSchema);
    EthereumNetwork = DLTInstance.discriminator<IEthereumNetworkModel & Document>('EthereumNetwork', EthereumNetworkSchema, 'ethereum');
    FabricNetwork = DLTInstance.discriminator<IFabricNetworkModel & Document>('FabricNetwork', FabricNetworkSchema, 'fabric');
    Record = connection.model<IRecordModel & Document>('Record', RecordSchema);
    AbstractedRecord = Record.discriminator<IAbstractedRecordModel & Document>('AbstractedRecord', AbstractedRecordSchema, 'abstracted');
    RawRecord = Record.discriminator<IRawRecordModel & Document>('RawRecord', RawRecordSchema, 'raw');
    RecordSubmission = connection.model<IRecordSubmissionModel & Document>('RecordSubmission', RecordSubmissionSchema);
    AbstractedRecordSubmission = RecordSubmission.discriminator<IAbstractedRecordSubmissionModel & Document>('AbstractedRecordSubmission', AbstractedRecordSubmissionSchema, 'abstracted');
    RawRecordSubmission = RecordSubmission.discriminator<IRawRecordSubmissionModel & Document>('RawRecordSubmission', RawRecordSubmissionSchema, 'raw');
    Contract = connection.model<IContractModel & Document>('Contract', ContractSchema);
    ContractVersion = connection.model<IContractVersionModel & Document>('ContractVersion', ContractVersionSchema);
    ContractOperation = connection.model<IContractOperationModel & Document>('ContractOperation', ContractOperationSchema);
    ContractInvocation = ContractOperation.discriminator<IContractInvocationModel & Document>('ContractInvocation', ContractInvocationSchema, 'invocation');
    ContractManagement = ContractOperation.discriminator<IContractManagementModel & Document>('ContractManagement', ContractManagementSchema, 'management');
    RawContractOperation = ContractOperation.discriminator<IRawContractOperationModel & Document>('RawContractOperation', RawContractOperationSchema, 'raw');
    ContractOperationTask = connection.model<IContractOperationTaskModel & Document>('IContractOperationTask', ContractOperationTaskSchema);
    ContractTemplate = connection.model<IContractTemplateModel & Document>('ContractTemplate', ContractTemplateSchema);
}

export { Initialize as InitializeModels };
export * from './instances/instance';
export * from './records/record';
export * from './records/submissions/submission';
export * from './contracts/contract';
export * from './contracts/versions/version';
export * from './contracts/operations/operation';
export * from './contracts/templates/template';
