import { TestBed } from '@angular/core/testing';

import { InstanceController } from './controller.service';

describe('InstanceController', () => {
  let service: InstanceController;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InstanceController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
