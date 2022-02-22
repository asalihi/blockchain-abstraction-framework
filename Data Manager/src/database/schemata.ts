import { Connection, Document, Model } from 'mongoose';

import { CustodianSchema, ICustodianModel } from './custodians/custodian';
import { ReferenceSchema, IReferenceModel } from './references/reference';
import { RepositorySchema, IRepositoryModel } from './repositories/repository';

export let Custodian: Model<ICustodianModel & Document>;
export let Reference: Model<IReferenceModel & Document>;
export let Repository: Model<IRepositoryModel & Document>;

async function Initialize(connection: Connection): Promise<void> {
    Custodian = connection.model<ICustodianModel & Document>('Custodian', CustodianSchema);
    Reference = connection.model<IReferenceModel & Document>('Reference', ReferenceSchema);
    Repository = connection.model<IRepositoryModel & Document>('Repository', RepositorySchema);
}

export { Initialize as InitializeModels };
export * from './custodians/custodian';
export * from './references/reference';
export * from './repositories/repository';