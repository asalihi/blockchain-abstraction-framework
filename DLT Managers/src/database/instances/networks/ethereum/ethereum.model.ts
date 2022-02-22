import { Document } from 'mongoose';

import { MongooseSchema } from 'core';
import { IEthereumNetworkSchema } from './ethereum.interface';

export const EthereumNetworkSchema: MongooseSchema = new MongooseSchema({
    'configuration': {
        type: MongooseSchema.Types.Mixed,
        required: true,
        default: {}
    }
});

export interface IEthereumNetworkModel extends Document, IEthereumNetworkSchema { };