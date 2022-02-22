import { Document } from 'mongoose';

import { MongooseSchema } from 'core';
import { FABRIC_NETWORK_TYPE, FabricContractStateValues, FabricChannelStateValues } from 'core';
import { IFabricNetworkSchema } from './fabric.interface';

const FABRIC_CONTRACT_CONFIGURATION = {
    'creation': {
        type: Number,
        required: true
    },
    'deactivation': {
        type: Number
    },
    'version': {
        type: Number,
        required: true,
        default: 1
    },
    'state': {
        type: String,
        required: true,
        enum: FabricContractStateValues
    }
};

const FABRIC_CHANNEL_CONFIGURATION = {
    'state': {
        type: String,
        required: true,
        enum: FabricChannelStateValues
    },
    'creation': {
        type: Number,
        required: true
    },
    'participants': {
        type: [String],
        required: true,
        default: []
    },
    'contracts': {
        type: Map,
        of: FABRIC_CONTRACT_CONFIGURATION,
        default: {}
    }
};

export const FABRIC_ACCOUNT: MongooseSchema = new MongooseSchema({
    username: { type: String, required: true },
    password: { type: String, required: true }
});

export const FABRIC_ADMINISTRATOR: MongooseSchema = FABRIC_ACCOUNT;

export const FABRIC_CA_SERVER: MongooseSchema = new MongooseSchema({
    name: { type: String, required: true },
    administrator: FABRIC_ADMINISTRATOR,
    port: { type: Number, required: true }
});

export const FABRIC_CA_SERVERS: MongooseSchema = new MongooseSchema({
    tls: FABRIC_CA_SERVER,
    ca: FABRIC_CA_SERVER
});

export const FABRIC_PARTICIPANT: MongooseSchema = new MongooseSchema({
    name: { type: String, required: true },
    password: { type: String, required: true },
    port: { type: Number, required: true }
});

export const FABRIC_SERVERS_AND_PARTICIPANTS: MongooseSchema = new MongooseSchema({
    servers: FABRIC_CA_SERVERS,
    participants: { type: [FABRIC_PARTICIPANT], required: true, default: [] },
    administrator: FABRIC_ADMINISTRATOR
});

export const FABRIC_ORGANIZATION: MongooseSchema = new MongooseSchema({
    name: { type: String, required: true },
    orderers: FABRIC_SERVERS_AND_PARTICIPANTS,
    peers: FABRIC_SERVERS_AND_PARTICIPANTS,
    cli: { type: String, required: true }
});

export const FabricNetworkSchema: MongooseSchema = new MongooseSchema({
    'configuration': {
        'type': { type: String, required: true, enum: FABRIC_NETWORK_TYPE },
        'channels': {
            type: Map,
            of: FABRIC_CHANNEL_CONFIGURATION
        },
        'organization': FABRIC_ORGANIZATION
    }
});

export interface IFabricNetworkModel extends Document, IFabricNetworkSchema { };