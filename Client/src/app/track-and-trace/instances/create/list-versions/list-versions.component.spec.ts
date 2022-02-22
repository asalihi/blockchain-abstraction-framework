import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListOfVersionsMinimalComponent } from './list-versions.component';

describe('ListOfVersionsMinimalComponent', () => {
    let component: ListOfVersionsMinimalComponent;
    let fixture: ComponentFixture<ListOfVersionsMinimalComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ListOfVersionsMinimalComponent]
        })
            .compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ListOfVersionsMinimalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
