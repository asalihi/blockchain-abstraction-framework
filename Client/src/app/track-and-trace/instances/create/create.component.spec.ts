import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateInstanceComponent } from './create.component';

describe('CreateInstanceComponent', () => {
  let component: CreateInstanceComponent;
  let fixture: ComponentFixture<CreateInstanceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CreateInstanceComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateInstanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
