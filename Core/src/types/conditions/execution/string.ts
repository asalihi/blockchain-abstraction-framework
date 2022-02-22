import { DistributeAtLeastOnePropertyForKey, ConditionBase, SupportedPropertyType, SupportedPropertyTypeDefinition } from '@core/types/types';

export type StringAndReferenceConditionPropertiesDefinition = { 'string': SupportedPropertyTypeDefinition<string>, 'reference': SupportedPropertyTypeDefinition<string> };
export type StringAndReferenceConditionProperties = { 'string': SupportedPropertyType<string>, 'reference': SupportedPropertyType<string> };
export type StringShouldEqualReferenceConditionDefinition = ConditionBase & { 'condition': 'string-equals', 'properties': StringAndReferenceConditionPropertiesDefinition };
export type StringShouldEqualReferenceCondition = ConditionBase & { 'condition': 'string-equals', 'properties': StringAndReferenceConditionProperties };
export type StringShouldIncludeReferenceConditionDefinition = ConditionBase & { 'condition': 'string-includes', 'properties': StringAndReferenceConditionPropertiesDefinition };
export type StringShouldIncludeReferenceCondition = ConditionBase & { 'condition': 'string-includes', 'properties': StringAndReferenceConditionProperties };
export type StringShouldBeIncludedInReferenceConditionDefinition = ConditionBase & { 'condition': 'string-is-included', 'properties': StringAndReferenceConditionPropertiesDefinition };
export type StringShouldBeIncludedInReferenceCondition = ConditionBase & { 'condition': 'string-is-included', 'properties': StringAndReferenceConditionProperties };

export type StringAndArrayOfStringsConditionPropertiesDefinition = { 'strict'?: SupportedPropertyTypeDefinition<boolean>, 'string': SupportedPropertyTypeDefinition<string>, 'array': SupportedPropertyTypeDefinition<string[]> };
export type StringAndArrayOfStringsConditionProperties = { 'strict'?: SupportedPropertyType<boolean>, 'string': SupportedPropertyType<string>, 'array': SupportedPropertyType<string[]> };
export type StringShouldBeIncludedInArrayOfStringsConditionDefinition = ConditionBase & { 'condition': 'string-in-array', 'properties': StringAndArrayOfStringsConditionPropertiesDefinition };
export type StringShouldBeIncludedInArrayOfStringsCondition = ConditionBase & { 'condition': 'string-in-array', 'properties': StringAndArrayOfStringsConditionProperties };
export type StringShouldNotBeIncludedInArrayOfStringsConditionDefinition = ConditionBase & { 'condition': 'string-not-in-array', 'properties': StringAndArrayOfStringsConditionPropertiesDefinition };
export type StringShouldNotBeIncludedInArrayOfStringsCondition = ConditionBase & { 'condition': 'string-not-in-array', 'properties': StringAndArrayOfStringsConditionProperties };

export type StringValidationUsingRegExpConditionDefinition = ConditionBase & { 'condition': 'string-regex-validation', 'properties': { 'match'?: SupportedPropertyTypeDefinition<boolean>, 'string': SupportedPropertyTypeDefinition<string>, 'regex': SupportedPropertyTypeDefinition<string> } };
export type StringValidationUsingRegExpCondition = ConditionBase & { 'condition': 'string-regex-validation', 'properties': { 'match'?: SupportedPropertyType<boolean>, 'string': SupportedPropertyType<string>, 'regex': SupportedPropertyType<string> } };


export type StringConditionDefinition = StringShouldEqualReferenceConditionDefinition | StringShouldIncludeReferenceConditionDefinition | StringShouldBeIncludedInReferenceConditionDefinition | StringShouldBeIncludedInArrayOfStringsConditionDefinition | StringShouldNotBeIncludedInArrayOfStringsConditionDefinition | StringValidationUsingRegExpConditionDefinition;
export type StringCondition = StringShouldEqualReferenceCondition | StringShouldIncludeReferenceCondition | StringShouldBeIncludedInReferenceCondition | StringShouldBeIncludedInArrayOfStringsCondition | StringShouldNotBeIncludedInArrayOfStringsCondition | StringValidationUsingRegExpCondition;
export type PartialStringCondition = DistributeAtLeastOnePropertyForKey<StringConditionDefinition, 'properties'>;