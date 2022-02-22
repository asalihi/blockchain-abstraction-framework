import * as _ from 'lodash';

export function Capitalize(string_to_capitalize: string): string {
    let [first_letter, ...rest_of_string]: string[] = [...string_to_capitalize];
    return first_letter.toUpperCase() + rest_of_string.join('');
}

// See https://stackoverflow.com/a/38278831
export function CleanObject<T>(o: T): T {
  return _(o).pickBy(_.isObject).mapValues(CleanObject).omitBy(_.isEmpty).assign(_.omitBy(o, _.isObject)).value();
}
