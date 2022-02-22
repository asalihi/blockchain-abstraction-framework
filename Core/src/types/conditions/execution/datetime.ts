import { Duration } from 'date-fns';

import { DistributeAtLeastOnePropertyForKey, ConditionBase, SupportedPropertyTypeDefinition, SupportedPropertyType } from '@core/types/types';

/* DATE */
export type AcceptedDateType = number | string;
export type DateAndReferenceConditionPropertiesDefinition = { 'strict'?: SupportedPropertyTypeDefinition<boolean>, 'date': SupportedPropertyTypeDefinition<AcceptedDateType>, 'reference': SupportedPropertyTypeDefinition<AcceptedDateType> };
export type DateAndReferenceConditionProperties = { 'strict'?: SupportedPropertyType<boolean>, 'date': SupportedPropertyType<AcceptedDateType>, 'reference': SupportedPropertyType<AcceptedDateType> };

export type DateShouldBeBeforeOrAfterReferenceConditionPropertiesDefinition = DateAndReferenceConditionPropertiesDefinition;
export type DateShouldBeBeforeOrAfterReferenceConditionProperties = DateAndReferenceConditionProperties;
export type DateShouldBeBeforeReferenceConditionDefinition = ConditionBase & { 'condition': 'date-is-before', 'properties': DateShouldBeBeforeOrAfterReferenceConditionPropertiesDefinition };
export type DateShouldBeBeforeReferenceCondition = ConditionBase & { 'condition': 'date-is-before', 'properties': DateShouldBeBeforeOrAfterReferenceConditionProperties };
export type DateShouldBeAfterReferenceConditionDefinition = ConditionBase & { 'condition': 'date-is-after', 'properties': DateShouldBeBeforeOrAfterReferenceConditionPropertiesDefinition };
export type DateShouldBeAfterReferenceCondition = ConditionBase & { 'condition': 'date-is-after', 'properties': DateShouldBeBeforeOrAfterReferenceConditionProperties };

export type DateShouldBeBetweenReferencesConditionDefinition = ConditionBase & { 'condition': 'date-is-between', 'properties': { 'strict'?: SupportedPropertyTypeDefinition<boolean>, 'date': SupportedPropertyTypeDefinition<AcceptedDateType>, 'lower': SupportedPropertyTypeDefinition<AcceptedDateType>, 'upper': SupportedPropertyTypeDefinition<AcceptedDateType> } };
export type DateShouldBeBetweenReferencesCondition = ConditionBase & { 'condition': 'date-is-between', 'properties': { 'strict'?: SupportedPropertyType<boolean>, 'date': SupportedPropertyType<AcceptedDateType>, 'lower': SupportedPropertyType<AcceptedDateType>, 'upper': SupportedPropertyType<AcceptedDateType> } };

export type DateShouldEqualReferenceConditionDefinition = ConditionBase & { 'condition': 'date-equals', 'properties': DateAndReferenceConditionPropertiesDefinition };
export type DateShouldEqualReferenceCondition = ConditionBase & { 'condition': 'date-equals', 'properties': DateAndReferenceConditionProperties };

export type DayOfDateEqualsReferenceConditionDefinition = ConditionBase & { 'condition': 'day-equals', 'properties': DateAndReferenceConditionPropertiesDefinition };
export type DayOfDateEqualsReferenceCondition = ConditionBase & { 'condition': 'day-equals', 'properties': DateAndReferenceConditionProperties };
export type WeekDayOfDateEqualsReferenceConditionDefinition = ConditionBase & { 'condition': 'week-day-equals', 'properties': DateAndReferenceConditionPropertiesDefinition };
export type WeekDayOfDateEqualsReferenceCondition = ConditionBase & { 'condition': 'week-day-equals', 'properties': DateAndReferenceConditionProperties };
export type MonthOfDateEqualsReferenceConditionDefinition = ConditionBase & { 'condition': 'month-equals', 'properties': DateAndReferenceConditionPropertiesDefinition };
export type MonthOfDateEqualsReferenceCondition = ConditionBase & { 'condition': 'month-equals', 'properties': DateAndReferenceConditionProperties };
export type YearOfDateEqualsReferenceConditionDefinition = ConditionBase & { 'condition': 'year-equals', 'properties': DateAndReferenceConditionPropertiesDefinition };
export type YearOfDateEqualsReferenceCondition = ConditionBase & { 'condition': 'year-equals', 'properties': DateAndReferenceConditionProperties };

