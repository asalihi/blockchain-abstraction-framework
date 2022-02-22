import { Document } from 'mongoose';

import { MongooseSchema, RepositoryStateValues } from 'core';
import { IRepositorySchema } from './repository.interface';

export const REPOSITORY_COLLECTION_NAME: string = 'repositories';

export const RepositorySchema: MongooseSchema = new MongooseSchema({
	'identifier': {
		type: String,
		unique: true,
		required: true
	},
	'name': {
		type: String,
		required: true
    },
	'description': {
		type: String,
		required: false
	},
	'creation': {
		type: Number,
		required: true
	},
	'custodian': {
		type: String,
		required: true
	},
	'state': {
		type: String,
		required: true,
		enum: RepositoryStateValues
    },
	'entries': {
		type: [String],
		required: true,
		default: [],
		validate: function (this: IRepositorySchema): boolean { return (this.entries?.length > 0) ? (this.entries.length === [...new Set(this.entries)].length) : true }
    }
}, { collection: REPOSITORY_COLLECTION_NAME });

export interface IRepositoryModel extends Document, IRepositorySchema { };