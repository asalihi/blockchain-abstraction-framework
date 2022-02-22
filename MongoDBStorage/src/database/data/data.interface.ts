import { Identifier, SignatureInformation, EncryptionInformation } from 'core';

export interface IDataSchema {
    'identifier': Identifier,
    'data': any,
    'signature'?: SignatureInformation,
    'encryption'?: EncryptionInformation,
    'metadata'?: { [key: string]: any }
};