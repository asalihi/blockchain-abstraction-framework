import { Duration, parseISO, differenceInCalendarDays, differenceInSeconds, isValid, intervalToDuration, add, format } from 'date-fns';
import { has, isEqual } from 'lodash';

import { EXTENDED_TIME_REGEX } from '@core/constants/constants';
import { Maybe, VerifiedExecutionCondition, DateCondition, TimeCondition, DatetimeCondition, AcceptedDateType, DateShouldBeBeforeReferenceCondition, DateShouldBeAfterReferenceCondition, DateShouldBeBetweenReferencesCondition, DateShouldEqualReferenceCondition, DayOfDateEqualsReferenceCondition, WeekDayOfDateEqualsReferenceCondition, MonthOfDateEqualsReferenceCondition, YearOfDateEqualsReferenceCondition, TimeShouldBeBeforeReferenceCondition, TimeShouldBeAfterReferenceCondition, TimeShouldBeBetweenReferencesCondition, TimeShouldEqualReferenceCondition, HoursOfTimeEqualReferenceCondition, MinutesOfTimeEqualReferenceCondition, SecondsOfTimeEqualReferenceCondition, DatetimeShouldBeBeforeReferenceCondition, DatetimeShouldBeAfterReferenceCondition, DatetimeShouldBeBetweenReferencesCondition, DatetimeShouldEqualReferenceCondition, AcceptedTimeType, DurationCondition, DurationBetweenDatesShouldBeLowerThanProvidedDurationCondition, DurationBetweenDatesShouldBeHigherThanProvidedDurationCondition, DurationBetweenDatesShouldEqualProvidedDurationCondition } from "@core/types/types";

export function VerifyDatetimeCondition(condition: DateCondition | TimeCondition | DatetimeCondition | DurationCondition): VerifiedExecutionCondition {
    switch (condition['condition']) {
        case 'date-is-before': {
            return VerifyDateIsBeforeOrAfterCondition(condition as DateShouldBeBeforeReferenceCondition, 'before');
        }
        case 'date-is-after': {
            return VerifyDateIsBeforeOrAfterCondition(condition as DateShouldBeAfterReferenceCondition, 'after');
        }
        case 'date-is-between': {
            return VerifyDateIsBetweenCondition(condition as DateShouldBeBetweenReferencesCondition);
        }
        case 'date-equals': {
            return VerifyDateEqualsCondition(condition as DateShouldEqualReferenceCondition);
        }
        case 'day-equals': {
            return VerifyDayEqualsCondition(condition as DayOfDateEqualsReferenceCondition);
        }
        case 'week-day-equals': {
            return VerifyWeekDayEqualsCondition(condition as WeekDayOfDateEqualsReferenceCondition);
        }
        case 'month-equals': {
            return VerifyMonthEqualsCondition(condition as MonthOfDateEqualsReferenceCondition);
        }
        case 'year-equals': {
            return VerifyYearEqualsCondition(condition as YearOfDateEqualsReferenceCondition);
        }
        case 'time-is-before': {
            return VerifyTimeIsBeforeOrAfterCondition(condition as TimeShouldBeBeforeReferenceCondition, 'before');
        }
        case 'time-is-after': {
            return VerifyTimeIsBeforeOrAfterCondition(condition as TimeShouldBeAfterReferenceCondition, 'after');
        }
        case 'time-is-between': {
            return VerifyIfTimeIsBetweenCondition(condition as TimeShouldBeBetweenReferencesCondition);
        }
        case 'time-equals': {
            return VerifyIfTimeEqualsCondition(condition as TimeShouldEqualReferenceCondition);
        }
        case 'hours-equal': {
            return VerifyIfHoursEqualCondition(condition as HoursOfTimeEqualReferenceCondition);
        }
        case 'minutes-equal': {
            return VerifyIfMinutesEqualCondition(condition as MinutesOfTimeEqualReferenceCondition);
        }
        case 'seconds-equal': {
            return VerifyIfSecondsEqualCondition(condition as SecondsOfTimeEqualReferenceCondition);
        }
        case 'datetime-is-before': {
            return VerifyDatetimeIsBeforeOrAfterCondition(condition as DatetimeShouldBeBeforeReferenceCondition, 'before');
        }
        case 'datetime-is-after': {
            return VerifyDatetimeIsBeforeOrAfterCondition(condition as DatetimeShouldBeAfterReferenceCondition, 'after');
        }
        case 'datetime-is-between': {
            return VerifyDatetimeIsBetweenCondition(condition as DatetimeShouldBeBetweenReferencesCondition);
        }
        case 'datetime-equals': {
            return VerifyDatetimeEqualsCondition(condition as DatetimeShouldEqualReferenceCondition);
        }
        case 'duration-between-dates-is-lower-than': {
            return VerifyIfDurationBetweenDatesIsLowerOrHigherThanReferenceCondition(condition as DurationBetweenDatesShouldBeLowerThanProvidedDurationCondition, 'lower');
        }
        case 'duration-between-dates-is-higher-than': {
            return VerifyIfDurationBetweenDatesIsLowerOrHigherThanReferenceCondition(condition as DurationBetweenDatesShouldBeHigherThanProvidedDurationCondition, 'higher');
        }
        case 'duration-between-dates-equals': {
            return VerifyIfDurationBetweenDatesEqualsReferenceCondition(condition as DurationBetweenDatesShouldEqualProvidedDurationCondition);
        }
        default: {
            throw new Error('Unrecognized datetime condition'); // TODO: Handle error
        }
    }
}

