import { DistributeAtLeastOnePropertyForKey, Identifier, Signature, ConditionBase, SupportedPropertyTypeDefinition, SupportedPropertyType } from '@core/types/types';

/* Hash */
export type HashOfDataShouldEqualsReferenceConditionDefinition = ConditionBase & { 'condition': 'hash-equals', 'properties': { 'hash': SupportedPropertyTypeDefinition<string>, 'data': SupportedPropertyTypeDefinition<string | Object>, 'salt'?: SupportedPropertyTypeDefinition<string> } };
export type HashOfDataShouldEqualsReferenceCondition = ConditionBase & { 'condition': 'hash-equals', 'properties': { 'hash': SupportedPropertyType<string>, 'data': SupportedPropertyType<string | Object>, 'salt'?: SupportedPropertyType<string> } };


/* Signatures */
// TODO URGENT: For the following conditions, we should 1. declare as a contract that the signature should be a JWS, where the signed payload is the SHA256 of data 2. probably offer the possibility to define a salt used when hashing data
export type SignatureIsValidConditionDefinition = ConditionBase & { 'condition': 'signature-is-valid', 'properties': { 'signature': SupportedPropertyTypeDefinition<Signature>, 'data': SupportedPropertyTypeDefinition<string | Object>, 'key': SupportedPropertyTypeDefinition<Identifier> } };
export type SignatureIsValidCondition = ConditionBase & { 'condition': 'signature-is-valid', 'properties': { 'signature': SupportedPropertyType<Signature>, 'data': SupportedPropertyType<string | Object>, 'key': SupportedPropertyType<Identifier> } };

export type SignatureIsGeneratedUsingOneOfProvidedKeysConditionDefinition = ConditionBase & { 'condition': 'valid-signature-using-one-of', 'properties': { 'signature': SupportedPropertyTypeDefinition<Signature>, 'data': SupportedPropertyTypeDefinition<string | Object>, 'keys': SupportedPropertyTypeDefinition<Identifier[]> } };
export type SignatureIsGeneratedUsingOneOfProvidedKeysCondition = ConditionBase & { 'condition': 'valid-signature-using-one-of', 'properties': { 'signature': SupportedPropertyType<Signature>, 'data': SupportedPropertyType<string | Object>, 'keys': SupportedPropertyType<Identifier[]> } };

export type AtLeastXSignaturesUsingProvidedKeysConditionDefinition = ConditionBase & { 'condition': 'multiple-valid-signatures', 'properties': { 'signatures': SupportedPropertyTypeDefinition<{ 'signature': Signature, 'key': Identifier }[]>, 'data': SupportedPropertyTypeDefinition<string | Object>, 'threshold': SupportedPropertyTypeDefinition<number> } };
export type AtLeastXSignaturesUsingProvidedKeysCondition = ConditionBase & { 'condition': 'multiple-valid-signatures', 'properties': { 'signatures': SupportedPropertyType<{ 'signature': Signature, 'key': Identifier }[]>, 'data': SupportedPropertyType<string | Object>, 'threshold': SupportedPropertyType<number> } };


export type CryptographyConditionDefinition = HashOfDataShouldEqualsReferenceConditionDefinition | SignatureIsValidConditionDefinition | SignatureIsGeneratedUsingOneOfProvidedKeysConditionDefinition | AtLeastXSignaturesUsingProvidedKeysConditionDefinition;
export type CryptographyCondition = HashOfDataShouldEqualsReferenceCondition | SignatureIsValidCondition | SignatureIsGeneratedUsingOneOfProvidedKeysCondition | AtLeastXSignaturesUsingProvidedKeysCondition;
export type PartialCryptographyCondition = DistributeAtLeastOnePropertyForKey<CryptographyConditionDefinition, 'properties'>;