import { TestBed } from '@angular/core/testing';

import { ProcessController } from './controller.service';

describe('ProcessController', () => {
  let service: ProcessController;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProcessController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