function VerifyDateIsBeforeOrAfterCondition(condition: DateShouldBeBeforeReferenceCondition | DateShouldBeAfterReferenceCondition, comparison: 'before' | 'after'): VerifiedExecutionCondition {
    const properties: typeof condition['properties'] = condition['properties'];

    if (!properties['date']?.['value'] || !properties['reference']?.['value']) {
        return Object.assign(condition, { validation: false, 'error': 'INVALID_PROPERTIES' });
    }

    const date: Date = FormatDate(properties['date']['value']);
    const reference: Date = FormatDate(properties['reference']['value']);

    if (!isValid(date) || !isValid(reference)) {
        return Object.assign(condition, { validation: false, 'error': 'INVALID_PROPERTIES' });
    }

    const strict: boolean = (properties['strict']?.['value'] !== undefined) ? properties['strict']['value'] : false;

    const difference: number = differenceInCalendarDays(reference, date);

    if (comparison === 'before') {
        if (((difference > 0) && strict) || ((difference >= 0) && !strict)) return Object.assign(condition, { validation: true });
        else return Object.assign(condition, { validation: false, 'error': 'DATE_NOT_BEFORE_REFERENCE' });
    } else if (comparison === 'after') {
        if (((difference < 0) && strict) || ((difference <= 0) && !strict)) return Object.assign(condition, { validation: true });
        else return Object.assign(condition, { validation: false, 'error': 'DATE_NOT_AFTER_REFERENCE' });
    } else return Object.assign(condition, { validation: false, 'error': 'INVALID_COMPARISON_TYPE' });
}

function VerifyDateIsBetweenCondition(condition: DateShouldBeBetweenReferencesCondition): VerifiedExecutionCondition {
    const properties: typeof condition['properties'] = condition['properties'];

    if (!properties['date']?.['value'] || !properties['lower']?.['value'] || !properties['upper']?.['value']) {
        return Object.assign(condition, { validation: false, 'error': 'INVALID_PROPERTIES' });
    }

    const date: Date = FormatDate(properties['date']['value']);
    const lower: Date = FormatDate(properties['lower']['value']);
    const upper: Date = FormatDate(properties['upper']['value']);

    if (!isValid(date) || !isValid(lower) || !isValid(upper)) {
        return Object.assign(condition, { validation: false, 'error': 'INVALID_PROPERTIES' });
    }

    const strict: boolean = (properties['strict']?.['value'] !== undefined) ? properties['strict']['value'] : false;

    const difference_with_lower: number = differenceInCalendarDays(date, lower);
    const difference_with_upper: number = differenceInCalendarDays(upper, date);

    if (!strict) {
        if ((difference_with_lower >= 0) && (difference_with_upper >= 0)) return Object.assign(condition, { validation: true });
        else return Object.assign(condition, { validation: false, 'error': 'DATE_NOT_BETWEEN_REFERENCES' });
    } else {
        if ((difference_with_lower > 0) && (difference_with_upper > 0)) return Object.assign(condition, { validation: true });
        else return Object.assign(condition, { validation: false, 'error': 'DATE_NOT_BETWEEN_REFERENCES' });
    }
}

