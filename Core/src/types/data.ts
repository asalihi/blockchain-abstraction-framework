import { Identifier } from './core';
import { Signature } from './crypto';

export type SignatureInformation = { 'value': Signature, 'key': Identifier };
export type EncryptionInformation = { 'key': Identifier };
export type RegisteredData = { 'identifier': Identifier, 'data': any, 'signature'?: SignatureInformation, 'encryption'?: EncryptionInformation, 'metadata'?: { [key: string]: any } }; // TODO: Set more specific format