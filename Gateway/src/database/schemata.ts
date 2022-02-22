import { Model } from 'mongoose';

import { APISession } from './api-sessions/session';
import { Module } from './modules/module';
import { User } from './users/user';

export async function Initialize(): Promise<void> {
    await Promise.all([APISession, Module, User].map((model: Model<any>) => model.init()));
}

export * from './api-sessions/session';
export * from './modules/module';
export * from './users/user';