function VerifyDateEqualsCondition(condition: DateShouldEqualReferenceCondition): VerifiedExecutionCondition {
    const properties: typeof condition['properties'] = condition['properties'];

    if (!properties['date']?.['value'] || !properties['reference']?.['value']) {
        return Object.assign(condition, { validation: false, 'error': 'INVALID_PROPERTIES' });
    }

    const date: Date = FormatDate(properties['date']['value']);
    const reference: Date = FormatDate(properties['reference']['value']);

    if (!isValid(date) || !isValid(reference)) {
        return Object.assign(condition, { validation: false, 'error': 'INVALID_PROPERTIES' });
    }

    const difference: number = differenceInCalendarDays(reference, date);

    if (difference === 0) return Object.assign(condition, { validation: true });
    else return Object.assign(condition, { validation: false, 'error': 'DATE_DIFFERENT_THAN_REFERENCE' });
}

function VerifyDayEqualsCondition(condition: DayOfDateEqualsReferenceCondition): VerifiedExecutionCondition {
    const properties: typeof condition['properties'] = condition['properties'];

    if (!properties['date']?.['value'] || !properties['reference']?.['value']) {
        return Object.assign(condition, { validation: false, 'error': 'INVALID_PROPERTIES' });
    }

    const date: Date = FormatDate(properties['date']['value']);
    if (!isValid(date)) return Object.assign(condition, { validation: false, 'error': 'INVALID_PROPERTIES' });

    let reference_as_nb_of_days: number;

    if (Number.isNaN(properties['reference'])) {
        const reference_parsed_as_nb: number = Number.parseInt(properties['reference']['value'] as string);
        if (Number.isNaN(reference_parsed_as_nb)) {
            const reference_parsed_as_date: Date = parseISO(properties['reference']['value'] as string);
            if (Number.isNaN(reference_parsed_as_date.getTime())) return Object.assign(condition, { validation: false, 'error': 'INVALID_PROPERTIES' });
            else reference_as_nb_of_days = reference_parsed_as_date.getUTCDate();
        } else if ((reference_parsed_as_nb > 0) && (reference_parsed_as_nb <= 31)) {
            reference_as_nb_of_days = reference_parsed_as_nb;
        } else {
            reference_as_nb_of_days = new Date(reference_parsed_as_nb).getUTCDate();
        }
    } else {
        const value: number = properties['reference']['value'] as number;
        if ((value > 0) && (value <= 31)) {
            reference_as_nb_of_days = value;
        } else {
            reference_as_nb_of_days = new Date(value).getUTCDate();
        }
    }

    if (date.getUTCDate() === reference_as_nb_of_days) return Object.assign(condition, { validation: true });
    else return Object.assign(condition, { validation: false, 'error': 'DAY_OF_DATE_AND_DAY_OF_REFERENCE_MISMATCH' });
}

function VerifyWeekDayEqualsCondition(condition: WeekDayOfDateEqualsReferenceCondition): VerifiedExecutionCondition {
    const properties: typeof condition['properties'] = condition['properties'];

    if (!properties['date']?.['value'] || !properties['reference']?.['value']) {
        return Object.assign(condition, { validation: false, 'error': 'INVALID_PROPERTIES' });
    }

    const date: Date = FormatDate(properties['date']['value']);
    if (!isValid(date)) return Object.assign(condition, { validation: false, 'error': 'INVALID_PROPERTIES' });

    let reference_as_week_day: number;

    if (Number.isNaN(properties['reference'])) {
        const reference_parsed_as_nb: number = Number.parseInt(properties['reference']['value'] as string);
        if (Number.isNaN(reference_parsed_as_nb)) {
            const reference_parsed_as_date: Date = parseISO(properties['reference']['value'] as string);
            if (Number.isNaN(reference_parsed_as_date.getTime())) {
                reference_as_week_day = GetNumberOfWeekDay(properties['reference']['value'] as string);
                if (Number.isNaN(reference_as_week_day)) return Object.assign(condition, { validation: false, 'error': 'INVALID_PROPERTIES' });
            } else {
                reference_as_week_day = reference_parsed_as_date.getUTCDay();
            }
        } else if ((reference_parsed_as_nb >= 0) && (reference_parsed_as_nb <= 6)) {
            reference_as_week_day = reference_parsed_as_nb;
        } else {
            reference_as_week_day = new Date(reference_parsed_as_nb).getUTCDay();
        }
    } else {
        const value: number = properties['reference']['value'] as number;
        if ((value >= 0) && (value <= 6)) {
            reference_as_week_day = value;
        } else {
            reference_as_week_day = new Date(value).getUTCDay();
        }
    }

    if (date.getUTCDay() === reference_as_week_day) return Object.assign(condition, { validation: true });
    else return Object.assign(condition, { validation: false, 'error': 'WEEKDAY_OF_DATE_AND_WEEKDAY_OF_REFERENCE_MISMATCH' });
}

