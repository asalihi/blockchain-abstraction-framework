import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewProcessComponent } from './view.component';

describe('ViewProcessComponent', () => {
  let component: ViewProcessComponent;
  let fixture: ComponentFixture<ViewProcessComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ViewProcessComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewProcessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
