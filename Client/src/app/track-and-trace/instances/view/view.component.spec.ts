import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewInstanceComponent } from './view.component';

describe('ViewInstanceComponent', () => {
  let component: ViewInstanceComponent;
  let fixture: ComponentFixture<ViewInstanceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ViewInstanceComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewInstanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
