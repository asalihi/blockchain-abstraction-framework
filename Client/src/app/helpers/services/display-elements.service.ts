import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { map, switchMap, tap, debounceTime, finalize } from 'rxjs/operators';

import { DELAY_BETWEEN_TWO_SUCCESSIVE_REQUESTS } from '@client/helpers/constants/constants';
import { ITableState } from '@client/helpers/models/table';
import { SortableColumn, SortDirection } from '@client/helpers/directives/sortable.directive';

export abstract class DisplayElementsService<Columns, ListType, ElementType> {
    abstract list_name: string;
    protected data: any;
    protected is_loading = new BehaviorSubject<boolean>(true);
    public search = new Subject<void>();
    protected elements = new BehaviorSubject<ElementType[]>([]);
    protected fetched = new BehaviorSubject<number>(0);
    public state: ITableState<ElementType> = { 'page': 1, 'size': 10, 'filter': '', 'sort_field': '', 'sort_direction': 'desc' };

    constructor(protected http: HttpClient, data?: any) {
        this.data = data;
        this.search.pipe(
            tap(() => this.is_loading.next(true)),
            debounceTime(DELAY_BETWEEN_TWO_SUCCESSIVE_REQUESTS),
            switchMap(() => this.fetch().pipe(
                map((result: any) => {
                    this.elements.next(result[this.list_name]);
                    this.fetched.next(result['items']);
                }),
                finalize(() => this.is_loading.next(false)))
            )).subscribe();

        this.search.next();
    }

    public get_elements(): BehaviorSubject<ElementType[]> {
        return this.elements;
    }

    public get_number_of_elements(): Observable<number> {
        return this.fetched.asObservable();
    }

    get loading(): Observable<boolean> {
        return this.is_loading.asObservable();
    }

    get current_page(): number {
        return this.state['page'];
    }

    get page_size(): number {
        return this.state['size'];
    }

    get filter_term(): string {
        return this.state['filter'];
    }

    get sort_field(): Omit<SortableColumn<Columns>, ''> {
        return this.state['sort_field'];
    }

    get sort_direction(): Omit<SortDirection, ''> {
        return this.state['sort_direction'];
    }

    set current_page(page: number) {
        this.update_state({ page });
    }

    set page_size(size: number) {
        this.update_state({ size });
    }

    set filter_term(filter: string) {
        this.update_state({ filter });
    }

    set sort_field(sort_field: Omit<SortableColumn<Columns>, ''>) {
        this.update_state({ sort_field });
    }

    set sort_direction(sort_direction: Omit<SortDirection, ''>) {
        this.update_state({ sort_direction });
    }

    protected update_state(update: Partial<ITableState<Columns>>): void {
        Object.assign(this.state, update);
        this.search.next();
    }

    protected abstract fetch(): Observable<ListType>;
}
