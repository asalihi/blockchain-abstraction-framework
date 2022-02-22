import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateProcessComponent } from './create.component';

describe('CreateProcessComponent', () => {
  let component: CreateProcessComponent;
  let fixture: ComponentFixture<CreateProcessComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CreateProcessComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateProcessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
