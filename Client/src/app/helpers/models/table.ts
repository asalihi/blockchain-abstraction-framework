import { SortableColumn, SortDirection } from '@client/helpers/directives/sortable.directive';

export interface ITableState<T> {
  'page': number,
  'size': number,
  'filter': string,
  'sort_field': Omit<SortableColumn<T>, ''>,
  'sort_direction': Omit<SortDirection, ''>
}
