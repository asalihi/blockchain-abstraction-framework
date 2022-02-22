import { HTTPEndpoint, Identifier, Message } from '@core/types/types';

export type NotificationIssuer = { 'platform': Identifier, 'route': Identifier };
export type NotificationAudience = { 'platform': Identifier, 'route': Identifier };

export type NotificationSignatureParameters = { 'jwks': HTTPEndpoint, 'key': Identifier, 'value': string };

export type Notification = {
    'identifier': Identifier,
    'timestamp': number,
    'issuer': NotificationIssuer,
    'audience': NotificationAudience,
    'signature'?: NotificationSignatureParameters,
    'message': Message
};

export type NotificationOptions = { signature: boolean, route: string };