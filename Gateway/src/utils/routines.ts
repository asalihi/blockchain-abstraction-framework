import { Job, Queue, QueueScheduler, Worker } from 'bullmq';

import { RenewLocalJWKS, RetrieveExternalJWKS } from '@service/crypto/jwks';
import { LOCAL_RSA_KEYS } from '@service/utils/constants';


const scheduler = new QueueScheduler('routines');
const queue = new Queue('routines');
const worker = new Worker('routines', async (job: Job) => job.data.routine());

export async function StartRoutines(): Promise<void> {
    await queue.add('renew_local_keystore', { routine: async () => { try { await RenewLocalJWKS(LOCAL_RSA_KEYS) } catch { } } }, { repeat: { cron: '* 0 12 * * *' } });
    await queue.add('retrieve_external_keystores', { routine: async () => { try { await RetrieveExternalJWKS() } catch { } } }, { repeat: { cron: '* 0 12 * * *' } });
}