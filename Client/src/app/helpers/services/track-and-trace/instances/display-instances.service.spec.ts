import { TestBed } from '@angular/core/testing';

import { DisplayInstancesService } from './display-instances.service';

describe('DisplayInstancesService', () => {
  let service: DisplayInstancesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DisplayInstancesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
