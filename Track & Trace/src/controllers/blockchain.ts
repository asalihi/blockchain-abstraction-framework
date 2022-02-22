import { RegisterEntry as RegisterEntryOnEthereum, RetrieveEntry as RetrieveEntryFromEthereum } from '@service/controllers/ethereum-connector';
import { RegisterEntry as RegisterEntryOnFabric, RetrieveEntry as RetrieveEntryFromFabric } from '@service/controllers/fabric-connector';

export async function RegisterEntry(platform: 'ethereum' | 'fabric', type: 'data' | 'trace', key: string, value: string): Promise<void> {
    if(!['data', 'trace'].includes(type)) return console.error(`Unrecognized entry type: ${type}. Aborting.`);
    
    if(platform === 'ethereum') {
        await RegisterEntryOnEthereum(type, key, value);
    } else if(platform === 'fabric') {
        await RegisterEntryOnFabric(type, key, value);
    } else {
        console.error(`Unsupported platform: ${platform}. Aborting.`);
    }
}

export async function RetrieveEntry(platform: 'ethereum' | 'fabric', type: 'data' | 'trace', key: string): Promise<any> {
    if(!['trace', 'data'].includes(type)) {
        return console.error(`Unrecognized entry type: ${type}. Aborting.`);
    }
    
    if(platform === 'ethereum') {
        return await RetrieveEntryFromEthereum(type, key);
    } else if(platform === 'fabric') {
        return await RetrieveEntryFromFabric(type, key);
    } else {
        return console.error(`Unsupported platform: ${platform}. Aborting.`);
    }
}