function VerifyMonthEqualsCondition(condition: MonthOfDateEqualsReferenceCondition): VerifiedExecutionCondition {
    const properties: typeof condition['properties'] = condition['properties'];

    if (!properties['date']?.['value'] || !properties['reference']?.['value']) {
        return Object.assign(condition, { validation: false, 'error': 'INVALID_PROPERTIES' });
    }

    const date: Date = FormatDate(properties['date']['value']);
    if (!isValid(date)) return Object.assign(condition, { validation: false, 'error': 'INVALID_PROPERTIES' });

    let reference_as_month: number;

    if (Number.isNaN(properties['reference']['value'])) {
        const reference_parsed_as_nb: number = Number.parseInt(properties['reference']['value'] as string);
        if (Number.isNaN(reference_parsed_as_nb)) {
            const reference_parsed_as_date: Date = parseISO(properties['reference']['value'] as string);
            if (Number.isNaN(reference_parsed_as_date.getUTCMonth())) {
                reference_as_month = GetNumberOfMonth(properties['reference']['value'] as string);
                if (Number.isNaN(reference_as_month)) return Object.assign(condition, { validation: false, 'error': 'INVALID_PROPERTIES' });
            } else {
                reference_as_month = reference_parsed_as_date.getUTCMonth();
            }
        } else if ((reference_parsed_as_nb >= 0) && (reference_parsed_as_nb <= 11)) {
            reference_as_month = reference_parsed_as_nb;
        } else {
            reference_as_month = new Date(reference_parsed_as_nb).getUTCMonth();
        }
    } else {
        const value: number = properties['reference']['value'] as number;
        if ((value >= 0) && (value <= 11)) {
            reference_as_month = value;
        } else {
            reference_as_month = new Date(value).getUTCMonth();
        }
    }

    if (date.getUTCMonth() === reference_as_month) return Object.assign(condition, { validation: true });
    else return Object.assign(condition, { validation: false, 'error': 'MONTH_OF_DATE_AND_MONTH_OF_REFERENCE_MISMATCH' });
}

function VerifyYearEqualsCondition(condition: YearOfDateEqualsReferenceCondition): VerifiedExecutionCondition {
    const properties: typeof condition['properties'] = condition['properties'];

    if (!properties['date']?.['value'] || !properties['reference']?.['value']) {
        return Object.assign(condition, { validation: false, 'error': 'INVALID_PROPERTIES' });
    }

    const date: Date = FormatDate(properties['date']['value']);
    if (!isValid(date)) return Object.assign(condition, { validation: false, 'error': 'INVALID_PROPERTIES' });

    let reference_as_year: number;

    if (Number.isNaN(properties['reference']['value'])) {
        const reference_parsed_as_nb: number = Number.parseInt(properties['reference']['value'] as string);
        if (Number.isNaN(reference_parsed_as_nb)) {
            const reference_parsed_as_date: Date = parseISO(properties['reference']['value'] as string);
            if (Number.isNaN(reference_parsed_as_date.getUTCFullYear())) {
                return Object.assign(condition, { validation: false, 'error': 'INVALID_PROPERTIES' });
            } else {
                reference_as_year = reference_parsed_as_date.getUTCFullYear();
            }
        } else if ((reference_parsed_as_nb >= 1970) && (reference_parsed_as_nb <= 2100)) {
            reference_as_year = reference_parsed_as_nb;
        } else {
            reference_as_year = new Date(reference_parsed_as_nb).getUTCFullYear();
        }
    } else {
        const value: number = properties['reference']['value'] as number;
        if ((value >= 1970) && (value <= 2100)) {
            reference_as_year = value;
        } else {
            reference_as_year = new Date(value).getMonth();
        }
    }

    if (date.getUTCFullYear() === reference_as_year) return Object.assign(condition, { validation: true });
    else return Object.assign(condition, { validation: false, 'error': 'YEAR_OF_DATE_AND_YEAR_OF_REFERENCE_MISMATCH' });
}

