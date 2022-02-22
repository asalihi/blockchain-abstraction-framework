import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewTraceComponent } from './view.component';

describe('ViewTraceComponent', () => {
  let component: ViewTraceComponent;
  let fixture: ComponentFixture<ViewTraceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ViewTraceComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewTraceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