export type DateConditionDefinition = DateShouldBeBeforeReferenceConditionDefinition | DateShouldBeAfterReferenceConditionDefinition | DateShouldBeBetweenReferencesConditionDefinition | DateShouldEqualReferenceConditionDefinition | DayOfDateEqualsReferenceConditionDefinition | WeekDayOfDateEqualsReferenceConditionDefinition | MonthOfDateEqualsReferenceConditionDefinition | YearOfDateEqualsReferenceConditionDefinition;
export type DateCondition = DateShouldBeBeforeReferenceCondition | DateShouldBeAfterReferenceCondition | DateShouldBeBetweenReferencesCondition | DateShouldEqualReferenceCondition | DayOfDateEqualsReferenceCondition | WeekDayOfDateEqualsReferenceCondition | MonthOfDateEqualsReferenceCondition | YearOfDateEqualsReferenceCondition;
export type PartialDateCondition = DistributeAtLeastOnePropertyForKey<DateConditionDefinition, 'properties'>;


/* TIME */
export type AcceptedTimeType = number | string;
export type TimeAndReferenceConditionPropertiesDefinition = { 'strict'?: SupportedPropertyTypeDefinition<boolean>, 'date': SupportedPropertyTypeDefinition<AcceptedDateType>, 'reference': SupportedPropertyTypeDefinition<AcceptedTimeType> };
export type TimeAndReferenceConditionProperties = { 'strict'?: SupportedPropertyType<boolean>, 'date': SupportedPropertyType<AcceptedDateType>, 'reference': SupportedPropertyType<AcceptedTimeType> };

export type TimeShouldBeBeforeOrAfterReferenceConditionPropertiesDefinition = TimeAndReferenceConditionPropertiesDefinition;
export type TimeShouldBeBeforeOrAfterReferenceConditionProperties = TimeAndReferenceConditionProperties;
export type TimeShouldBeBeforeReferenceConditionDefinition = ConditionBase & { 'condition': 'time-is-before', 'properties': TimeShouldBeBeforeOrAfterReferenceConditionPropertiesDefinition };
export type TimeShouldBeBeforeReferenceCondition = ConditionBase & { 'condition': 'time-is-before', 'properties': TimeShouldBeBeforeOrAfterReferenceConditionProperties };
export type TimeShouldBeAfterReferenceConditionDefinition = ConditionBase & { 'condition': 'time-is-after', 'properties': TimeShouldBeBeforeOrAfterReferenceConditionPropertiesDefinition };
export type TimeShouldBeAfterReferenceCondition = ConditionBase & { 'condition': 'time-is-after', 'properties': TimeShouldBeBeforeOrAfterReferenceConditionProperties };

export type TimeShouldBeBetweenReferencesConditionDefinition = ConditionBase & { 'condition': 'time-is-between', 'properties': { 'strict'?: SupportedPropertyTypeDefinition<boolean>, 'date': SupportedPropertyTypeDefinition<AcceptedDateType>, 'lower': SupportedPropertyTypeDefinition<AcceptedTimeType>, 'upper': SupportedPropertyTypeDefinition<AcceptedTimeType> } };
export type TimeShouldBeBetweenReferencesCondition = ConditionBase & { 'condition': 'time-is-between', 'properties': { 'strict'?: SupportedPropertyType<boolean>, 'date': SupportedPropertyType<AcceptedDateType>, 'lower': SupportedPropertyType<AcceptedTimeType>, 'upper': SupportedPropertyType<AcceptedTimeType> } };

export type TimeShouldEqualReferenceConditionPropertiesDefinition = TimeAndReferenceConditionPropertiesDefinition & { 'precision'?: 'minute' | 'second' };
export type TimeShouldEqualReferenceConditionProperties = TimeAndReferenceConditionProperties & { 'precision'?: 'minute' | 'second' };
export type TimeShouldEqualReferenceConditionDefinition = ConditionBase & { 'condition': 'time-equals', 'properties': TimeShouldEqualReferenceConditionPropertiesDefinition };
export type TimeShouldEqualReferenceCondition = ConditionBase & { 'condition': 'time-equals', 'properties': TimeShouldEqualReferenceConditionProperties };

