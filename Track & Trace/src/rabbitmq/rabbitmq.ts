import { Channel } from 'amqplib';
import config from 'config';

import { QUEUE_CONNECTION_STRING, CreateChannel, RegisterConsumer } from 'core';
import { HandleReceivedMessage } from '@service/controllers/controller';

export async function InitializeMessageQueue(): Promise<void> {
    const channel: Channel = await CreateChannel(QUEUE_CONNECTION_STRING);
    await RegisterConsumer(channel, config.get('queue.exchange'), config.get('queue.routing_key'), HandleReceivedMessage);
}