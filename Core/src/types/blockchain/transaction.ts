import { GenericObject, Identifier, Timestamp, DLTIdentity } from '@core/types/types';

export type TransactionHeader = { identifier: Identifier, signature: string, date: Timestamp, metadata?: GenericObject };
export type InternalTransactionTransferIdentity = DLTIdentity;
export type ExternalTransactionTransferIdentity = GenericObject;
export type TransactionTransferIdentity = InternalTransactionTransferIdentity | ExternalTransactionTransferIdentity;;
export type TransferParticipants = { count: number, initiators?: TransactionTransferIdentity[], metadata?: GenericObject };
export type TransactionTransfer = { from: TransferParticipants, to: TransferParticipants, amount?: number, metadata?: GenericObject };
export type TransactionTransfers = TransactionTransfer[];
export type TransactionInformation = { data?: ArrayBuffer, reference?: string[] };
export type TransactionBody = { transfers?: TransactionTransfers, information?: TransactionInformation };
export type Transaction = TransactionHeader & TransactionBody;
