import { VerifiedExecutionCondition, NumberCondition, ValueShouldBeGreaterThanReferenceCondition, ValueShouldBeLowerThanReferenceCondition, ValueShouldBeBetweenReferencesCondition, ValueShouldEqualReferenceCondition, ValueShouldBePositiveCondition, ValueShouldBeNegativeCondition, VariationBetweenValueAndReferenceShouldBeGreaterThanLimitcondition, VariationBetweenValueAndReferenceShouldBeLowerThanLimitcondition } from "@core/types/types";

// Some functions share similar code but for readibility, we do not merge shared code

export function VerifyNumberCondition(condition: NumberCondition): VerifiedExecutionCondition {
    switch (condition['condition']) {
        case 'value-is-greater-than': {
            return VerifyIfValueIsGreaterCondition(condition as ValueShouldBeGreaterThanReferenceCondition);
        };
        case 'value-is-lower-than': {
            return VerifyIfValueIsLowerCondition(condition as ValueShouldBeLowerThanReferenceCondition);
        };
        case 'value-is-between': {
            return VerifyIfValueIsBetweenCondition(condition as ValueShouldBeBetweenReferencesCondition);
        };
        case 'value-equals': {
            return VerifyIfValueEqualsCondition(condition as ValueShouldEqualReferenceCondition);
        };
        case 'value-is-positive': {
            return VerifyIfValueIsPositiveCondition(condition as ValueShouldBePositiveCondition);
        };
        case 'value-is-negative': {
            return VerifyIfValueIsNegativeCondition(condition as ValueShouldBeNegativeCondition);
        };
        case 'variation-is-greater-than': {
            return VerifyIfVariationIsGreaterCondition(condition as VariationBetweenValueAndReferenceShouldBeGreaterThanLimitcondition);
        };
        case 'variation-is-lower-than': {
            return VerifyIfVariationIsLowerCondition(condition as VariationBetweenValueAndReferenceShouldBeLowerThanLimitcondition);
        };
        default: {
            throw new Error('Unrecognized number condition'); // TODO: Handle error
        };
    }
}

export function VerifyIfValueIsGreaterCondition(condition: ValueShouldBeGreaterThanReferenceCondition): VerifiedExecutionCondition {
    const properties: typeof condition['properties'] = condition['properties'];

    if (!properties['value']?.['value'] || !properties['reference']?.['value']) {
        return Object.assign(condition, { validation: false, 'error': 'INVALID_PROPERTIES' });
    }

    const strict: boolean = (properties['strict']?.['value'] !== undefined) ? properties['strict']['value'] : false;

    const value: number = properties['value']['value'];
    const reference: number = properties['reference']['value'];

    const difference: number = value - reference;

    if (((difference > 0) && strict) || ((difference >= 0) && !strict)) return Object.assign(condition, { validation: true });
    else return Object.assign(condition, { validation: false, 'error': 'VALUE_NOT_GREATER_THAN_REFERENCE' });
}

export function VerifyIfValueIsLowerCondition(condition: ValueShouldBeLowerThanReferenceCondition): VerifiedExecutionCondition {
    const properties: typeof condition['properties'] = condition['properties'];

    if (!properties['value']?.['value'] || !properties['reference']?.['value']) {
        return Object.assign(condition, { validation: false, 'error': 'INVALID_PROPERTIES' });
    }

    const strict: boolean = (properties['strict']?.['value'] !== undefined) ? properties['strict']['value'] : false;

    const value: number = properties['value']['value'];
    const reference: number = properties['reference']['value'];

    const difference: number = value - reference;

    if (((difference < 0) && strict) || ((difference <= 0) && !strict)) return Object.assign(condition, { validation: true });
    else return Object.assign(condition, { validation: false, 'error': 'VALUE_NOT_LOWER_THAN_REFERENCE' });
}

export function VerifyIfValueIsBetweenCondition(condition: ValueShouldBeBetweenReferencesCondition): VerifiedExecutionCondition {
    const properties: typeof condition['properties'] = condition['properties'];

    if (!properties['value']?.['value'] || !properties['lower']?.['value'] || !properties['upper']?.['value']) {
        return Object.assign(condition, { validation: false, 'error': 'INVALID_PROPERTIES' });
    }

    const strict: boolean = (properties['strict']?.['value'] !== undefined) ? properties['strict']['value'] : false;

    const value: number = properties['value']['value'];
    const lower: number = properties['lower']['value'];
    const upper: number = properties['upper']['value'];

    const difference_between_value_and_lower_limit: number = value - lower;
    const difference_between_value_and_upper_limit: number = value - upper;

    if (!strict) {
        if ((difference_between_value_and_lower_limit >= 0) && (difference_between_value_and_upper_limit <= 0)) return Object.assign(condition, { validation: true });
        else return Object.assign(condition, { validation: false, 'error': 'VALUE_NOT_BETWEEN_REFERENCES' });
    } else {
        if ((difference_between_value_and_lower_limit > 0) && (difference_between_value_and_upper_limit < 0)) return Object.assign(condition, { validation: true });
        else return Object.assign(condition, { validation: false, 'error': 'VALUE_NOT_BETWEEN_REFERENCES' });
    }
}

