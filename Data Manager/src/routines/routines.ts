import { Routine, StartRoutines, RetrieveGatewayJWKS, RenewLocalJWKS } from 'core';
import { LOCAL_RSA_KEYS } from '@service/constants/constants';

const ROUTINES: Routine[] = [
    { identifier: 'retrieve_gateway_keystore', fn: async () => { try { await RetrieveGatewayJWKS() } catch { } }, cron: '* 0 12 * * *' },
    { identifier: 'renew_local_keystore', fn: async () => { try { await RenewLocalJWKS(LOCAL_RSA_KEYS) } catch { } }, cron: '* 0 12 * * *' }
];

export async function SetupRoutines(): Promise<void> {
    StartRoutines(ROUTINES);
}