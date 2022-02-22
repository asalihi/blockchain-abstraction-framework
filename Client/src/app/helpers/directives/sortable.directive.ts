import { Directive, EventEmitter, Input, Output } from '@angular/core';

export type SortableColumn<T> = keyof T | '';
export type SortDirection = 'asc' | 'desc' | '';
const rotate: { [key: string]: SortDirection } = { 'desc': 'asc', 'asc': '', '': 'desc' };

export interface SortEvent<T> {
  column: SortableColumn<T>;
  direction: SortDirection;
}

@Directive({
  selector: 'th[sortable]',
  host: {
    '[class.asc]': 'direction === "asc"',
    '[class.desc]': 'direction === "desc"',
    '(click)': 'rotate()'
  }
})
export class NgbdSortableHeader<T> {

  @Input() sortable: SortableColumn<T> = '';
  @Input() direction: SortDirection = 'desc';
  @Output() sort = new EventEmitter<SortEvent<T>>();

  rotate() {
    this.direction = rotate[this.direction];
    this.sort.emit({ column: this.sortable, direction: this.direction });
  }
}
