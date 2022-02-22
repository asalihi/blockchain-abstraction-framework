import { MATCH_OR_DIFFER_CONDITION_VALUES, INCLUDE_OR_EXCLUDE_CONDITION_VALUES, SUPPORTED_NOTIFICATION_CONDITION_VALUES } from '@core/constants/constants';
import { ConditionBase } from '@core/types/types';

export type MatchOrDifferCondition = typeof MATCH_OR_DIFFER_CONDITION_VALUES[number];
export type IncludeOrExcludeCondition = typeof INCLUDE_OR_EXCLUDE_CONDITION_VALUES[number];
export type SupportedNotificationCondition = typeof SUPPORTED_NOTIFICATION_CONDITION_VALUES[number];

export type NotificationCondition = ConditionBase & { 'condition': SupportedNotificationCondition };

export * from './blockchain';