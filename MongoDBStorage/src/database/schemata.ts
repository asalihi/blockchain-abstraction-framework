import { Connection, Document, Model } from 'mongoose';

import { DataSchema, IDataModel, DATA_COLLECTION_NAME } from './data/data';

export let Data: Model<IDataModel & Document>;

async function Initialize(connection: Connection): Promise<void> {
    Data = connection.model<IDataModel & Document>('Data', DataSchema, DATA_COLLECTION_NAME);
}

export { Initialize as InitializeModels };
export * from './data/data';