import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JSONInputComponent } from './json-input.component';

describe('JSONInputComponent', () => {
  let component: JSONInputComponent;
  let fixture: ComponentFixture<JSONInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [JSONInputComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(JSONInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
