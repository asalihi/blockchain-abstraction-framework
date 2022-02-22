import { Identifier } from '@core/types/types';

export type MessageSubject = string;
export type MessageIdentifier = Identifier;
export type Event = string;
export type Request = string;
export type MessageData = { [key: string]: any };

export enum MessageType {
    EVENT = 'event',
    REQUEST = 'request',
    RESPONSE = 'response'
};

export type MessageBase = { 'type': MessageType, 'subject': MessageSubject, 'identifier'?: MessageIdentifier, 'data'?: MessageData };

export enum EventLevel {
    INFO = 'info',
    SUCCESS = 'success',
    WARNING = 'warning',
    ERROR = 'error'
};

export enum Response {
    SUCCESS = 'success',
    FAILURE = 'failure'
};

export type EventMessage = MessageBase & { 'type': MessageType.EVENT, 'event': Event, 'level': EventLevel };
export type RequestMessage = MessageBase & { 'type': MessageType.REQUEST, 'action': Request };
export type ResponseMessage = MessageBase & { 'type': MessageType.RESPONSE, 'action': Request, 'response': Response };

export type Message = EventMessage | RequestMessage | ResponseMessage;