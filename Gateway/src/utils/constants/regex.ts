// TODO: Remove unused RegExp
export const DATE_REGEX = new RegExp(/\s*(?<date>(3[01]|[12][0-9]|0?[1-9])(1[012]|0?[1-9])((?:19|20)\d{2}))\s*/);
export const DURATION_REGEX = new RegExp(/^(?<value>\d+|\d+\.\d+) ?(?<unit>seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)$/i);
export const JWKS_FILE: RegExp = new RegExp(/^JWKS_?<creation>(\s*(3[01]|[12][0-9]|0?[1-9])(1[012]|0?[1-9])((?:19|20)\d{2})\s*).json$/);
export const HTTP_SIGNATURE_REGEX: RegExp = new RegExp(/^Signature jwks=(?<jwks>(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{4})),kid=(?<kid>(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{4})),sig=(?<signature>(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{4}))$/);
export const EXTENDED_DATE_REGEX: RegExp = new RegExp(/^(((0?[1-9]|[12]\d|3[01])\.(0[13578]|[13578]|1[02])\.((1[6-9]|[2-9]\d)\d{2}))|((0?[1-9]|[12]\d|30)\.(0[13456789]|[13456789]|1[012])\.((1[6-9]|[2-9]\d)\d{2}))|((0?[1-9]|1\d|2[0-8])\.0?2\.((1[6-9]|[2-9]\d)\d{2}))|(29\.0?2\.((1[6-9]|[2-9]\d)(0[48]|[2468][048]|[13579][26])|((16|[2468][048]|[3579][26])00))))$/);
export const TIME_REGEX: RegExp = new RegExp(/^([0-1][0-9]|[2][0-3]):([0-5][0-9])$/);
export const BEARER_JWT_SIGNED_TOKEN = new RegExp(/^Bearer\s(?<token>[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.[A-Za-z0-9-_.+/=]+)$/);