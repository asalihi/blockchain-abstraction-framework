import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CryptographyComponent } from './cryptography.component';

describe('CryptographyComponent', () => {
  let component: CryptographyComponent;
  let fixture: ComponentFixture<CryptographyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CryptographyComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CryptographyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
