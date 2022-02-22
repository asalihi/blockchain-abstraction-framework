import { VerifiedExecutionCondition, StringCondition, StringShouldEqualReferenceCondition, StringShouldIncludeReferenceCondition, StringShouldBeIncludedInReferenceCondition, StringShouldBeIncludedInArrayOfStringsCondition, StringShouldNotBeIncludedInArrayOfStringsCondition, StringValidationUsingRegExpCondition } from "@core/types/types";

export function VerifyStringCondition(condition: StringCondition): VerifiedExecutionCondition {
    switch (condition['condition']) {
        case 'string-equals': {
            return VerifyIfStringEqualsCondition(condition as StringShouldEqualReferenceCondition);
        };
        case 'string-includes': {
            return VerifyIfStringIncludesCondition(condition as StringShouldIncludeReferenceCondition);
        };
        case 'string-is-included': {
            return VerifyIfStringIsIncludedCondition(condition as StringShouldBeIncludedInReferenceCondition);
        };
        case 'string-in-array': {
            return VerifyIfStringIsInArrayCondition(condition as StringShouldBeIncludedInArrayOfStringsCondition);
        };
        case 'string-not-in-array': {
            return VerifyIfStringIsNotInArrayCondition(condition as StringShouldNotBeIncludedInArrayOfStringsCondition);
        };
        case 'string-regex-validation': {
            return VerifyStringValidationUsingRegExpCondition(condition as StringValidationUsingRegExpCondition);
        };
        default: {
            throw new Error('Unrecognized string condition'); // TODO: Handle error
        };
    }
}

function VerifyIfStringEqualsCondition(condition: StringShouldEqualReferenceCondition): VerifiedExecutionCondition {
    const properties: typeof condition['properties'] = condition['properties'];

    if (!properties['string']?.['value'] || !properties['reference']?.['value']) {
        return Object.assign(condition, { validation: false, 'error': 'INVALID_PROPERTIES' });
    }

    const string_to_verify: string = properties['string']['value'];
    const reference: string = properties['reference']['value'];

    if (string_to_verify === reference) return Object.assign(condition, { validation: true });
    else return Object.assign(condition, { validation: false, 'error': 'STRING_IS_DIFFERENT_THAN_REFERENCE' });
}

function VerifyIfStringIncludesCondition(condition: StringShouldIncludeReferenceCondition): VerifiedExecutionCondition {
    const properties: typeof condition['properties'] = condition['properties'];

    if (!properties['string']?.['value'] || !properties['reference']?.['value']) {
        return Object.assign(condition, { validation: false, 'error': 'INVALID_PROPERTIES' });
    }

    const string_to_verify: string = properties['string']['value'];
    const reference: string = properties['reference']['value'];

    if (string_to_verify.includes(reference)) return Object.assign(condition, { validation: true });
    else return Object.assign(condition, { validation: false, 'error': 'REFERENCE_NOT_INCLUDED_IN_STRING' });
}

function VerifyIfStringIsIncludedCondition(condition: StringShouldBeIncludedInReferenceCondition): VerifiedExecutionCondition {
    const properties: typeof condition['properties'] = condition['properties'];

    if (!properties['string']?.['value'] || !properties['reference']?.['value']) {
        return Object.assign(condition, { validation: false, 'error': 'INVALID_PROPERTIES' });
    }

    const string_to_verify: string = properties['string']['value'];
    const reference: string = properties['reference']['value'];

    if (reference.includes(string_to_verify)) return Object.assign(condition, { validation: true });
    else return Object.assign(condition, { validation: false, 'error': 'STRING_NOT_INCLUDED_IN_REFERENCE' });
}

function VerifyIfStringIsInArrayCondition(condition: StringShouldBeIncludedInArrayOfStringsCondition): VerifiedExecutionCondition {
    const properties: typeof condition['properties'] = condition['properties'];

    if (!properties['string']?.['value'] || !(properties['array']?.['value'].length > 0)) {
        return Object.assign(condition, { validation: false, 'error': 'INVALID_PROPERTIES' });
    }

    const strict: boolean = (properties['strict']?.['value'] !== undefined) ? properties['strict']['value'] : true;

    const string_to_verify: string = properties['string']['value'];
    const array_of_references: string[] = properties['array']['value'];

    if (array_of_references.find((reference: string) => strict ? (reference === string_to_verify) : reference.includes(string_to_verify))) return Object.assign(condition, { validation: true });
    else return Object.assign(condition, { validation: false, 'error': 'STRING_NOT_INCLUDED_IN_ARRAY' });
}

function VerifyIfStringIsNotInArrayCondition(condition: StringShouldNotBeIncludedInArrayOfStringsCondition): VerifiedExecutionCondition {
    const properties: typeof condition['properties'] = condition['properties'];

    if (!properties['string']?.['value'] || !(properties['array']?.['value'].length > 0)) {
        return Object.assign(condition, { validation: false, 'error': 'INVALID_PROPERTIES' });
    }

    const strict: boolean = (properties['strict']?.['value'] !== undefined) ? properties['strict']['value'] : true;

    const string_to_verify: string = properties['string']['value'];
    const array_of_references: string[] = properties['array']['value'];

    if (array_of_references.every((reference: string) => strict ? (reference !== string_to_verify) : !reference.includes(string_to_verify))) return Object.assign(condition, { validation: true });
    else return Object.assign(condition, { validation: false, 'error': 'STRING_INCLUDED_IN_ARRAY' });
}

function VerifyStringValidationUsingRegExpCondition(condition: StringValidationUsingRegExpCondition): VerifiedExecutionCondition {
    const properties: typeof condition['properties'] = condition['properties'];

    if (!properties['string']?.['value'] || !(properties['regex']?.['value'].length > 0)) {
        return Object.assign(condition, { validation: false, 'error': 'INVALID_PROPERTIES' });
    }

    const match: boolean = (properties['match']?.['value'] !== undefined) ? properties['match']['value'] : true;

    const string_to_verify: string = properties['string']['value'];
    const regex: RegExp = new RegExp(properties['regex']['value']);
    const validation: boolean = regex.test(string_to_verify);

    if ((match && validation) || (!match && !validation)) return Object.assign(condition, { validation: true });
    else return Object.assign(condition, { validation: false, 'error': 'VALIDATION_USING_REGEX_FAILED' });
}