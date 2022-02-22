import { IEthereumNetworkSchema, IEthereumNetworkModel } from './ethereum/ethereum';
import { IFabricNetworkSchema, IFabricNetworkModel } from './fabric/fabric';
import { EthereumNetwork, FabricNetwork } from '@service/database/schemata';
import {  } from './ethereum/ethereum.interface';

export type SupportedNetworkSchema = IFabricNetworkSchema | IEthereumNetworkSchema;
export type SupportedNetworkModel = IFabricNetworkModel | IEthereumNetworkModel;
export const SupportedNetworkModels = {
    'ethereum': EthereumNetwork,
    'fabric': FabricNetwork
};
export const SupportedNetworks: string[] = Object.keys(SupportedNetworkModels);


export * from './ethereum/ethereum';
export * from './fabric/fabric';