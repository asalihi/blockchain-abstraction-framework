import config from 'config';
import { Document, model, Model } from 'mongoose';

import { IAPISessionSchema } from './session.interface';
import { GenerateUniqueIdentifier } from '@service/crypto/helpers';
import { TokenPayload, StoredToken, TokenValue } from '@service/utils/types';

export const API_SESSION_COLLECTION_NAME: string = 'api-sessions';

const APISessionSchema: Schema = new Schema({
    identifier: {
        type: String,
        unique: true,
        required: true,
        default: GenerateUniqueIdentifier
    },
    username: {
        type: String,
        unique: true,
        required: true
    },
    last_used_token: {
        type: {
            value: {
                type: String,
                required: true,
                default: config.get('crypto.jwt.genesis')
            },
            salt: {
                type: String,
                required: true
            },
            jti: {
                type: String,
                required: true,
                default: config.get('crypto.jwt.genesis')
            }
        },
        required: true
    },
    login: {
        type: Number,
        required: true
    }
}, { collection: API_SESSION_COLLECTION_NAME });

export interface IAPISessionModel extends Document, IAPISessionSchema { };
export const APISession: Model<IAPISessionModel & Document> = model<IAPISessionModel & Document>('APISession', APISessionSchema);