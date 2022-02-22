import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListOfProcessesMinimalComponent } from './list-processes.component';

describe('ListOfProcessesMinimalComponent', () => {
    let component: ListOfProcessesMinimalComponent;
    let fixture: ComponentFixture<ListOfProcessesMinimalComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ListOfProcessesMinimalComponent]
        })
            .compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ListOfProcessesMinimalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
