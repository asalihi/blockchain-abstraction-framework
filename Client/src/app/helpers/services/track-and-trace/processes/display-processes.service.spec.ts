import { TestBed } from '@angular/core/testing';

import { DisplayProcessesService } from './display-processes.service';

describe('DisplayProcessesService', () => {
  let service: DisplayProcessesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DisplayProcessesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