function VerifyTimeIsBeforeOrAfterCondition(condition: TimeShouldBeBeforeReferenceCondition | TimeShouldBeAfterReferenceCondition, comparison: 'before' | 'after'): VerifiedExecutionCondition {
    const properties: typeof condition['properties'] = condition['properties'];

    if (!properties['date']?.['value'] || !properties['reference']?.['value']) {
        return Object.assign(condition, { validation: false, 'error': 'INVALID_PROPERTIES' });
    }

    const date: Date = FormatDate(properties['date']['value']);
    const reference: Date = FormatDate(properties['reference']['value']);

    if (!isValid(date) || !isValid(reference)) {
        return Object.assign(condition, { validation: false, 'error': 'INVALID_PROPERTIES' });
    }

    const strict: boolean = (properties['strict']?.['value'] !== undefined) ? properties['strict']['value'] : false;

    const difference: number = differenceInCalendarDays(reference, date);

    if (comparison === 'before') {
        if (((difference > 0) && strict) || ((difference >= 0) && !strict)) return Object.assign(condition, { validation: true });
        else return Object.assign(condition, { validation: false, 'error': 'DATE_NOT_BEFORE_REFERENCE' });
    } else if (comparison === 'after') {
        if (((difference < 0) && strict) || ((difference <= 0) && !strict)) return Object.assign(condition, { validation: true });
        else return Object.assign(condition, { validation: false, 'error': 'DATE_NOT_AFTER_REFERENCE' });
    } else return Object.assign(condition, { validation: false, 'error': 'INVALID_COMPARISON_TYPE' });
}

function VerifyIfTimeIsBetweenCondition(condition: TimeShouldBeBetweenReferencesCondition): VerifiedExecutionCondition {
    const properties: typeof condition['properties'] = condition['properties'];

    if (!properties['date']?.['value'] || !properties['lower']?.['value'] || !properties['upper']?.['value']) {
        return Object.assign(condition, { validation: false, 'error': 'INVALID_PROPERTIES' });
    }

    const strict: boolean = (properties['strict']?.['value'] !== undefined) ? properties['strict']['value'] : false;

    const date: Date = FormatDate(properties['date']['value']);
    if (!isValid(date)) return Object.assign(condition, { validation: false, 'error': 'INVALID_PROPERTIES' });

    
    let lower_as_date: Maybe<Date> = FormatTimeStringAsDate(properties['lower']['value']);
    let upper_as_date: Maybe<Date> = FormatTimeStringAsDate(properties['upper']['value']);

    if (!lower_as_date || !upper_as_date) return Object.assign(condition, { validation: false, 'error': 'INVALID_PROPERTIES' });


    const reverse: boolean = GetDifferenceOfSecondsBetweenDateAndReference(lower_as_date, upper_as_date) > 0;

    const is_time_after_lower: boolean = strict ? (GetDifferenceOfSecondsBetweenDateAndReference(date, lower_as_date) > 0) : (GetDifferenceOfSecondsBetweenDateAndReference(date, lower_as_date) >= 0);
    const is_time_before_upper: boolean = strict ? (GetDifferenceOfSecondsBetweenDateAndReference(date, lower_as_date) < 0) : (GetDifferenceOfSecondsBetweenDateAndReference(date, lower_as_date) <= 0);

    if ((!reverse && is_time_after_lower && is_time_before_upper) || (reverse && (is_time_after_lower || is_time_before_upper))) return Object.assign(condition, { validation: true });
    else return Object.assign(condition, { validation: false, 'error': 'DATE_NOT_BETWEEN_REFERENCES' });
}

function VerifyIfTimeEqualsCondition(condition: TimeShouldEqualReferenceCondition): VerifiedExecutionCondition {
    const properties: typeof condition['properties'] = condition['properties'];

    if (!properties['date']?.['value'] || !properties['reference']?.['value']) {
        return Object.assign(condition, { validation: false, 'error': 'INVALID_PROPERTIES' });
    }

    const date: Date = FormatDate(properties['date']['value']);
    const reference: Date = FormatDate(properties['reference']['value']);

    if (!isValid(date) || !isValid(reference)) {
        return Object.assign(condition, { validation: false, 'error': 'INVALID_PROPERTIES' });
    }

    const precision: 'minute' | 'second' = (properties['precision'] && ['minute', 'second'].includes(properties['precision'])) ? properties['precision'] : 'minute';

    switch (precision) {
        case 'minute': {
            if ((date.getUTCHours() === reference.getUTCHours()) && (date.getUTCMinutes() === reference.getUTCMinutes())) return Object.assign(condition, { validation: true });
            else return Object.assign(condition, { validation: false, 'error': 'DIFFERENT_TIME_BETWEEN_DATE_AND_REFERENCE' });
        }
        case 'second': {
            if ((date.getUTCHours() === reference.getUTCHours()) && (date.getUTCMinutes() === reference.getUTCMinutes()) && (date.getUTCSeconds() === reference.getUTCSeconds())) return Object.assign(condition, { validation: true });
            else return Object.assign(condition, { validation: false, 'error': 'DIFFERENT_TIME_BETWEEN_DATE_AND_REFERENCE' });
        }
    }
}

