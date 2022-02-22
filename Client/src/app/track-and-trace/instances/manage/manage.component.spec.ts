import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageInstanceStateComponent } from './manage.component';

describe('ManageInstanceStateComponent', () => {
  let component: ManageInstanceStateComponent;
  let fixture: ComponentFixture<ManageInstanceStateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ManageInstanceStateComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ManageInstanceStateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
