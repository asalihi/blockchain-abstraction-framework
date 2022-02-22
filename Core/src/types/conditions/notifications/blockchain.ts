import { DLTSelectionCriteria, MatchOrDifferCondition, IncludeOrExcludeCondition, RecursivePartial, DescriptionOfConditions } from "@core/types/types";

export type BlockchainPlatformConditionBase = { 'subject': 'platform' };
export type BlockchainPlatformIdentifierCondition = { 'identifier': string | 'all', 'condition': MatchOrDifferCondition };
export type BlockchainPlatformIdentifiersCondition = { 'identifiers': string[], 'condition': IncludeOrExcludeCondition };
export type BlockchainPlatformTypeCondition = { 'type': string | 'all', 'condition': MatchOrDifferCondition };
export type BlockchainPlatformCriteriaCondition = { 'criteria': RecursivePartial<DLTSelectionCriteria>, 'condition': MatchOrDifferCondition };

export type BlockchainPlatformCondition = BlockchainPlatformConditionBase & (BlockchainPlatformIdentifierCondition | BlockchainPlatformIdentifiersCondition | BlockchainPlatformTypeCondition | BlockchainPlatformCriteriaCondition);
export type BlockchainConditionProperties = BlockchainPlatformCondition;

// TODO: Move and change content (add more details to allow validation)
export const DESCRIPTION_OF_BLOCKCHAIN_PLATFORM_CONDITIONS: DescriptionOfConditions = [
    {
        'condition': 'blockchain-platform-identifier-equals-value-or-not',
        'name': 'Platform identifier equals to/differ from value',
        'description': 'This condition checks if a platform identifier equals to/differs from one provided',
        'properties': [
            {
                'key': 'subject',
                'type': 'string',
                'values': ['platform'],
                'description': 'The subject on which this condition applies'
            },
            {
                'key': 'identifier',
                'type': 'string',
                'values': ['<identifier>', 'all'],
                'description': 'The identifier of the platform to apply the condition against (or \'all\' if condition applies to all platforms)'
            },
            {
                'key': 'condition',
                'type': 'string',
                'values': ['match', 'differ'],
                'description': 'How the condition applies (match if it should check for equality on identifier, differ to select all platforms but the one matching provided identifier)'
            }
        ]
    },
    {
        'condition': 'blockchain-platform-list-identifiers-includes-value-or-not',
        'name': 'Platform identifier is included in/excluded from array of values',
        'description': 'This condition checks if a platform type is included in/excluded from list of identifiers provided',
        'properties': [
            {
                'key': 'subject',
                'type': 'string',
                'values': ['platform'],
                'description': 'The subject on which this condition applies'
            },
            {
                'key': 'identifiers',
                'type': 'string[]',
                'values': ['<identifier>[]'],
                'description': 'The list of identifiers to apply the condition against'
            },
            {
                'key': 'condition',
                'type': 'string',
                'values': ['include', 'exclude'],
                'description': 'How the condition applies (include if it should check for inclusion of an identifier inside the provided values, exclude to select all platforms but the ones being included in provided list of identifiers)'
            }
        ]
    },
    {
        'condition': 'blockchain-platform-type-equals-value-or-not',
        'name': 'Platform type equals/differs from value',
        'description': 'This condition checks if a platform type equals/differs from one provided',
        'properties': [
            {
                'key': 'subject',
                'type': 'string',
                'values': ['platform'],
                'description': 'The subject on which this condition applies'
            },
            {
                'key': 'platform',
                'type': 'string',
                'values': ['<supported type>', 'all'],
                'description': 'The type of the platform to apply the condition against (or \'all\' if condition applies to all platforms)'
            },
            {
                'key': 'condition',
                'type': 'string',
                'values': ['match', 'differ'],
                'description': 'How the condition applies (match if it should check for equality on type, differ to select all platforms but ones whose type matches the provided type)'
            }
        ]
    },
    {
        'condition': 'blockchain-platform-criteria-equal-provided-set-or-not',
        'name': 'Platform criteria match with/differ from set of provided criteria',
        'description': 'This condition checks if a platform identifier is equals to one provided',
        'properties': [
            {
                'key': 'subject',
                'type': 'string',
                'values': ['platform'],
                'description': 'The subject on which this condition applies'
            },
            {
                'key': 'criteria',
                'type': 'set of criteria', // TODO: Be more precise
                'values': ['<criteria>'],
                'description': 'The set of criteria to be considered within the condition'
            },
            {
                'key': 'condition',
                'type': 'string',
                'values': ['match', 'differ'],
                'description': 'How the condition applies (match if it should check for equality on type, differ to select all platforms but ones whose type matches the provided type)'
            }
        ]
    }
];