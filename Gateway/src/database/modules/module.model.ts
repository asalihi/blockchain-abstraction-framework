import { Document, Schema, model, Model } from 'mongoose';
import URL_REGEX_SAFE from 'url-regex-safe';

import { IModuleSchema } from './module.interface';

export const MODULE_COLLECTION_NAME: string = 'modules';

const ModuleSchema: Schema = new Schema({
    'identifier': {
        type: String,
        required: true,
        unique: true
    },
    'name': {
        type: String,
        required: true
    },
    'description': {
        type: String,
        required: false
    },
    'server': {
        type: String,
        required: true,
        validate: function (this: IModuleSchema) { return URL_REGEX_SAFE({ exact: true, localhost: true }).test(this.server) }
    }
}, { collection: MODULE_COLLECTION_NAME });

export interface IModuleModel extends Document, IModuleSchema { };
export const Module: Model<IModuleModel & Document> = model<IModuleModel & Document>('Module', ModuleSchema);