function VerifyIfHoursEqualCondition(condition: HoursOfTimeEqualReferenceCondition): VerifiedExecutionCondition {
    const properties: typeof condition['properties'] = condition['properties'];

    if (!properties['date']?.['value'] || !properties['reference']?.['value']) {
        return Object.assign(condition, { validation: false, 'error': 'INVALID_PROPERTIES' });
    }

    const date: Date = FormatDate(properties['date']['value']);
    const reference: Date = FormatDate(properties['reference']['value']);

    if (!isValid(date) || !isValid(reference)) {
        return Object.assign(condition, { validation: false, 'error': 'INVALID_PROPERTIES' });
    }

    if (date.getUTCHours() === reference.getUTCHours()) return Object.assign(condition, { validation: true });
    else return Object.assign(condition, { validation: false, 'error': 'DIFFERENT_HOURS_BETWEEN_DATE_AND_REFERENCE' });
}

function VerifyIfMinutesEqualCondition(condition: MinutesOfTimeEqualReferenceCondition): VerifiedExecutionCondition {
    const properties: typeof condition['properties'] = condition['properties'];

    if (!properties['date']?.['value'] || !properties['reference']?.['value']) {
        return Object.assign(condition, { validation: false, 'error': 'INVALID_PROPERTIES' });
    }

    const date: Date = FormatDate(properties['date']['value']);
    const reference: Date = FormatDate(properties['reference']['value']);

    if (!isValid(date) || !isValid(reference)) {
        return Object.assign(condition, { validation: false, 'error': 'INVALID_PROPERTIES' });
    }

    if (date.getUTCMinutes() === reference.getUTCMinutes()) return Object.assign(condition, { validation: true });
    else return Object.assign(condition, { validation: false, 'error': 'DIFFERENT_MINUTES_BETWEEN_DATE_AND_REFERENCE' });
}

function VerifyIfSecondsEqualCondition(condition: SecondsOfTimeEqualReferenceCondition): VerifiedExecutionCondition {
    const properties: typeof condition['properties'] = condition['properties'];

    if (!properties['date']?.['value'] || !properties['reference']?.['value']) {
        return Object.assign(condition, { validation: false, 'error': 'INVALID_PROPERTIES' });
    }

    const date: Date = FormatDate(properties['date']['value']);
    const reference: Date = FormatDate(properties['reference']['value']);

    if (!isValid(date) || !isValid(reference)) {
        return Object.assign(condition, { validation: false, 'error': 'INVALID_PROPERTIES' });
    }

    if (date.getUTCSeconds() === reference.getUTCSeconds()) return Object.assign(condition, { validation: true });
    else return Object.assign(condition, { validation: false, 'error': 'DIFFERENT_SECONDS_BETWEEN_DATE_AND_REFERENCE' });
}

function VerifyDatetimeIsBeforeOrAfterCondition(condition: DatetimeShouldBeBeforeReferenceCondition | DatetimeShouldBeAfterReferenceCondition, comparison: 'before' | 'after'): VerifiedExecutionCondition {
    const properties: typeof condition['properties'] = condition['properties'];

    if (!properties['date']?.['value'] || !properties['reference']?.['value']) {
        return Object.assign(condition, { validation: false, 'error': 'INVALID_PROPERTIES' });
    }

    const datetime: Date = FormatDate(properties['date']['value']);
    const reference: Date = FormatDate(properties['reference']['value']);

    if (!isValid(datetime) || !isValid(reference)) {
        return Object.assign(condition, { validation: false, 'error': 'INVALID_PROPERTIES' });
    }

    const strict: boolean = (properties['strict'] !== undefined) ? properties['strict'] : false;

    const difference: number = differenceInSeconds(reference, datetime);

    if (comparison === 'before') {
        if (((difference > 0) && strict) || ((difference >= 0) && !strict)) return Object.assign(condition, { validation: true });
        else return Object.assign(condition, { validation: false, 'error': 'DATETIME_NOT_BEFORE_REFERENCE' });
    } else if (comparison === 'after') {
        if (((difference < 0) && strict) || ((difference <= 0) && !strict)) return Object.assign(condition, { validation: true });
        else return Object.assign(condition, { validation: false, 'error': 'DATETIME_NOT_AFTER_REFERENCE' });
    } else return Object.assign(condition, { validation: false, 'error': 'INVALID_COMPARISON_TYPE' });
}

