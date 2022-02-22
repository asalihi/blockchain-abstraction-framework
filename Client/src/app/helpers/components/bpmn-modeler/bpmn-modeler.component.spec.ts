import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BPMNModelerComponent } from './bpmn-modeler.component';

describe('BPMNModelerComponent', () => {
  let component: BPMNModelerComponent;
  let fixture: ComponentFixture<BPMNModelerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BPMNModelerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BPMNModelerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
