import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DisplayModelerComponent } from './display-modeler.component';

describe('DisplayModelerComponent', () => {
  let component: DisplayModelerComponent;
  let fixture: ComponentFixture<DisplayModelerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DisplayModelerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DisplayModelerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