export function VerifyIfValueEqualsCondition(condition: ValueShouldEqualReferenceCondition): VerifiedExecutionCondition {
    const properties: typeof condition['properties'] = condition['properties'];

    if (!properties['value']?.['value'] || !properties['reference']?.['value']) {
        return Object.assign(condition, { validation: false, 'error': 'INVALID_PROPERTIES' });
    }

    const value: number = properties['value']['value'];
    const reference: number = properties['value']['value'];

    const difference: number = value - reference;

    if (difference === 0) return Object.assign(condition, { validation: true });
    else return Object.assign(condition, { validation: false, 'error': 'VALUE_DIFFERENT_THAN_REFERENCE' });
}

export function VerifyIfValueIsPositiveCondition(condition: ValueShouldBePositiveCondition): VerifiedExecutionCondition {
    const properties: typeof condition['properties'] = condition['properties'];

    if (!properties['value']?.['value']) {
        return Object.assign(condition, { validation: false, 'error': 'INVALID_PROPERTIES' });
    }

    const strict: boolean = (properties['strict']?.['value'] !== undefined) ? properties['strict']['value'] : false;

    const value: number = properties['value']['value'];

    if (((value > 0) && strict) || ((value >= 0) && !strict)) return Object.assign(condition, { validation: true });
    else return Object.assign(condition, { validation: false, 'error': 'VALUE_NOT_POSITIVE' });
}

export function VerifyIfValueIsNegativeCondition(condition: ValueShouldBeNegativeCondition): VerifiedExecutionCondition {
    const properties: typeof condition['properties'] = condition['properties'];

    if (!properties['value']?.['value']) {
        return Object.assign(condition, { validation: false, 'error': 'INVALID_PROPERTIES' });
    }

    const strict: boolean = (properties['strict']?.['value'] !== undefined) ? properties['strict']['value'] : false;

    const value: number = properties['value']['value'];

    if (((value < 0) && strict) || ((value <= 0) && !strict)) return Object.assign(condition, { validation: true });
    else return Object.assign(condition, { validation: false, 'error': 'VALUE_NOT_NEGATIVE' });
}

function VerifyIfVariationIsGreaterCondition(condition: VariationBetweenValueAndReferenceShouldBeGreaterThanLimitcondition): VerifiedExecutionCondition {
    const properties: typeof condition['properties'] = condition['properties'];

    if (!properties['value1']?.['value'] || !properties['value2']?.['value'] || !(properties['variation']?.['value'] >= 0)) {
        return Object.assign(condition, { validation: false, 'error': 'INVALID_PROPERTIES' });
    }

    const strict: boolean = (properties['strict']?.['value'] !== undefined) ? properties['strict']['value'] : false;

    const value1: number = properties['value1']['value'];
    const value2: number = properties['value2']['value'];
    const variation: number = properties['variation']['value'];

    const absolute_difference: number = Math.abs(value1 - value2);

    if (((absolute_difference > variation) && strict) || ((absolute_difference >= variation) && !strict)) return Object.assign(condition, { validation: true });
    else return Object.assign(condition, { validation: false, 'error': 'VARIATION_BETWEEN_VALUE_LOWER_THAN_LIMIT' });
}

function VerifyIfVariationIsLowerCondition(condition: VariationBetweenValueAndReferenceShouldBeLowerThanLimitcondition): VerifiedExecutionCondition {
    const properties: typeof condition['properties'] = condition['properties'];

    if (!properties['value1']?.['value'] || !properties['value2']?.['value'] || !(properties['variation']?.['value'] >= 0)) {
        return Object.assign(condition, { validation: false, 'error': 'INVALID_PROPERTIES' });
    }

    const strict: boolean = (properties['strict']?.['value'] !== undefined) ? properties['strict']['value'] : false;

    const value1: number = properties['value1']['value'];
    const value2: number = properties['value2']['value'];
    const variation: number = properties['variation']['value'];

    const absolute_difference: number = Math.abs(value1 - value2);

    if (((absolute_difference < variation) && strict) || ((absolute_difference <= variation) && !strict)) return Object.assign(condition, { validation: true });
    else return Object.assign(condition, { validation: false, 'error': 'VARIATION_BETWEEN_VALUE_GREATER_THAN_LIMIT' });
}