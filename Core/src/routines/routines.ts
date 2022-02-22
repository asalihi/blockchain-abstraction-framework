import { Job, Queue, QueueScheduler, Worker } from 'bullmq';

import { Routine } from '@core/types/types';

/* TODO IMMEDIATELY: UNCOMMENT
const scheduler = new QueueScheduler('routines');
const queue = new Queue('routines');
const worker = new Worker('routines', async (job: Job) => job.data.routine());
*/

export async function StartRoutines(routines: Routine[]): Promise<void> {
    /* TODO IMMEDIATELY: UNCOMMENT
    const promises: Promise<Job<any, any, string>>[] = [];

    for (const r of routines) promises.push(queue.add(r['identifier'], { routine: r['fn'] }, { repeat: { cron: r['cron'] } }));
    await Promise.all(promises);
    */
}