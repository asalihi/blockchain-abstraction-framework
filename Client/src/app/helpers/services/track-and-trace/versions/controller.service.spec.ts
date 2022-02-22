import { TestBed } from '@angular/core/testing';

import { VersionController } from './controller.service';

describe('VersionController', () => {
  let service: VersionController;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VersionController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
