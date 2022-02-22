import { PasswordHashedWithSalt, UserRole } from '@service/utils/types';

export interface IUserSchema {
    'username': string,
    'password': PasswordHashedWithSalt,
    'role': UserRole
}