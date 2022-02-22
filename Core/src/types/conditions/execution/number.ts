import { DistributeAtLeastOnePropertyForKey, ConditionBase, SupportedPropertyType, SupportedPropertyTypeDefinition } from '@core/types/types';

export type ValueShouldBeGreaterOrLowerThanReferenceConditionPropertiesDefinition = { 'strict'?: SupportedPropertyTypeDefinition<boolean>, 'value': SupportedPropertyTypeDefinition<number>, 'reference': SupportedPropertyTypeDefinition<number> };
export type ValueShouldBeGreaterOrLowerThanReferenceConditionProperties = { 'strict'?: SupportedPropertyType<boolean>, 'value': SupportedPropertyType<number>, 'reference': SupportedPropertyType<number> };
export type ValueShouldBeGreaterThanReferenceConditionDefinition = ConditionBase & { 'condition': 'value-is-greater-than', 'properties': ValueShouldBeGreaterOrLowerThanReferenceConditionPropertiesDefinition };
export type ValueShouldBeGreaterThanReferenceCondition = ConditionBase & { 'condition': 'value-is-greater-than', 'properties': ValueShouldBeGreaterOrLowerThanReferenceConditionProperties };
export type ValueShouldBeLowerThanReferenceConditionDefinition = ConditionBase & { 'condition': 'value-is-lower-than', 'properties': ValueShouldBeGreaterOrLowerThanReferenceConditionPropertiesDefinition };
export type ValueShouldBeLowerThanReferenceCondition = ConditionBase & { 'condition': 'value-is-lower-than', 'properties': ValueShouldBeGreaterOrLowerThanReferenceConditionProperties };

export type ValueShouldBeBetweenReferencesConditionDefinition = ConditionBase & { 'condition': 'value-is-between', 'properties': { 'strict'?: SupportedPropertyTypeDefinition<boolean>, 'value': SupportedPropertyTypeDefinition<number>, 'lower': SupportedPropertyTypeDefinition<number>, 'upper': SupportedPropertyTypeDefinition<number> } };
export type ValueShouldBeBetweenReferencesCondition = ConditionBase & { 'condition': 'value-is-between', 'properties': { 'strict'?: SupportedPropertyType<boolean>, 'value': SupportedPropertyType<number>, 'lower': SupportedPropertyType<number>, 'upper': SupportedPropertyType<number> } };

export type ValueShouldEqualReferenceConditionDefinition = ConditionBase & { 'condition': 'value-equals', 'properties': { 'value': SupportedPropertyTypeDefinition<number>, 'reference': SupportedPropertyTypeDefinition<number> } };
export type ValueShouldEqualReferenceCondition = ConditionBase & { 'condition': 'value-equals', 'properties': { 'value': SupportedPropertyType<number>, 'reference': SupportedPropertyType<number> } };

export type ValueShouldBePositiveOrNegativeConditionPropertiesDefinition = { 'strict'?: SupportedPropertyTypeDefinition<boolean>, 'value': SupportedPropertyTypeDefinition<number> };
export type ValueShouldBePositiveOrNegativeConditionProperties = { 'strict'?: SupportedPropertyType<boolean>, 'value': SupportedPropertyType<number> };
export type ValueShouldBePositiveConditionDefinition = ConditionBase & { 'condition': 'value-is-positive', 'properties': ValueShouldBePositiveOrNegativeConditionPropertiesDefinition };
export type ValueShouldBePositiveCondition = ConditionBase & { 'condition': 'value-is-positive', 'properties': ValueShouldBePositiveOrNegativeConditionProperties };
export type ValueShouldBeNegativeConditionDefinition = ConditionBase & { 'condition': 'value-is-negative', 'properties': ValueShouldBePositiveOrNegativeConditionPropertiesDefinition };
export type ValueShouldBeNegativeCondition = ConditionBase & { 'condition': 'value-is-negative', 'properties': ValueShouldBePositiveOrNegativeConditionProperties };

export type VariationBetweenValueAndReferenceShouldBeGreaterOrLowerThanLimitConditionPropertiesDefinition = { 'strict'?: SupportedPropertyTypeDefinition<boolean>, 'value1': SupportedPropertyTypeDefinition<number>, 'value2': SupportedPropertyTypeDefinition<number>, 'variation': SupportedPropertyTypeDefinition<number> };
export type VariationBetweenValueAndReferenceShouldBeGreaterOrLowerThanLimitConditionProperties = { 'strict'?: SupportedPropertyType<boolean>, 'value1': SupportedPropertyType<number>, 'value2': SupportedPropertyType<number>, 'variation': SupportedPropertyType<number> };
export type VariationBetweenValueAndReferenceShouldBeGreaterThanLimitconditionDefinition = ConditionBase & { 'condition': 'variation-is-greater-than', 'properties': VariationBetweenValueAndReferenceShouldBeGreaterOrLowerThanLimitConditionPropertiesDefinition };
export type VariationBetweenValueAndReferenceShouldBeGreaterThanLimitcondition = ConditionBase & { 'condition': 'variation-is-greater-than', 'properties': VariationBetweenValueAndReferenceShouldBeGreaterOrLowerThanLimitConditionProperties };
export type VariationBetweenValueAndReferenceShouldBeLowerThanLimitconditionDefinition = ConditionBase & { 'condition': 'variation-is-lower-than', 'properties': VariationBetweenValueAndReferenceShouldBeGreaterOrLowerThanLimitConditionPropertiesDefinition };
export type VariationBetweenValueAndReferenceShouldBeLowerThanLimitcondition = ConditionBase & { 'condition': 'variation-is-lower-than', 'properties': VariationBetweenValueAndReferenceShouldBeGreaterOrLowerThanLimitConditionProperties };


export type NumberConditionDefinition = ValueShouldBeGreaterThanReferenceConditionDefinition | ValueShouldBeLowerThanReferenceConditionDefinition | ValueShouldBeBetweenReferencesConditionDefinition | ValueShouldEqualReferenceConditionDefinition | ValueShouldBePositiveConditionDefinition | ValueShouldBeNegativeConditionDefinition | VariationBetweenValueAndReferenceShouldBeGreaterThanLimitconditionDefinition | VariationBetweenValueAndReferenceShouldBeLowerThanLimitconditionDefinition;
export type NumberCondition = ValueShouldBeGreaterThanReferenceCondition | ValueShouldBeLowerThanReferenceCondition | ValueShouldBeBetweenReferencesCondition | ValueShouldEqualReferenceCondition | ValueShouldBePositiveCondition | ValueShouldBeNegativeCondition | VariationBetweenValueAndReferenceShouldBeGreaterThanLimitcondition | VariationBetweenValueAndReferenceShouldBeLowerThanLimitcondition;
export type PartialNumberCondition = DistributeAtLeastOnePropertyForKey<NumberConditionDefinition, 'properties'>;