function VerifyDatetimeIsBetweenCondition(condition: DatetimeShouldBeBetweenReferencesCondition): VerifiedExecutionCondition {
    const properties: typeof condition['properties'] = condition['properties'];

    if (!properties['date']?.['value'] || !properties['lower']?.['value'] || !properties['upper']?.['value']) {
        return Object.assign(condition, { validation: false, 'error': 'INVALID_PROPERTIES' });
    }

    const datetime: Date = FormatDate(properties['date']['value']);
    const lower: Date = FormatDate(properties['lower']['value']);
    const upper: Date = FormatDate(properties['upper']['value']);

    if (!isValid(datetime) || !isValid(lower) || !isValid(upper)) {
        return Object.assign(condition, { validation: false, 'error': 'INVALID_PROPERTIES' });
    }

    const strict: boolean = (properties['strict']?.['value'] !== undefined) ? properties['strict']['value'] : false;

    const difference_with_lower: number = differenceInSeconds(datetime, lower);
    const difference_with_upper: number = differenceInSeconds(upper, datetime);

    if (!strict) {
        if ((difference_with_lower >= 0) && (difference_with_upper >= 0)) return Object.assign(condition, { validation: true });
        else return Object.assign(condition, { validation: false, 'error': 'DATETIME_NOT_BETWEEN_REFERENCES' });
    } else {
        if ((difference_with_lower > 0) && (difference_with_upper > 0)) return Object.assign(condition, { validation: true });
        else return Object.assign(condition, { validation: false, 'error': 'DATETIME_NOT_BETWEEN_REFERENCES' });
    }
}

function VerifyDatetimeEqualsCondition(condition: DatetimeShouldEqualReferenceCondition): VerifiedExecutionCondition {
    const properties: typeof condition['properties'] = condition['properties'];

    if (!properties['date']?.['value'] || !properties['reference']?.['value']) {
        return Object.assign(condition, { validation: false, 'error': 'INVALID_PROPERTIES' });
    }

    const datetime: Date = FormatDate(properties['date']['value']);
    const reference: Date = FormatDate(properties['reference']['value']);

    if (!isValid(datetime) || !isValid(reference)) {
        return Object.assign(condition, { validation: false, 'error': 'INVALID_PROPERTIES' });
    }

    const difference: number = differenceInSeconds(reference, datetime);

    const precision: 'minute' | 'second' = (properties['precision'] && ['minute', 'second'].includes(properties['precision'])) ? properties['precision'] : 'minute';

    switch (precision) {
        case 'minute': {
            if (difference < 60) return Object.assign(condition, { validation: true });
            else return Object.assign(condition, { validation: false, 'error': 'DATETIME_DIFFERENT_THAN_REFERENCE' });
        };
        case 'second': {
            if (difference === 0) return Object.assign(condition, { validation: true });
            else return Object.assign(condition, { validation: false, 'error': 'DATETIME_DIFFERENT_THAN_REFERENCE' });
        };
    }
}

function VerifyIfDurationBetweenDatesIsLowerOrHigherThanReferenceCondition(condition: DurationBetweenDatesShouldBeLowerThanProvidedDurationCondition | DurationBetweenDatesShouldBeHigherThanProvidedDurationCondition, comparison: 'lower' | 'higher'): VerifiedExecutionCondition {
    const properties: typeof condition['properties'] = condition['properties'];

    if (!has(properties, 'date1.value') || !has(properties, 'date2.value') || !has(properties, 'duration')) {
        return Object.assign(condition, { validation: false, 'error': 'INVALID_PROPERTIES' });
    }

    const date1: Date = FormatDate(properties['date1']['value']);
    const date2: Date = FormatDate(properties['date2']['value']);

    if (!isValid(date1) || !isValid(date2)) {
        return Object.assign(condition, { validation: false, 'error': 'INVALID_PROPERTIES' });
    }

    const strict: boolean = (properties['strict']?.['value'] !== undefined) ? properties['strict']['value'] : false;

    const reference_duration: Duration = properties['duration'];
    const duration_between_dates: Duration = intervalToDuration({ start: date1, end: date2});

    const nb_seconds_reference_duration: number = Number(format(add(0,reference_duration ), 't'));
    const nb_seconds_duration_between_dates: number = Number(format(add(0,duration_between_dates ), 't'));

    const difference: number = nb_seconds_reference_duration - nb_seconds_duration_between_dates;

    if (comparison === 'lower') {
        if (((difference > 0) && strict) || ((difference >= 0) && !strict)) return Object.assign(condition, { validation: true });
        else return Object.assign(condition, { validation: false, 'error': 'DURATION_BETWEEN_DATES_NOT_LOWER_THAN_REFERENCE' });
    } else if (comparison === 'higher') {
        if (((difference < 0) && strict) || ((difference <= 0) && !strict)) return Object.assign(condition, { validation: true });
        else return Object.assign(condition, { validation: false, 'error': 'DURATION_BETWEEN_DATES_NOT_HIGHER_THAN_REFERENCE' });
    } else return Object.assign(condition, { validation: false, 'error': 'INVALID_COMPARISON_TYPE' });
}

