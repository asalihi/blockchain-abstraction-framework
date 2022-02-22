import { TestBed } from '@angular/core/testing';

import { TraceController } from './controller.service';

describe('TraceController', () => {
  let service: TraceController;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TraceController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
