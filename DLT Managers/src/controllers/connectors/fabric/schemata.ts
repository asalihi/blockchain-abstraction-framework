import Ajv2020 from 'ajv';

import { FabricNetworkInstallationConfiguration, FABRIC_NETWORK_INSTALLATION_MODE, FABRIC_NETWORK_TYPE } from 'core';

const FabricAdministratorSchema = {
    type: "object",
    properties: {
        username: { type: "string" },
        password: { type: "string" }
    },
    required: ["username", "password"],
    additionalProperties: false
};

const FabricCAServerSchema = {
    type: "object",
    properties: {
        name: { type: "string" },
        administrator: FabricAdministratorSchema,
        port: { type: "number", minimum: 7050, maximum: 8000 }
    },
    required: ["name", "administrator", "port"],
    additionalProperties: false
};

const ListOfFabricCAServersSchema = {
    type: "object",
    properties: {
        tls: FabricCAServerSchema,
        ca: FabricCAServerSchema
    },
    required: ["tls", "ca"],
    additionalProperties: false
};

const ListOfFabricParticipantsSchema = {
    type: "array",
    minItems: 1,
    maxItems: 5,
    items: {
        type: "object",
        properties: {
            name: { type: "string" },
            password: { type: "string" },
            port: { type: "number", minimum: 7050, maximum: 8000 }
        },
        required: ["name", "password", "port"],
        additionalProperties: false
    }
};

const ListOfFabricServersAndParticipantsSchema = {
    type: "object",
    properties: {
        servers: ListOfFabricCAServersSchema,
        participants: ListOfFabricParticipantsSchema,
        administrator: FabricAdministratorSchema
    },
    required: ["servers", "participants", "administrator"],
    additionalProperties: false
};

// TODO: Add support for multiple organizations
const FabricNetworkInstallationConfigurationSchema = {
    type: "object",
    properties: {
        mode: { type: "string", enum: FABRIC_NETWORK_INSTALLATION_MODE },
        type: { type: "string", enum: FABRIC_NETWORK_TYPE },
        network: { type: "string" },
        channel: { type: "string" },
        organizations: {
            type: "array",
            minItems: 1,
            maxItems: 1,
            items: {
                type: "object",
                properties: {
                    name: { type: "string" },
                    orderers: ListOfFabricServersAndParticipantsSchema,
                    peers: ListOfFabricServersAndParticipantsSchema,
                    cli: { type: "string" }
                },
                required: ["name", "orderers", "peers", "cli"],
                additionalProperties: false
            }
        }
    },
    required: ["mode", "type", "network", "channel", "organizations"],
    additionalProperties: false
};

const ajv: Ajv2020 = new Ajv2020();
export const InstallationConfigurationValidator = ajv.compile<FabricNetworkInstallationConfiguration>(FabricNetworkInstallationConfigurationSchema);