function VerifyIfDurationBetweenDatesEqualsReferenceCondition(condition: DurationBetweenDatesShouldEqualProvidedDurationCondition): VerifiedExecutionCondition {
    const properties: typeof condition['properties'] = condition['properties'];

    if (!has(properties, 'date1.value') || !has(properties, 'date2.value') || !has(properties, 'duration')) {
        return Object.assign(condition, { validation: false, 'error': 'INVALID_PROPERTIES' });
    }

    const date1: Date = FormatDate(properties['date1']['value']);
    const date2: Date = FormatDate(properties['date2']['value']);

    if (!isValid(date1) || !isValid(date2)) {
        return Object.assign(condition, { validation: false, 'error': 'INVALID_PROPERTIES' });
    }

    const reference_duration: Duration = properties['duration'];
    const duration_between_dates: Duration = intervalToDuration({ start: date1, end: date2});

    if (isEqual(reference_duration, duration_between_dates)) return Object.assign(condition, { validation: true });
    else return Object.assign(condition, { validation: false, 'error': 'DURATION_BETWEEN_DATES_DIFFERENT_THAN_REFERENCE' });
}

function FormatDate(date: AcceptedDateType): Date {
    if (!Number.isNaN(date) && Number.isInteger(date)) return new Date(date as number);
    else return parseISO(date as string);
}

function GetNumberOfWeekDay(weekday: string): number {
    weekday = weekday.toLowerCase();
    if (['sun', 'sunday'].includes(weekday)) return 0;
    else if (['mon', 'monday'].includes(weekday)) return 1;
    else if (['tue', 'tuesday'].includes(weekday)) return 2;
    else if (['wed', 'wednesday'].includes(weekday)) return 3;
    else if (['thu', 'thursday'].includes(weekday)) return 4;
    else if (['fri', 'friday'].includes(weekday)) return 5;
    else if (['sat', 'saturday'].includes(weekday)) return 6;
    else return Number.NaN;
}

function GetNumberOfMonth(month: string): number {
    month = month.toLowerCase();
    if (['jan', 'january'].includes(month)) return 0;
    else if (['feb', 'february'].includes(month)) return 1;
    else if (['mar', 'march'].includes(month)) return 2;
    else if (['apr', 'april'].includes(month)) return 3;
    else if (['may'].includes(month)) return 4;
    else if (['june'].includes(month)) return 5;
    else if (['july'].includes(month)) return 6;
    else if (['aug', 'august'].includes(month)) return 7;
    else if (['sep', 'september'].includes(month)) return 8;
    else if (['oct', 'october'].includes(month)) return 9;
    else if (['nov', 'november'].includes(month)) return 10;
    else if (['dec', 'december'].includes(month)) return 11;
    else return Number.NaN;
}

// TODO: Allow the submission of a reference date instead of using 1/1/2000
function FormatTimeStringAsDate(time: AcceptedTimeType): Maybe<Date> {
    let date: Date;
    if (Number.isNaN(time)) {
        const execution_results_time_regex: Maybe<{ 'hours': string, 'minutes': string, 'seconds'?: string }> = EXTENDED_TIME_REGEX.exec(time as string)?.groups as Maybe<{ 'hours': string, 'minutes': string, 'seconds'?: string }>
        if (!execution_results_time_regex) {
            date = parseISO(time as string);
            if (isValid(date)) return undefined;
        } else {
            date = new Date(`2000-01-01T${execution_results_time_regex['hours']}:${execution_results_time_regex['minutes']}${execution_results_time_regex['seconds'] ?? ':00'}`);
        }
    } else {
        date = new Date(time as number);
    }

    return date;
}

function GetDifferenceOfSecondsBetweenDateAndReference(date: Date, reference: Date, compare: 'date' | 'time' = 'time'): number {
    switch (compare) {
        case 'date': return differenceInSeconds(date, reference);
        case 'time': return ((date.getUTCHours() * 3600) + (date.getUTCMinutes() * 60) + (date.getUTCSeconds())) - ((reference.getUTCHours() * 3600) + (reference.getUTCMinutes() * 60) + (reference.getUTCSeconds()));
    }
}