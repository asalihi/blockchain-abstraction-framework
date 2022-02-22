import { TestBed } from '@angular/core/testing';

import { DisplayTracesService } from './display-traces.service';

describe('DisplayTracesService', () => {
  let service: DisplayTracesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DisplayTracesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
