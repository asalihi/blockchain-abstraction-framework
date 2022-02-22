import { FABRIC_NETWORK_TYPE, FABRIC_NETWORK_INSTALLATION_MODE } from '@core/constants/constants';
import { Identifier, Port, HTTPEndpoint } from '@core/types/types';


export type FabricNetworkInstallationType = typeof FABRIC_NETWORK_TYPE[number];

export type FabricNetworkInstallationMode = typeof FABRIC_NETWORK_INSTALLATION_MODE[number];

export interface FabricAccount {
    username: string,
    password: string
}

export interface FabricAdministrator extends FabricAccount {};

export interface FabricCAServer {
    name: string
    administrator: FabricAdministrator,
    port: number
}

export interface CAServers {
    tls: FabricCAServer,
    ca: FabricCAServer
}

export interface FabricParticipant {
    name: string,
    password: string,
    port: number
}

export interface ListOfFabricServersAndParticipants {
    servers: CAServers,
    participants: FabricParticipant[],
    administrator: FabricAdministrator
}

export interface FabricOrganizationName {
    name: string
}

export interface AllFabricParticipantsOfOrganization {
    orderers: ListOfFabricServersAndParticipants,
    peers: ListOfFabricServersAndParticipants
}

export interface FabricOrganization extends FabricOrganizationName, AllFabricParticipantsOfOrganization {
    cli: string
}
export type FabricNetworkInstallationConfiguration = { mode: FabricNetworkInstallationMode, type: FabricNetworkInstallationType, network: Identifier, channel: Identifier, organizations: FabricOrganization[] };

// TODO: Include more states (e.g., updating, and so on)
export const FabricContractStateValues = ['initializing', 'active', 'deactivated'];
export type FabricContractState = typeof FabricContractStateValues[number];
export type FabricContractConfiguration = { 'creation': number, 'deactivation'?: number, 'version': number, 'state': FabricContractState };
export type FabricContracts = { [key: string]: FabricContractConfiguration };
export const FabricChannelStateValues = ['inactive', 'initializing', 'active', 'deactivated'];
export type FabricChannelState = typeof FabricChannelStateValues[number];
export type FabricChannelConfiguration = { 'state': FabricChannelState, 'creation'?: number | 'N/A', 'participants': Identifier[], 'contracts': FabricContracts };
export type FabricChannels = { [key: string]: FabricChannelConfiguration };
export type FabricServerConfiguration = { 'domain': HTTPEndpoint, 'port': Port };
export type FabricCAServerConfiguration = { 'identifier': Identifier, 'type': keyof CAServers, 'audience': FabricParticipants[], 'server': FabricServerConfiguration, 'administrator': FabricAdministrator };
export type FabricServers = { [key in keyof CAServers]: FabricCAServerConfiguration };
export type FabricParticipantConfiguration = { 'identifier': Identifier, 'server': FabricServerConfiguration, 'account': FabricAccount };
export type FabricParticipants = { 'instances': { [key: string]: FabricParticipantConfiguration }, 'administrator': FabricAdministrator };
export type FabricNetworkConfiguration = { 'type': typeof FABRIC_NETWORK_TYPE[number], 'channels': FabricChannels, organization: FabricOrganization };