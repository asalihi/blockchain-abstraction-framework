import { ComputeSHA256, VerifySignature } from '@core/crypto/crypto';
import { Maybe, Identifier, Signature, VerifiedExecutionCondition, CryptographyCondition, HashOfDataShouldEqualsReferenceCondition, SignatureIsValidCondition, SignatureIsGeneratedUsingOneOfProvidedKeysCondition, AtLeastXSignaturesUsingProvidedKeysCondition } from '@core/types/types';

export function VerifyCryptographyCondition(condition: CryptographyCondition): VerifiedExecutionCondition {
    switch (condition['condition']) {
        case 'hash-equals': {
            return VerifyHashEqualsCondition(condition as HashOfDataShouldEqualsReferenceCondition);
        }
        case 'signature-is-valid': {
            return VerifySignatureIsValidCondition(condition as SignatureIsValidCondition);
        }
        case 'valid-signature-using-one-of': {
            return VerifySignatureIsGeneratedUsingOneOfProvidedKeysCondition(condition as SignatureIsGeneratedUsingOneOfProvidedKeysCondition);
        }
        case 'multiple-valid-signatures': {
            return VerifyAtLeastXSignaturesUsingProvidedKeysCondition(condition as AtLeastXSignaturesUsingProvidedKeysCondition);
        }
        default: {
            throw new Error('Unrecognized cryptography condition'); // TODO: Handle error
        }
    }
}

function VerifyHashEqualsCondition(condition: HashOfDataShouldEqualsReferenceCondition): VerifiedExecutionCondition {
    const properties: typeof condition['properties'] = condition['properties'];

    if (!properties['hash']?.['value'] || !properties['data']?.['value']) {
        return Object.assign(condition, { validation: false, 'error': 'INVALID_PROPERTIES' });
    }

    const hash: string = properties['hash']['value'];
    const data: string = (properties['data']['value'] instanceof Object) ? JSON.stringify(properties['data']['value']) : properties['data']['value'];
    const salt: Maybe<string> = properties['salt']?.['value'];

    const validated: boolean = ComputeSHA256(data, salt) === hash;
    return Object.assign(condition, { validation: validated, ...(!validated && { 'error': 'HASH_VERIFICATION_FAILED' }) });
}

// TODO URGENT: Review verification for the two following functions (keys should be fetched from users and identities and not from local store)
function VerifySignatureIsValidCondition(condition: SignatureIsValidCondition): VerifiedExecutionCondition {
    const properties: typeof condition['properties'] = condition['properties'];

    if (!properties['signature']?.['value'] || !properties['data']?.['value'] || !properties['key']?.['value']) {
        return Object.assign(condition, { validation: false, 'error': 'INVALID_PROPERTIES' });
    }

    const signature: Signature = properties['signature']['value'];
    const hashed_data = ComputeSHA256(properties['data']['value']);
    const key: Identifier = properties['key']['value'];
    try {
        const payload: string = VerifySignature(signature, key);

        if (payload === hashed_data) return Object.assign(condition, { validation: true });
        else return Object.assign(condition, { validation: false, 'error': 'HASH_COMPARISON_FAILED' });
    } catch {
        return Object.assign(condition, { validation: false, 'error': 'SIGNATURE_VERIFICATION_FAILED' });
    }
}

function VerifySignatureIsGeneratedUsingOneOfProvidedKeysCondition(condition: SignatureIsGeneratedUsingOneOfProvidedKeysCondition): VerifiedExecutionCondition {
    const properties: typeof condition['properties'] = condition['properties'];

    if (!properties['signature']?.['value'] || !properties['data']?.['value'] || !(properties['keys']?.['value']?.length > 0)) {
        return Object.assign(condition, { validation: false, 'error': 'INVALID_PROPERTIES' });
    }

    const signature: Signature = properties['signature']['value'];
    const hashed_data = ComputeSHA256(properties['data']['value']);
    const keys: Identifier[] = properties['keys']['value'];

    for (const key of keys) {
        try {
            const payload: string = VerifySignature(signature, key);

            if (payload === hashed_data) return Object.assign(condition, { validation: true });
            else return Object.assign(condition, { validation: false, 'error': 'HASH_COMPARISON_FAILED' });
        } catch {
            continue;  
        }
    }

    return Object.assign(condition, { validation: false, 'error': 'SIGNATURE_VERIFICATION_FAILED' });
}

function VerifyAtLeastXSignaturesUsingProvidedKeysCondition(condition: AtLeastXSignaturesUsingProvidedKeysCondition): VerifiedExecutionCondition {
    const properties: typeof condition['properties'] = condition['properties'];

    if (!properties['threshold']?.['value'] || !properties['data']?.['value'] || (properties['signatures']?.['value']?.length > 0) || !(properties['signatures']?.['value']?.length > properties['threshold']['value'])) {
        return Object.assign(condition, { validation: false, 'error': 'INVALID_PROPERTIES' });
    }

    const signatures: { 'signature': Signature, 'key': Identifier }[] = properties['signatures']['value'];
    const hashed_data = ComputeSHA256(properties['data']['value']);
    const threshold: number = properties['threshold']['value'];

    let verified: number = 0;
    for (const signature of signatures) {
        try {
            if (verified >= threshold) break;

            const payload: string = VerifySignature(signature['signature'], signature['key']);
            if (payload === hashed_data) verified++;
        } catch {
            continue;
        }
    }

    if (verified >= threshold) return Object.assign(condition, { validation: true });
    else return Object.assign(condition, { validation: false, 'error': 'THRESHOLD_OF_SIGNATURES_NOT_REACHED' });
}