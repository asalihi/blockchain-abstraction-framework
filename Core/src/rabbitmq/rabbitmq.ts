import { Connection, Channel, ConsumeMessage, connect } from 'amqplib';
import config from 'config';

import { ConnectionFailed } from '@core/errors/errors';
import { Identifier, Message, Notification, Nullable } from '@core/types/types';

export const QUEUE_CONNECTION_STRING: string = `${config.get('queue.protocol')}://${config.get('queue.user')}:${config.get('queue.password')}@${config.get('queue.host')}:${config.get('queue.port')}/${config.get('queue.vhost')}`;

export async function CreateChannel(connection_string?: string): Promise<Channel> {
    try {
        const connection: Connection = await connect(connection_string ?? QUEUE_CONNECTION_STRING);
        return await connection.createChannel();
    } catch (error) {
        throw new ConnectionFailed(connection_string ?? QUEUE_CONNECTION_STRING);
    }
}

export async function RegisterConsumer(channel: Channel, exchange: Identifier, pattern: string, handler: (message: Message) => Promise<any>): Promise<void> {
    const { queue } = await channel.assertQueue('', { exclusive: true, durable: false, autoDelete: true });

    channel.bindQueue(queue, exchange, pattern);
    channel.consume(queue, async (message: Nullable<ConsumeMessage>) => {
        if (message) {
            const content: Message = JSON.parse(message.content.toString());
            await handler(content);
            channel.ack(message);
        }
    });
}

export async function SendMessage(channel: Channel, exchange: Identifier, notification: Notification, routing_key?: string): Promise<boolean> {
    return channel.publish(exchange, routing_key ?? config.get('queue.routing_key'), Buffer.from(JSON.stringify(notification)));
}