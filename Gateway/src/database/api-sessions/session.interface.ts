import { StoredToken } from '@service/utils/types';

export interface IAPISessionSchema {
    'identifier': string,
    'username': string,
    'last_used_token': Partial<StoredToken>,
    'login': number
}