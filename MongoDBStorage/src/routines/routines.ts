import { Routine, StartRoutines, RetrieveGatewayJWKS } from 'core';

const ROUTINES: Routine[] = [
    { identifier: 'retrieve_gateway_keystore', fn: async () => { try { await RetrieveGatewayJWKS() } catch { } }, cron: '* 0 12 * * *' }
];

export async function SetupRoutines(): Promise<void> {
    StartRoutines(ROUTINES);
}