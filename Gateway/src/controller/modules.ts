import { Document, FilterQuery } from 'mongoose';

import { IModuleSchema, IModuleModel, RegisterModuleEntry, GetModuleEntry, UpdateModuleEntry, CountModules as CountRegisteredModules, FetchModules as FetchRegisteredModules } from '@service/database/schemata';
import { Module, Identifier } from '@service/utils/types';

const MODULES: Module[] = [
    {
        'identifier': 'track-and-trace',
        'name': 'Track & Trace',
        'description': 'Module used to register processes and verify correct execution of instances',
        'server': 'http://localhost:3001',
    },
    {
        'identifier': 'data-manager',
        'name': 'Data Manager',
        'description': 'Module used to register data in custodians and store internal references within the platform',
        'server': 'http://localhost:3002',
    },
    {
        'identifier': 'mongodb-storage',
        'name': 'MongoDB storage',
        'description': 'Module used to register data in a MongoDB database',
        'server': 'http://localhost:3003',
    }
];

export async function RegisterModules(): Promise<void> {
    await Promise.all(MODULES.map(async (module: Module) => await RegisterModuleEntry(module)));
}

export async function GetModule(module: Identifier): Promise<IModuleModel> {
    return await GetModuleEntry(module);
}

export async function RegisterModule(module: Module): Promise<IModuleModel> {
    return await RegisterModuleEntry(module);
}

export async function UpdateModule(module: Identifier, data: Partial<Omit<Module, 'identifier'>>): Promise<IModuleModel> {
    return await UpdateModuleEntry(module, data);
}

export async function CountModules(filters: FilterQuery<IModuleModel & Document>): Promise<number> {
    return await CountRegisteredModules(filters);
}

// TODO: Set type for expected parameters (same in DB controller)
// TODO: Use specific type for returned value
export async function FetchModules(parameters?: any): Promise<(IModuleSchema & { '_id'?: string })[]> {
    return await FetchRegisteredModules(parameters);
}