import { Role } from '@client/helpers/models/role';

export interface User {
    id: string,
    username: string,
    role: Role
}