export type HoursOfTimeEqualReferenceConditionDefinition = ConditionBase & { 'condition': 'hours-equal', 'properties': TimeAndReferenceConditionPropertiesDefinition };
export type HoursOfTimeEqualReferenceCondition = ConditionBase & { 'condition': 'hours-equal', 'properties': TimeAndReferenceConditionProperties };
export type MinutesOfTimeEqualReferenceConditionDefinition = ConditionBase & { 'condition': 'minutes-equal', 'properties': TimeAndReferenceConditionPropertiesDefinition };
export type MinutesOfTimeEqualReferenceCondition = ConditionBase & { 'condition': 'minutes-equal', 'properties': TimeAndReferenceConditionProperties };
export type SecondsOfTimeEqualReferenceConditionDefinition = ConditionBase & { 'condition': 'seconds-equal', 'properties': TimeAndReferenceConditionPropertiesDefinition };
export type SecondsOfTimeEqualReferenceCondition = ConditionBase & { 'condition': 'seconds-equal', 'properties': TimeAndReferenceConditionProperties };

export type TimeConditionDefinition = TimeShouldBeBeforeReferenceConditionDefinition | TimeShouldBeAfterReferenceConditionDefinition | TimeShouldBeBetweenReferencesConditionDefinition | TimeShouldEqualReferenceConditionDefinition | HoursOfTimeEqualReferenceConditionDefinition | MinutesOfTimeEqualReferenceConditionDefinition | SecondsOfTimeEqualReferenceConditionDefinition;
export type TimeCondition = TimeShouldBeBeforeReferenceCondition | TimeShouldBeAfterReferenceCondition | TimeShouldBeBetweenReferencesCondition | TimeShouldEqualReferenceCondition | HoursOfTimeEqualReferenceCondition | MinutesOfTimeEqualReferenceCondition | SecondsOfTimeEqualReferenceCondition;
export type PartialTimeCondition = DistributeAtLeastOnePropertyForKey<TimeConditionDefinition, 'properties'>;


/* DATETIME */
export type AcceptedDatetimeType = number | string;
export type DatetimeAndReferenceConditionPropertiesDefinition = { 'date': SupportedPropertyTypeDefinition<AcceptedDateType>, 'reference': SupportedPropertyTypeDefinition<AcceptedDatetimeType> };
export type DatetimeAndReferenceConditionProperties = { 'date': SupportedPropertyType<AcceptedDateType>, 'reference': SupportedPropertyType<AcceptedDatetimeType> };

export type DatetimeShouldBeBeforeOrAfterReferenceConditionPropertiesDefinition = { 'strict'?: boolean } & DatetimeAndReferenceConditionPropertiesDefinition;
export type DatetimeShouldBeBeforeOrAfterReferenceConditionProperties = { 'strict'?: boolean } & DatetimeAndReferenceConditionProperties;
export type DatetimeShouldBeBeforeReferenceConditionDefinition = ConditionBase & { 'condition': 'datetime-is-before', 'properties': DatetimeShouldBeBeforeOrAfterReferenceConditionPropertiesDefinition };
export type DatetimeShouldBeBeforeReferenceCondition = ConditionBase & { 'condition': 'datetime-is-before', 'properties': DatetimeShouldBeBeforeOrAfterReferenceConditionProperties };
export type DatetimeShouldBeAfterReferenceConditionDefinition = ConditionBase & { 'condition': 'datetime-is-after', 'properties': DatetimeShouldBeBeforeOrAfterReferenceConditionPropertiesDefinition };
export type DatetimeShouldBeAfterReferenceCondition = ConditionBase & { 'condition': 'datetime-is-after', 'properties': DatetimeShouldBeBeforeOrAfterReferenceConditionProperties };

export type DatetimeShouldBeBetweenReferencesConditionDefinition = ConditionBase & { 'condition': 'datetime-is-between', 'properties': { 'strict'?: SupportedPropertyTypeDefinition<boolean>, 'date': SupportedPropertyTypeDefinition<AcceptedDatetimeType>, 'lower': SupportedPropertyTypeDefinition<AcceptedDatetimeType>, 'upper': SupportedPropertyTypeDefinition<AcceptedDatetimeType> } };
export type DatetimeShouldBeBetweenReferencesCondition = ConditionBase & { 'condition': 'datetime-is-between', 'properties': { 'strict'?: SupportedPropertyType<boolean>, 'date': SupportedPropertyType<AcceptedDatetimeType>, 'lower': SupportedPropertyType<AcceptedDatetimeType>, 'upper': SupportedPropertyType<AcceptedDatetimeType> } };

