import { TestBed } from '@angular/core/testing';

import { DisplayVersionsService } from './display-versions.service';

describe('DisplayVersionsService', () => {
  let service: DisplayVersionsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DisplayVersionsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