export type DatetimeShouldEqualReferenceConditionPropertiesDefinition = DatetimeAndReferenceConditionPropertiesDefinition & { 'precision'?: 'minute' | 'second' };
export type DatetimeShouldEqualReferenceConditionProperties = DatetimeAndReferenceConditionProperties & { 'precision'?: 'minute' | 'second' };
export type DatetimeShouldEqualReferenceConditionDefinition = ConditionBase & { 'condition': 'datetime-equals', 'properties': DatetimeShouldEqualReferenceConditionPropertiesDefinition };
export type DatetimeShouldEqualReferenceCondition = ConditionBase & { 'condition': 'datetime-equals', 'properties': DatetimeShouldEqualReferenceConditionProperties };

export type DatetimeConditionDefinition = DatetimeShouldBeBeforeReferenceConditionDefinition | DatetimeShouldBeAfterReferenceConditionDefinition | DatetimeShouldBeBetweenReferencesConditionDefinition | DatetimeShouldEqualReferenceConditionDefinition;
export type DatetimeCondition = DatetimeShouldBeBeforeReferenceCondition | DatetimeShouldBeAfterReferenceCondition | DatetimeShouldBeBetweenReferencesCondition | DatetimeShouldEqualReferenceCondition;
export type PartialDatetimeCondition = DistributeAtLeastOnePropertyForKey<DatetimeConditionDefinition, 'properties'>;


/* DURATION */
export type Date1andDate2ConditionPropertiesDefinition = { 'strict'?: SupportedPropertyTypeDefinition<boolean>, 'date1': SupportedPropertyTypeDefinition<AcceptedDateType>, 'date2': SupportedPropertyTypeDefinition<AcceptedDateType> };
export type DatesAndDurationConditionPropertiesDefinition = Date1andDate2ConditionPropertiesDefinition & { 'duration': Duration };
export type Date1andDate2ConditionProperties = { 'strict'?: SupportedPropertyType<boolean>, 'date1': SupportedPropertyType<AcceptedDateType>, 'date2': SupportedPropertyType<AcceptedDateType> };
export type DatesAndDurationConditionProperties = Date1andDate2ConditionProperties & { 'duration': Duration };
export type DurationBetweenDatesShouldEqualProvidedDurationConditionDefinition = ConditionBase & { 'condition': 'duration-between-dates-equals', 'properties': DatesAndDurationConditionPropertiesDefinition };
export type DurationBetweenDatesShouldEqualProvidedDurationCondition = ConditionBase & { 'condition': 'duration-between-dates-equals', 'properties': DatesAndDurationConditionProperties };
export type DurationBetweenDatesShouldBeLowerThanProvidedDurationConditionDefinition = ConditionBase & { 'condition': 'duration-between-dates-is-lower-than', 'properties': DatesAndDurationConditionPropertiesDefinition };
export type DurationBetweenDatesShouldBeLowerThanProvidedDurationCondition = ConditionBase & { 'condition': 'duration-between-dates-is-lower-than', 'properties': DatesAndDurationConditionProperties };
export type DurationBetweenDatesShouldBeHigherThanProvidedDurationConditionDefinition = ConditionBase & { 'condition': 'duration-between-dates-is-higher-than', 'properties': DatesAndDurationConditionPropertiesDefinition };
export type DurationBetweenDatesShouldBeHigherThanProvidedDurationCondition = ConditionBase & { 'condition': 'duration-between-dates-is-higher-than', 'properties': DatesAndDurationConditionProperties };

export type DurationConditionDefinition = DurationBetweenDatesShouldEqualProvidedDurationConditionDefinition | DurationBetweenDatesShouldBeLowerThanProvidedDurationConditionDefinition | DurationBetweenDatesShouldBeHigherThanProvidedDurationConditionDefinition;
export type DurationCondition = DurationBetweenDatesShouldEqualProvidedDurationCondition | DurationBetweenDatesShouldBeLowerThanProvidedDurationCondition | DurationBetweenDatesShouldBeHigherThanProvidedDurationCondition;
export type PartialDurationCondition = DistributeAtLeastOnePropertyForKey<DurationCondition, 'properties'>;
